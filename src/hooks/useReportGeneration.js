import { useState, useEffect } from "react";
import { contentIntelligenceService } from "@/apis/openai/contentIntelligence";
import { logger } from "@/utils/logger";
import {
  processTemplate,
  generateReportFilename,
} from "@/services/templateService";

/**
 * Custom hook for managing report generation and AI summary
 * @param {Array} selectedNotes - Selected voice notes
 * @param {Object} dateRange - Date range object
 * @param {string} projectName - Project name
 * @returns {Object} Report generation state and handlers
 */
export function useReportGeneration(selectedNotes, dateRange, projectName) {
  const [aiSummary, setAiSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate AI summary when component mounts or dependencies change
  useEffect(() => {
    const generateSummary = async () => {
      if (selectedNotes.length === 0) return;

      setIsLoadingSummary(true);
      try {
        const analysis = await contentIntelligenceService.processVoiceNotes(
          selectedNotes,
          dateRange,
          projectName,
        );
        const formattedSummary = contentIntelligenceService.getFormattedSummary(
          analysis,
          "detailed",
        );
        setAiSummary(formattedSummary || "No summary available");
      } catch (error) {
        logger.error("Error generating AI summary:", error);
        setAiSummary("Failed to generate AI summary");
      } finally {
        setIsLoadingSummary(false);
      }
    };

    generateSummary();
  }, [selectedNotes, dateRange, projectName]);

  const handleGenerateReport = async (
    uploadedTemplate,
    onProgressUpdate,
    onError,
    onSuccess,
  ) => {
    if (!uploadedTemplate) {
      onError("Please upload a template first");
      return;
    }

    setIsGenerating(true);

    try {
      const processedBlob = await processTemplate(
        uploadedTemplate,
        selectedNotes,
        projectName,
        onProgressUpdate,
      );

      const url = URL.createObjectURL(processedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateReportFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onSuccess) onSuccess();
    } catch (error) {
      logger.error("Report generation error:", error);
      if (onError) onError("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    aiSummary,
    isLoadingSummary,
    isGenerating,
    handleGenerateReport,
  };
}
