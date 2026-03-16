const admin = require("firebase-admin");
const functions = require("firebase-functions");

/**
 * Advanced Rate Limiting System
 * Implements per-minute, per-hour, and per-day limits
 */

const RATE_LIMITS = {
  // Per-minute limits (prevent rapid abuse)
  perMinute: {
    transcribeAudio: 10,
    generateReport: 5,
    sendChatMessage: 20,
  },
  // Per-hour limits (prevent sustained abuse)
  perHour: {
    transcribeAudio: 100,
    generateReport: 50,
    sendChatMessage: 200,
  },
  // Per-day limits (overall daily cap)
  perDay: {
    transcribeAudio: 500,
    generateReport: 200,
    sendChatMessage: 1000,
  },
};

/**
 * Check rate limit for a specific window
 * @param {string} userId - User ID
 * @param {string} endpoint - Function name
 * @param {string} window - 'perMinute', 'perHour', or 'perDay'
 * @returns {Promise<Object>} - { allowed: boolean, remaining: number, resetTime?: string }
 */
async function checkRateLimit(userId, endpoint, window = "perMinute") {
  const db = admin.firestore();
  const now = Date.now();

  // Determine window duration
  let windowDuration;
  switch (window) {
    case "perMinute":
      windowDuration = 60 * 1000; // 1 minute
      break;
    case "perHour":
      windowDuration = 60 * 60 * 1000; // 1 hour
      break;
    case "perDay":
      windowDuration = 24 * 60 * 60 * 1000; // 24 hours
      break;
    default:
      windowDuration = 60 * 1000;
  }

  const rateLimitId = `${userId}_${endpoint}_${window}`;
  const rateLimitRef = db.collection("rateLimits").doc(rateLimitId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      if (!doc.exists) {
        // Create new rate limit record
        transaction.set(rateLimitRef, {
          userId,
          endpoint,
          window,
          count: 1,
          windowStart: now,
          windowEnd: now + windowDuration,
        });
        const limit = RATE_LIMITS[window][endpoint];
        return { allowed: true, remaining: limit - 1 };
      }

      const data = doc.data();

      // Check if window expired
      if (now > data.windowEnd) {
        // Reset window
        transaction.update(rateLimitRef, {
          count: 1,
          windowStart: now,
          windowEnd: now + windowDuration,
        });
        const limit = RATE_LIMITS[window][endpoint];
        return { allowed: true, remaining: limit - 1 };
      }

      // Check if limit exceeded
      const limit = RATE_LIMITS[window][endpoint];
      if (data.count >= limit) {
        const resetTime = new Date(data.windowEnd).toISOString();
        const resetIn = Math.ceil((data.windowEnd - now) / 1000); // seconds
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          resetIn,
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        };
      }

      // Increment count
      transaction.update(rateLimitRef, {
        count: admin.firestore.FieldValue.increment(1),
      });

      return { allowed: true, remaining: limit - data.count - 1 };
    });

    if (!result.allowed) {
      throw new functions.https.HttpsError("resource-exhausted", result.message);
    }

    return result;
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error("Rate limit check error:", error);
    // Fail open (allow request) to prevent rate limit system from blocking service entirely
    return { allowed: true, remaining: 0 };
  }
}

/**
 * Check all rate limits (minute, hour, day)
 * @param {string} userId
 * @param {string} endpoint
 * @returns {Promise<void>}
 */
async function checkAllRateLimits(userId, endpoint) {
  // Check per-minute limit
  await checkRateLimit(userId, endpoint, "perMinute");

  // Check per-hour limit
  await checkRateLimit(userId, endpoint, "perHour");

  // Check per-day limit
  await checkRateLimit(userId, endpoint, "perDay");
}

/**
 * Get rate limit status for a user/endpoint
 * @param {string} userId
 * @param {string} endpoint
 * @returns {Promise<Object>} - Current rate limit status
 */
async function getRateLimitStatus(userId, endpoint) {
  const db = admin.firestore();
  const status = {};

  for (const window of ["perMinute", "perHour", "perDay"]) {
    const rateLimitId = `${userId}_${endpoint}_${window}`;
    const doc = await db.collection("rateLimits").doc(rateLimitId).get();

    if (doc.exists) {
      const data = doc.data();
      const limit = RATE_LIMITS[window][endpoint];
      const now = Date.now();

      if (now > data.windowEnd) {
        // Window expired
        status[window] = {
          count: 0,
          limit,
          remaining: limit,
          resetAt: null,
        };
      } else {
        status[window] = {
          count: data.count,
          limit,
          remaining: Math.max(0, limit - data.count),
          resetAt: new Date(data.windowEnd).toISOString(),
          resetIn: Math.ceil((data.windowEnd - now) / 1000),
        };
      }
    } else {
      const limit = RATE_LIMITS[window][endpoint];
      status[window] = {
        count: 0,
        limit,
        remaining: limit,
        resetAt: null,
      };
    }
  }

  return status;
}

module.exports = {
  checkRateLimit,
  checkAllRateLimits,
  getRateLimitStatus,
  RATE_LIMITS,
};
