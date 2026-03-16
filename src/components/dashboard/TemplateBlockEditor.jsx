import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { colors } from "@/styles/colors";
import { extractBlocksFromTemplate, saveBlocksToTemplate } from "@/services/templateService";
import { useAuth } from "@/contexts/authContext";
import { logger } from "@/utils/logger";

/**
 * Auto-resizing textarea component
 */
function AutoResizeTextarea({ value, onChange, placeholder, style }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
        adjustHeight();
      }}
      className="w-full px-3 py-2 rounded-md text-sm resize-none focus:outline-none focus:ring-2 overflow-hidden"
      style={style}
      placeholder={placeholder}
      rows={1}
    />
  );
}

/**
 * Template Block Editor - Edit {{{blocks}}} within a template
 */
export default function TemplateBlockEditor({ template, onClose, onSave }) {
  const { currentUser } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load blocks when template changes
  useEffect(() => {
    if (template?.downloadURL) {
      loadBlocks();
    }
  }, [template]);

  const loadBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const extractedBlocks = await extractBlocksFromTemplate(template.downloadURL);
      setBlocks(extractedBlocks);
    } catch (err) {
      logger.error("Failed to load blocks:", err);
      setError("Failed to load template blocks");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockChange = (id, newText) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === id ? { ...block, text: newText } : block
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveBlocksToTemplate(
        template.downloadURL,
        template.storagePath,
        template.id,
        currentUser.uid,
        blocks
      );
      onSave?.();
      onClose();
    } catch (err) {
      logger.error("Failed to save blocks:", err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Discard them?")) {
        onClose();
      }
    } else {
      onClose();
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
            Edit: {template?.name}
          </h2>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: hasChanges ? colors.primary.main : colors.ui.borderSubtle,
              color: hasChanges ? 'white' : colors.text.secondary,
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            onClick={handleClose}
            disabled={saving}
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
              No {'{{{blocks}}}'} found in this template.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="rounded-lg p-3 transition-all"
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
                <AutoResizeTextarea
                  value={block.text}
                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                  style={{
                    backgroundColor: colors.background.cream,
                    border: `1px solid ${colors.ui.borderLight}`,
                    color: colors.text.primary,
                  }}
                  placeholder="Enter prompt text..."
                />
                {block.text !== block.originalText.trim() && (
                  <p className="text-xs mt-1" style={{ color: colors.primary.main }}>
                    Modified
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
