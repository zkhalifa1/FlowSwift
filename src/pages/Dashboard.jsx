// React imports
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// UI components
import Sidebar from "../components/shared/Sidebar";
import AIAssistantBar from "../components/shared/AIAssistantBar";
import VoiceNoteManager from "../components/dashboard/VoiceNoteManager";
import TemplateManager from "../components/dashboard/TemplateManager";
import ReportsManager from "../components/dashboard/ReportsManager";
import TemplateBlockEditor from "../components/dashboard/TemplateBlockEditor";
import ReportBlockViewer from "../components/dashboard/ReportBlockViewer";
import ReportBlockEditor from "../components/dashboard/ReportBlockEditor";

// Custom hooks
import { useVoiceNotes } from "../hooks/useVoiceNotes";
import { useAuth } from "@/contexts/authContext/index.jsx";
import { useSelectionMode } from "../hooks/useSelectionMode";
import { useTemplateSelection } from "../hooks/useTemplateSelection";
import { useDateRange } from "../hooks/useDateRange";
import { useChatSession } from "../hooks/useChatSession";
import { useReportGenerationWorkflow } from "../hooks/useReportGenerationWorkflow";
import { useTemplates } from "../hooks/useTemplates";

// Utilities
import { processNotesForReport } from "../utils/noteUtils";
import { logger } from "@/utils/logger";
import { colors } from "@/styles/colors";

export default function Dashboard() {
  // Hooks
  const { currentUser } = useAuth();
  const { voiceNotes, deleteVoiceNote, forceRefresh } = useVoiceNotes();
  const { templates } = useTemplates();
  const { updateDateRange, currentRange } = useDateRange();

  // Voice note selection
  const {
    selectionMode: voiceNoteSelectionMode,
    selectedNoteIds,
    handleEnterSelectionMode: enterVoiceNoteSelection,
    handleExitSelectionMode: exitVoiceNoteSelection,
    handleSelectionChange: handleVoiceNoteSelectionChange,
  } = useSelectionMode();

  // Template selection
  const {
    selectionMode: templateSelectionMode,
    selectedTemplateId,
    handleEnterSelectionMode: enterTemplateSelection,
    handleExitSelectionMode: exitTemplateSelection,
    handleSelectionChange: handleTemplateSelectionChange,
  } = useTemplateSelection();

  // Report generation
  const { generateReport, error: generationError } =
    useReportGenerationWorkflow(currentUser);

  // AI Chat session
  const {
    messages,
    sendMessage: sendChatMessage,
    isLoading: isChatLoading,
    error: chatError,
    isConfigured: isChatConfigured,
  } = useChatSession(voiceNotes, currentRange);

  // Local state
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedNotesForReport, setSelectedNotesForReport] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewingReport, setPreviewingReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);

  // Event handlers

  // Step 1: Reports + button clicked -> Enter voice note selection
  const handleStartReportGeneration = () => {
    logger.info("Starting report generation workflow");
    enterVoiceNoteSelection();
  };

  // Step 2: Voice notes selected -> Continue to template selection
  const handleContinueToTemplateSelection = () => {
    const selectedNotes = processNotesForReport(
      voiceNotes,
      currentRange,
      selectedNoteIds,
    );

    logger.info("Voice notes selected:", selectedNotes.length);
    setSelectedNotesForReport(selectedNotes);

    // Exit voice note selection and enter template selection
    exitVoiceNoteSelection();
    enterTemplateSelection();
  };

  // Step 3: Template selected -> Generate report
  const handleGenerateReport = async () => {
    if (!selectedTemplateId) {
      logger.warn("No template selected");
      return;
    }

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      logger.error("Selected template not found");
      return;
    }

    logger.info("Generating report with template:", selectedTemplate.name);
    logger.info("Selected notes:", selectedNotesForReport.length);

    const result = await generateReport(
      selectedNotesForReport,
      selectedTemplate,
      `Daily Report ${new Date().toLocaleDateString()}`,
    );

    if (result) {
      logger.info("Report generated successfully:", result.name);
      // Exit template selection
      exitTemplateSelection();
      setSelectedNotesForReport([]);

      // Optionally download the report automatically
      window.open(result.downloadURL, "_blank");
    } else {
      logger.error("Report generation failed");
      if (generationError) {
        alert(`Failed to generate report: ${generationError}`);
      }
    }
  };

  // Cancel workflow at any step
  const handleCancelWorkflow = () => {
    exitVoiceNoteSelection();
    exitTemplateSelection();
    setSelectedNotesForReport([]);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
      setChatInput("");
    }
  };

  // Prepare props for child components
  const voiceNoteProps = {
    voiceNotes,
    deleteVoiceNote,
    currentlyPlayingId,
    setCurrentlyPlayingId,
    noteBg: "bg-white",
    dateRange: currentRange,
    setDateRange: updateDateRange,
    selectionMode: voiceNoteSelectionMode,
    selectedNoteIds,
    onSelectionChange: handleVoiceNoteSelectionChange,
    onExitSelection: handleCancelWorkflow,
    onContinueToReport: handleContinueToTemplateSelection,
    forceRefresh,
  };

  const templateManagerProps = {
    selectionMode: templateSelectionMode,
    selectedTemplateId,
    onSelectionChange: handleTemplateSelectionChange,
    onExitSelection: handleCancelWorkflow,
    onContinue: handleGenerateReport,
    onEditTemplate: setEditingTemplate,
  };

  return (
    <div
      className="h-screen flex"
      style={{ backgroundColor: colors.background.cream }}
    >
      {/* Left Sidebar */}
      <Sidebar />

      {/* Content Container */}
      <div className="flex-1 px-5 pt-5 overflow-hidden">
        {/* Two-column flexible layout */}
        <div className="h-full flex gap-6">
          {/* Left Column - Voice Notes Manager (60% width) */}
          <div className="w-[50%] max-h-[calc(100vh-120px)] min-w-0">
            <VoiceNoteManager {...voiceNoteProps} />
          </div>

          {/* Right Column - Templates and Reports stacked (40% width) */}
          <div className="w-[50%] max-h-[calc(100vh-120px)] min-w-0 flex flex-col">
            {editingTemplate ? (
              /* Template Editor - takes full height when editing */
              <div className="flex-1 min-h-0 overflow-hidden">
                <TemplateBlockEditor
                  template={editingTemplate}
                  onClose={() => setEditingTemplate(null)}
                  onSave={() => logger.info("Template blocks saved")}
                />
              </div>
            ) : editingReport ? (
              /* Report Editor - takes full height when editing */
              <div className="flex-1 min-h-0 overflow-hidden">
                <ReportBlockEditor
                  report={editingReport}
                  onClose={() => setEditingReport(null)}
                  onSave={() => logger.info("Report blocks saved")}
                />
              </div>
            ) : previewingReport ? (
              /* Report Viewer - takes full height when previewing */
              <div className="flex-1 min-h-0 overflow-hidden">
                <ReportBlockViewer
                  report={previewingReport}
                  onClose={() => setPreviewingReport(null)}
                />
              </div>
            ) : (
              <>
                {/* Templates Section */}
                <div className="overflow-hidden">
                  <TemplateManager {...templateManagerProps} />
                </div>

                {/* Reports Section */}
                <div className="overflow-hidden">
                  <ReportsManager
                    onGenerateReport={handleStartReportGeneration}
                    onPreviewReport={setPreviewingReport}
                    onEditReport={setEditingReport}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom AI Assistant Bar */}
      <AIAssistantBar
        input={chatInput}
        setInput={setChatInput}
        sendMessage={handleSendMessage}
        isLoading={isChatLoading}
        error={chatError}
        isConfigured={isChatConfigured}
        messages={messages}
      />
    </div>
  );
}
