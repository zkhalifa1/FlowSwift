import React from "react";
import { FileText, X, Download, Eye, Pencil } from "lucide-react";
import { colors } from "@/styles/colors";

/**
 * Report Card - Notion-style display for generated reports
 */
export default function ReportCard({ report, onDelete, onDownload, onPreview, onEdit }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete report "${report.name}"?`)) {
      onDelete(report.id);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(report);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview?.(report);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(report);
  };

  return (
    <div
      className="group flex items-center justify-between py-3 px-2 mb-2 transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: colors.background.cream,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.background.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.background.cream;
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
            {report.name}
          </span>
        </div>
      </div>

      {/* Right side - Preview, Download, and Delete icons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePreview}
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
          title="Preview report"
        >
          <Eye className="w-4 h-4" />
        </button>

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
          title="Edit report"
        >
          <Pencil className="w-4 h-4" />
        </button>

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
          title="Download report"
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
          title="Delete report"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
