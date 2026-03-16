import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTemplateUpload } from "@/hooks/useTemplateUpload";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { ProjectInfoForm } from "@/components/reports/ProjectInfoForm";
import { VoiceNotesPane } from "@/components/reports/VoiceNotesPane";
import { ProgressPane } from "@/components/reports/ProgressPane";
import { GenerateReportButton } from "@/components/reports/GenerateReportButton";

export default function ReportSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedNotes = [], dateRange } = location.state || {};
  const [projectName, setProjectName] = useState("Construction Report");

  // Custom hooks
  const {
    uploadedTemplate,
    isUploadingTemplate,
    templateError,
    setTemplateError,
    handleTemplateUpload,
  } = useTemplateUpload();

  const {
    progressData,
    messageHistory,
    handleProgressUpdate,
    resetProgress,
    setProgressData,
  } = useProgressTracking();

  const { aiSummary, isLoadingSummary, isGenerating, handleGenerateReport } =
    useReportGeneration(selectedNotes, dateRange, projectName);

  // Navigation handler
  const handleBackToDashboard = () => navigate("/dashboard");

  // Report generation wrapper
  const onGenerateReport = () => {
    setProgressData({ ...progressData, isActive: true });
    resetProgress();

    handleGenerateReport(
      uploadedTemplate,
      handleProgressUpdate,
      setTemplateError,
      () => {
        // Success callback - reset after 3 seconds
        setTimeout(() => {
          resetProgress();
        }, 3000);
      },
    );
  };

  return (
    <div className="h-screen flex flex-col px-6 py-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <ReportHeader
        onBackToDashboard={handleBackToDashboard}
      />

      <ProjectInfoForm
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onTemplateUpload={handleTemplateUpload}
        isUploadingTemplate={isUploadingTemplate}
        templateError={templateError}
      />

      <div className="flex-1 min-h-0 mb-6">
        <ProgressPane
          progressData={progressData}
          messageHistory={messageHistory}
          isLoadingSummary={isLoadingSummary}
          aiSummary={aiSummary}
        />
      </div>

      <GenerateReportButton
        onClick={onGenerateReport}
        disabled={selectedNotes.length === 0 || isGenerating || !uploadedTemplate}
        isGenerating={isGenerating}
      />
    </div>
  );
}