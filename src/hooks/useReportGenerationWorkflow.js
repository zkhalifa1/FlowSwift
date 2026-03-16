import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/apis/firebase/config";
import { processTemplate, generateReportFilename } from "@/services/templateService";
import { logger } from "@/utils/logger";

/**
 * Hook to handle the complete report generation workflow
 * Reuses infrastructure from ReportSummary
 */
export function useReportGenerationWorkflow(currentUser) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async (selectedNotes, template, projectName = "Daily Report") => {
    if (!currentUser) {
      setError("User must be logged in");
      return null;
    }

    if (!template) {
      setError("No template selected");
      return null;
    }

    if (selectedNotes.length === 0) {
      setError("No voice notes selected");
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setProgress({ message: "Starting report generation...", type: "start" });

    try {
      // Fetch the template file
      const templateResponse = await fetch(template.downloadURL);
      const templateBlob = await templateResponse.blob();
      const templateFile = new File([templateBlob], template.name, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });

      logger.info("Template file loaded:", template.name);

      // Process template with selected notes
      const reportBlob = await processTemplate(
        templateFile,
        selectedNotes,
        projectName,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      logger.info("Template processed successfully");

      // Upload generated report to Firebase Storage
      const timestamp = new Date();
      const reportFileName = generateReportFilename();
      const storagePath = `reports/${currentUser.uid}/${timestamp.getTime()}_${reportFileName}`;
      const fileRef = ref(storage, storagePath);

      setProgress({ message: "Uploading report...", type: "uploading" });
      await uploadBytes(fileRef, reportBlob);
      const downloadURL = await getDownloadURL(fileRef);

      logger.info("Report uploaded to storage");

      // Save report metadata to Firestore
      const reportsRef = collection(db, "users", currentUser.uid, "reports");
      const reportDoc = await addDoc(reportsRef, {
        name: reportFileName,
        downloadURL,
        storagePath,
        createdAt: serverTimestamp(),
        projectName,
        templateUsed: template.name,
        noteCount: selectedNotes.length,
        size: reportBlob.size,
      });

      logger.info("Report saved to Firestore:", reportDoc.id);

      setProgress({ message: "Report generated successfully!", type: "complete" });
      setIsGenerating(false);

      return {
        id: reportDoc.id,
        downloadURL,
        name: reportFileName,
      };
    } catch (err) {
      logger.error("Error generating report:", err);
      setError(err.message || "Failed to generate report");
      setProgress({ message: "Error generating report", type: "error" });
      setIsGenerating(false);
      return null;
    }
  };

  return {
    generateReport,
    isGenerating,
    progress,
    error,
  };
}
