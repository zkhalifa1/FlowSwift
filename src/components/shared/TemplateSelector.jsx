import React, { useState, useRef } from "react";
import { FileText, ChevronDown, Edit2 } from "lucide-react";
import { colors } from "@/styles/colors";
import { useClickOutside } from "@/hooks/useClickOutside";

/**
 * TemplateSelector component inspired by Heidi's template picker
 * Allows users to select report templates
 */
export default function TemplateSelector({ selectedTemplate, onTemplateChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => {
    if (isOpen) setIsOpen(false);
  });

  const templates = [
    { id: "daily", name: "Daily Report", description: "Standard daily construction report" },
    { id: "inspection", name: "Inspection Report", description: "Site inspection and safety checks" },
    { id: "progress", name: "Progress Report", description: "Weekly progress summary" },
    { id: "incident", name: "Incident Report", description: "Safety incidents and near-misses" },
  ];

  const currentTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Template Selector Button */}
      <div className="flex items-center gap-3">
        {/* Select Template Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: colors.background.hover,
            border: `1px solid ${colors.ui.borderLight}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.hover;
          }}
        >
          <FileText className="w-4 h-4" style={{ color: colors.text.secondary }} />
          <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            Select a template
          </span>
        </button>

        {/* Current Template Display */}
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold" style={{ color: colors.text.primary }}>
            {currentTemplate.name}
          </span>
          <button
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <Edit2 className="w-4 h-4" style={{ color: colors.text.tertiary }} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-80 rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.ui.borderLight}`,
            boxShadow: '0 8px 24px rgba(62, 39, 35, 0.12)',
          }}
        >
          <div
            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: colors.background.hover,
              color: colors.text.secondary,
            }}
          >
            Choose Template
          </div>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onTemplateChange?.(template.id);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left transition-colors"
              style={{
                backgroundColor:
                  template.id === selectedTemplate
                    ? colors.background.hover
                    : colors.background.white,
                borderLeft:
                  template.id === selectedTemplate
                    ? `3px solid ${colors.primary.main}`
                    : `3px solid transparent`,
              }}
              onMouseEnter={(e) => {
                if (template.id !== selectedTemplate) {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (template.id !== selectedTemplate) {
                  e.currentTarget.style.backgroundColor = colors.background.white;
                }
              }}
            >
              <div className="font-medium text-sm" style={{ color: colors.text.primary }}>
                {template.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                {template.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
