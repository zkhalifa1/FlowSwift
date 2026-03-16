import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { colors } from "@/styles/colors";
import { extractBlocksFromTemplate } from "@/services/templateService";
import { logger } from "@/utils/logger";

/**
 * Report Block Viewer - View generated report blocks (read-only)
 */
export default function ReportBlockViewer({ report, onClose }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load blocks when report changes
  useEffect(() => {
    if (report?.downloadURL) {
      loadBlocks();
    }
  }, [report]);

  const loadBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Reuse the same extraction function - it works for reports too
      const extractedBlocks = await extractBlocksFromTemplate(report.downloadURL);
      setBlocks(extractedBlocks);
    } catch (err) {
      logger.error("Failed to load report blocks:", err);
      setError("Failed to load report blocks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: colors.background.cream }}
    >
      {/* Header */}
      <div className="pt-4 pb-3 px-2 flex justify-between items-center border-b"
        style={{ borderColor: colors.ui.borderLight }}
      >
        <div className="flex-1 min-w-0">
          <h2
            className="text-lg font-semibold truncate"
            style={{ color: colors.text.primary }}
          >
            Preview: {report?.name}
          </h2>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded transition-colors"
          style={{ color: colors.text.secondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: colors.primary.main }}
            />
            <span className="ml-2 text-sm" style={{ color: colors.text.secondary }}>
              Loading blocks...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: colors.status.error }}>
              {error}
            </p>
            <button
              onClick={loadBlocks}
              className="mt-2 text-sm underline"
              style={{ color: colors.primary.main }}
            >
              Try again
            </button>
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: colors.text.tertiary }}>
              No blocks found in this report.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="rounded-lg p-3"
                style={{
                  backgroundColor: colors.background.white,
                  border: `1px solid ${colors.ui.borderLight}`,
                }}
              >
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: colors.text.tertiary }}
                >
                  Block {index + 1}
                </label>
                <div
                  className="w-full px-3 py-2 rounded-md text-sm whitespace-pre-wrap"
                  style={{
                    backgroundColor: colors.background.cream,
                    border: `1px solid ${colors.ui.borderLight}`,
                    color: colors.text.primary,
                  }}
                >
                  {block.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
