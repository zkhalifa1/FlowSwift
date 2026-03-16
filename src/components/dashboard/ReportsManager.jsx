import React, { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { storage, db } from "@/apis/firebase/config";
import { useAuth } from "@/contexts/authContext";
import { useReports } from "@/hooks/useReports";
import ReportCard from "./ReportCard";
import ReportGenerateButton from "./ReportGenerateButton";
import { FileText } from "lucide-react";
import { colors } from "@/styles/colors";
import { logger } from "@/utils/logger";
import { cleanReportForDownload } from "@/services/templateService";

export default function ReportsManager({ onGenerateReport, onPreviewReport, onEditReport }) {
  const { currentUser } = useAuth();
  const { reports, loading } = useReports();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const handleDelete = async (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    try {
      // Delete from Storage if storagePath exists
      if (report.storagePath) {
        const fileRef = ref(storage, report.storagePath);
        await deleteObject(fileRef);
      }

      // Delete from Firestore
      const reportDoc = doc(db, "users", currentUser.uid, "reports", reportId);
      await deleteDoc(reportDoc);

      logger.info("Report deleted successfully:", report.name);
    } catch (error) {
      logger.error("Error deleting report:", error);
      alert("Failed to delete report. Please try again.");
    }
  };

  const handleDownload = async (report) => {
    setDownloading(report.id);
    try {
      // Clean the report by removing {{{ }}} markers
      const cleanedBlob = await cleanReportForDownload(report.downloadURL);

      // Create download link
      const url = URL.createObjectURL(cleanedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info("Report downloaded:", report.name);
    } catch (error) {
      logger.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (report) => {
    onPreviewReport?.(report);
  };

  const handleEdit = (report) => {
    onEditReport?.(report);
  };

  const handleGenerate = () => {
    if (onGenerateReport) {
      onGenerateReport();
    } else {
      logger.warn("No generate report handler provided");
    }
  };

  return (
    <div
      className="w-full flex flex-col relative"
      style={{ backgroundColor: colors.background.cream }}
    >
      {/* Header */}
      <div className="pt-4 pb-3 px-2 flex justify-between items-center">
        <h2
          className="text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          Reports
        </h2>
        <ReportGenerateButton
          onGenerate={handleGenerate}
          generating={generating}
        />
      </div>

      {/* Scrollable Reports List */}
      <div className="overflow-y-auto px-2">
        {loading ? (
          <p
            className="text-center text-sm py-8"
            style={{ color: colors.text.tertiary }}
          >
            Loading reports...
          </p>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: colors.text.tertiary }}
            />
            <p
              className="text-sm"
              style={{ color: colors.text.tertiary }}
            >
              No reports yet. Generate a report to get started.
            </p>
          </div>
        ) : (
          <div>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onPreview={handlePreview}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
