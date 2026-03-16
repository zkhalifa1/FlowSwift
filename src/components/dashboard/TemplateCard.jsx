import React from "react";
import { FileText, X, Pencil, Download } from "lucide-react";
import { colors } from "@/styles/colors";

/**
 * Template Card - Notion-style display for document templates
 */
export default function TemplateCard({
  template,
  onDelete,
  onEdit,
  selectionMode = false,
  isSelected = false,
  onSelectionChange
}) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete template "${template.name}"?`)) {
      onDelete(template.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(template);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    window.open(template.downloadURL, "_blank");
  };

  const handleCardClick = () => {
    if (selectionMode && onSelectionChange) {
      onSelectionChange(template.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group flex items-center justify-between py-3 px-2 mb-2 transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: selectionMode && isSelected
          ? `${colors.primary.main}20`
          : colors.background.cream,
        border: selectionMode && isSelected
          ? `1px solid ${colors.primary.main}`
          : 'none',
        boxShadow: selectionMode && isSelected
          ? `0 4px 12px ${colors.primary.main}30`
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!selectionMode || !isSelected) {
          e.currentTarget.style.backgroundColor = colors.background.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = selectionMode && isSelected
          ? `${colors.primary.main}20`
          : colors.background.cream;
      }}
    >
      {/* Left side - Document icon and name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText
          className="w-5 h-5 flex-shrink-0"
          style={{ color: colors.text.secondary }}
        />
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="truncate font-medium text-sm"
            style={{ color: colors.text.primary }}
          >
            {template.name}
          </span>
          {template.lastModified && (
            <span
              className="text-xs flex-shrink-0"
              style={{ color: colors.text.tertiary }}
            >
              (edited)
            </span>
          )}
        </div>
      </div>

      {/* Right side - Conditional: checkbox in selection mode, actions otherwise */}
      {selectionMode ? (
        <input
          type="radio"
          checked={isSelected}
          onChange={() => onSelectionChange?.(template.id)}
          className="w-5 h-5 cursor-pointer"
          style={{
            accentColor: colors.primary.main,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 rounded transition-colors"
              style={{
                color: colors.text.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Edit template"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-1.5 rounded transition-colors"
            style={{
              color: colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Download template"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded transition-colors"
            style={{
              color: colors.status.error,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Delete template"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
