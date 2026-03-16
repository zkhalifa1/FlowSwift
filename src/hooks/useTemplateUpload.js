import { useState } from "react";
import { validateTemplate, extractPrompts } from "@/services/templateService";
import { logger } from "@/utils/logger";


/**
 * Custom hook for managing template file upload and validation
 * @returns {Object} Template upload state and handlers
 */
export function useTemplateUpload() {
  const [uploadedTemplate, setUploadedTemplate] = useState(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");

  const handleTemplateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      setTemplateError("Please upload a .docx file");
      return;
    }

    setIsUploadingTemplate(true);
    setTemplateError("");

    try {
      const prompts = await extractPrompts(file);
      const text = await file.text().catch(() => "");
      const errors = validateTemplate(text);

      if (errors.length > 0) {
        setTemplateError(`Template validation failed: ${errors.join(", ")}`);
        return;
      }

      setUploadedTemplate(file);
    } catch (error) {
      setTemplateError("Failed to process template file");
      logger.error("Template upload error:", error);
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  return {
    uploadedTemplate,
    isUploadingTemplate,
    templateError,
    setTemplateError,
    handleTemplateUpload,
  };
}
