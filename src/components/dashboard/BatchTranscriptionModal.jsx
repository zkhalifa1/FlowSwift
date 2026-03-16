import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  analyzeTranscriptionNeeds, 
  batchTranscribe, 
  estimateBatchCost,
  getBatchRecommendations 
} from '@/services/batchTranscriptionService';
import { useAuth } from '@/contexts/authContext';
import { logger } from "@/utils/logger";


export default function BatchTranscriptionModal({ isOpen, onClose, voiceNotes }) {
  const { currentUser } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentNote: null });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  // Analyze transcription needs when modal opens
  useEffect(() => {
    if (isOpen && voiceNotes.length > 0) {
      const analysisResult = analyzeTranscriptionNeeds(voiceNotes);
      setAnalysis(analysisResult);
      setResults(null);
      setErrors([]);
      setProgress({ current: 0, total: 0, currentNote: null });
    }
  }, [isOpen, voiceNotes]);

  const handleStartBatch = async () => {
    if (!analysis || !currentUser) return;

    setIsProcessing(true);
    setResults(null);
    setErrors([]);

    try {
      const batchResults = await batchTranscribe(
        analysis.needsTranscription,
        currentUser.uid,
        // Progress callback
        (current, total, note) => {
          setProgress({ current, total, currentNote: note });
        },
        // Error callback
        (error, note) => {
          setErrors(prev => [...prev, { note, error: error.message }]);
        }
      );

      setResults(batchResults);
    } catch (error) {
      logger.error('Batch transcription failed:', error);
      setErrors(prev => [...prev, { error: error.message }]);
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0, currentNote: null });
    }
  };

  const costEstimate = analysis ? estimateBatchCost(analysis.needsTranscription) : null;
  const recommendations = analysis ? getBatchRecommendations(analysis) : null;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Batch Transcription</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Analysis Summary */}
            {analysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.total}</div>
                  <div className="text-sm text-blue-700">Total Notes</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{analysis.completed.length}</div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{analysis.needsTranscription.length}</div>
                  <div className="text-sm text-yellow-700">Need Transcription</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{analysis.failed.length}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>
            )}

            {/* Cost Estimate */}
            {costEstimate && costEstimate.noteCount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium">Cost Estimate</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{costEstimate.noteCount} notes</div>
                    <div className="text-gray-600">To transcribe</div>
                  </div>
                  <div>
                    <div className="font-medium">~{costEstimate.estimatedMinutes} min</div>
                    <div className="text-gray-600">Estimated audio</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">{costEstimate.costFormatted}</div>
                    <div className="text-gray-600">Estimated cost</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations && (
              <div className="space-y-2">
                {recommendations.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      rec.type === 'success' ? 'bg-green-50 text-green-700' :
                      rec.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {rec.type === 'success' && <CheckCircle className="w-4 h-4" />}
                    {rec.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                    {rec.type === 'info' && <Clock className="w-4 h-4" />}
                    {rec.message}
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Processing...</span>
                  <span className="text-sm text-gray-600">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                    }}
                  />
                </div>
                {progress.currentNote && (
                  <div className="text-sm text-gray-600">
                    Transcribing: {new Date(progress.currentNote.timestamp?.seconds * 1000 || progress.currentNote.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-3">
                <h3 className="font-medium text-green-600">Batch Transcription Complete!</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-600">{results.completed}</div>
                    <div className="text-sm text-green-700">Completed</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-red-600">Errors:</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {errors.map((error, idx) => (
                    <div key={idx} className="text-sm bg-red-50 p-2 rounded text-red-700">
                      {error.note ? `Note ${error.note.id}: ` : ''}{error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              {results ? 'Close' : 'Cancel'}
            </Button>
            {recommendations?.canProceed && !results && (
              <Button
                onClick={handleStartBatch}
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Batch Transcription
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}