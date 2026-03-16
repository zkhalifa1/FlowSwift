/**
 * Audio Validation Service
 *
 * ⚠️ CURRENTLY DISABLED ⚠️
 *
 * This validation was causing issues with webm file format compatibility.
 * Browser's HTML5 audio element couldn't reliably decode webm metadata.
 *
 * Audio validation is now handled by OpenAI Whisper API on the backend,
 * which is more robust and supports a wider range of audio formats.
 *
 * This file is kept for potential future use if client-side validation
 * becomes necessary again.
 */

import { logger } from "@/utils/logger";
/**
 * Audio Validation Service
 * Validates audio files before transcription to skip empty, short, or silent recordings
 */

// Validation thresholds - configurable
const VALIDATION_CONFIG = {
  minDuration: 3.0,        // Minimum 3 seconds (user requirement)
  maxDuration: 300.0,      // Maximum 5 minutes
  minRMS: 0.01,           // Minimum RMS volume threshold
  maxSilenceRatio: 0.9,   // Maximum 90% silence allowed
  speechFreqMin: 80,      // Speech frequency range minimum (Hz)
  speechFreqMax: 4000,    // Speech frequency range maximum (Hz)
  minSpeechEnergy: 0.2    // Minimum energy in speech frequencies (20%)
};

/**
 * Get audio duration using Web Audio API
 * @param {Blob} audioBlob - Audio blob to analyze
 * @returns {Promise<number>} Duration in seconds
 */
async function getAudioDuration(audioBlob) {
  try {
    // Try Web Audio API first (most reliable)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();
    return audioBuffer.duration;
  } catch (error) {
    logger.warn('Web Audio API failed, trying HTML5 audio:', error);
    
    // Fallback to HTML5 audio element
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      };
      
      audio.src = url;
    });
  }
}

/**
 * Calculate RMS (Root Mean Square) for audio volume analysis
 * @param {Float32Array} audioData - Audio channel data
 * @returns {number} RMS value (0.0 to 1.0)
 */
function calculateRMS(audioData) {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  return Math.sqrt(sum / audioData.length);
}

/**
 * Detect silence in audio frames
 * @param {Float32Array} audioData - Audio channel data
 * @param {number} threshold - Silence threshold
 * @param {number} sampleRate - Audio sample rate
 * @returns {number} Silence ratio (0.0 to 1.0)
 */
function detectSilenceRatio(audioData, threshold, sampleRate) {
  const frameSize = Math.floor(sampleRate * 0.1); // 100ms frames
  let silentFrames = 0;
  let totalFrames = 0;
  
  for (let i = 0; i < audioData.length; i += frameSize) {
    const frameEnd = Math.min(i + frameSize, audioData.length);
    const frame = audioData.slice(i, frameEnd);
    const rms = calculateRMS(frame);
    
    if (rms < threshold) {
      silentFrames++;
    }
    totalFrames++;
  }
  
  return totalFrames > 0 ? silentFrames / totalFrames : 1.0;
}

/**
 * Analyze speech frequency characteristics
 * @param {AudioBuffer} audioBuffer - Decoded audio buffer
 * @returns {Object} Speech analysis results
 */
async function analyzeSpeechCharacteristics(audioBuffer) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioBuffer.sampleRate;
    const audioData = audioBuffer.getChannelData(0);
    
    // Create offline context for analysis
    const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      1, 
      audioBuffer.length, 
      sampleRate
    );
    
    // Create source and analyser
    const source = offlineContext.createBufferSource();
    const analyser = offlineContext.createAnalyser();
    
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(offlineContext.destination);
    
    // Get frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    // Calculate energy in speech frequency bands
    const nyquist = sampleRate / 2;
    const binSize = nyquist / analyser.frequencyBinCount;
    
    const speechStartBin = Math.floor(VALIDATION_CONFIG.speechFreqMin / binSize);
    const speechEndBin = Math.floor(VALIDATION_CONFIG.speechFreqMax / binSize);
    
    let totalEnergy = 0;
    let speechEnergy = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const energy = frequencyData[i] / 255.0; // Normalize to 0-1
      totalEnergy += energy;
      
      if (i >= speechStartBin && i <= speechEndBin) {
        speechEnergy += energy;
      }
    }
    
    const speechEnergyRatio = totalEnergy > 0 ? speechEnergy / totalEnergy : 0;
    
    audioContext.close();
    
    return {
      speechEnergyRatio,
      totalEnergy,
      speechEnergy,
      hasSpeechCharacteristics: speechEnergyRatio >= VALIDATION_CONFIG.minSpeechEnergy
    };
  } catch (error) {
    logger.warn('Speech frequency analysis failed:', error);
    return {
      speechEnergyRatio: 0,
      totalEnergy: 0,
      speechEnergy: 0,
      hasSpeechCharacteristics: true // Default to true on error
    };
  }
}

/**
 * Comprehensive audio validation for transcription
 * @param {Blob} audioBlob - Audio blob to validate
 * @returns {Promise<Object>} Validation result with metrics
 */
export async function validateAudioForTranscription(audioBlob) {
  const result = {
    isValid: false,
    reason: null,
    metrics: {
      duration: 0,
      rms: 0,
      silenceRatio: 0,
      speechEnergyRatio: 0,
      fileSize: audioBlob.size
    }
  };
  
  try {
    // Step 1: Duration validation
    const duration = await getAudioDuration(audioBlob);
    result.metrics.duration = duration;
    
    if (duration < VALIDATION_CONFIG.minDuration) {
      result.reason = `Recording too short (${duration.toFixed(1)}s < ${VALIDATION_CONFIG.minDuration}s)`;
      return result;
    }
    
    if (duration > VALIDATION_CONFIG.maxDuration) {
      result.reason = `Recording too long (${duration.toFixed(1)}s > ${VALIDATION_CONFIG.maxDuration}s)`;
      return result;
    }
    
    // Step 2: Decode audio for analysis
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Step 3: Volume analysis
    const audioData = audioBuffer.getChannelData(0);
    const rms = calculateRMS(audioData);
    result.metrics.rms = rms;
    
    if (rms < VALIDATION_CONFIG.minRMS) {
      result.reason = `Recording too quiet (RMS: ${rms.toFixed(4)} < ${VALIDATION_CONFIG.minRMS})`;
      audioContext.close();
      return result;
    }
    
    // Step 4: Silence detection
    const silenceRatio = detectSilenceRatio(audioData, VALIDATION_CONFIG.minRMS, audioBuffer.sampleRate);
    result.metrics.silenceRatio = silenceRatio;
    
    if (silenceRatio > VALIDATION_CONFIG.maxSilenceRatio) {
      result.reason = `Too much silence (${(silenceRatio * 100).toFixed(1)}% > ${VALIDATION_CONFIG.maxSilenceRatio * 100}%)`;
      audioContext.close();
      return result;
    }
    
    // Step 5: Speech frequency analysis (optional, more advanced)
    const speechAnalysis = await analyzeSpeechCharacteristics(audioBuffer);
    result.metrics.speechEnergyRatio = speechAnalysis.speechEnergyRatio;
    
    // If we get here, the audio passed all basic validations
    result.isValid = true;
    result.reason = 'Audio validation passed';
    
    audioContext.close();
    return result;
    
  } catch (error) {
    logger.error('Audio validation failed:', error);
    result.reason = `Validation error: ${error.message}`;
    return result;
  }
}

