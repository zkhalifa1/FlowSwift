import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, functions } from '@/apis/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { logger } from '@/utils/logger';

/**
 * Usage Meter Component
 * Displays user's monthly quotas and rate limits
 */
const UsageMeter = () => {
  const { currentUser } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for user document
    const userDocRef = doc(db, 'users', currentUser.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnapshot) => {
        try {
          setError(null);

          let userData = docSnapshot.data();

          // If user document doesn't exist, create it
          if (!userData) {
            logger.info('User document not found, creating it...');
            const ensureUserDocument = httpsCallable(functions, 'ensureUserDocument');
            await ensureUserDocument();
            // The snapshot listener will trigger again after creation
            return;
          }

          // Get subscription tier limits
          const limits = getSubscriptionLimits(userData.subscriptionTier || 'starter');

          setUsage({
            tier: userData.subscriptionTier || 'starter',
            transcriptionUsage: userData.transcriptionUsage || 0,
            limits,
            currentPeriodEnd: userData.currentPeriodEnd,
          });

          setLoading(false);
        } catch (err) {
          logger.error('Error fetching usage data:', err);
          setError('Failed to load usage data');
          setLoading(false);
        }
      },
      (err) => {
        logger.error('Error listening to usage data:', err);
        setError('Failed to load usage data');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  const getSubscriptionLimits = (tier) => {
    const tierLimits = {
      starter: {
        transcription: 50,
        label: 'Starter',
        color: 'text-blue-400',
      },
      professional: {
        transcription: 1000,
        label: 'Professional',
        color: 'text-purple-400',
      },
      enterprise: {
        transcription: -1, // Unlimited
        label: 'Enterprise',
        color: 'text-yellow-400',
      },
    };

    return tierLimits[tier] || tierLimits.starter;
  };

  const calculatePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatPeriodEnd = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 shadow-2xl">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const isUnlimited = usage.limits.transcription === -1;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Usage Overview</h3>
          <p className="text-sm text-zinc-400">
            Current Plan: <span className={`font-medium ${usage.limits.color}`}>{usage.limits.label}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Resets on</p>
          <p className="text-sm text-zinc-300 font-medium">{formatPeriodEnd(usage.currentPeriodEnd)}</p>
        </div>
      </div>

      {/* Usage Meters */}
      {isUnlimited ? (
        <div className="text-center py-4">
          <p className="text-yellow-400 font-medium">Unlimited Transcriptions</p>
          <p className="text-zinc-400 text-sm mt-1">No limits on your Enterprise plan</p>
        </div>
      ) : (
        <UsageBar
          label="Audio Transcriptions"
          used={usage.transcriptionUsage}
          limit={usage.limits.transcription}
          icon="🎤"
        />
      )}

      {/* Rate Limit Notice */}
      <div className="mt-6 pt-4 border-t border-zinc-700">
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">Rate Limits:</span> Additional per-minute, per-hour,
          and per-day limits apply to prevent abuse.
        </p>
      </div>

      {/* Upgrade CTA (for starter tier) */}
      {usage.tier === 'starter' && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">
            Need more? Upgrade to <span className="font-semibold">Professional</span> for 1,000
            transcriptions/month or <span className="font-semibold">Enterprise</span> for unlimited transcriptions.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Usage Bar Component
 */
const UsageBar = ({ label, used, limit, icon }) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const progressColor = percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  const isNearingLimit = percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-300 flex items-center gap-2">
          <span>{icon}</span>
          {label}
        </span>
        <span className={`text-sm font-medium ${isNearingLimit ? 'text-yellow-400' : 'text-zinc-400'}`}>
          {used} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning if near limit */}
      {isNearingLimit && (
        <p className="text-xs text-yellow-400 mt-1">
          {percentage >= 100 ? 'Limit reached' : 'Approaching limit'}
        </p>
      )}
    </div>
  );
};

export default UsageMeter;
