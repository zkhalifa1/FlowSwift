import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

/**
 * Form for project information and template upload
 * @param {string} projectName - Current project name
 * @param {Function} onProjectNameChange - Handler for project name change
 * @param {Function} onTemplateUpload - Handler for template file upload
 * @param {boolean} isUploadingTemplate - Whether template is currently uploading
 * @param {string} templateError - Template upload error message
 */
export function ProjectInfoForm({
  projectName,
  onProjectNameChange,
  onTemplateUpload,
  isUploadingTemplate,
  templateError,
}) {
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName("");
    }
    onTemplateUpload(e);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6 mb-6 shadow-lg">
      <div className="max-w-md">
        <Label className="text-zinc-200 font-medium block mb-2">Template (.docx)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileChange}
          disabled={isUploadingTemplate}
          className="hidden"
        />
        <Button
          type="button"
          onClick={handleBrowseClick}
          disabled={isUploadingTemplate}
          className="w-full bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploadingTemplate ? "Uploading..." : "Browse"}
        </Button>
        {selectedFileName && (
          <p className="text-sm text-zinc-300 mt-2 truncate" title={selectedFileName}>
            📄 {selectedFileName}
          </p>
        )}
        {templateError && (
          <p className="text-sm text-red-400 mt-2 font-medium flex items-center gap-1">
            <span className="text-red-500">⚠</span> {templateError}
          </p>
        )}
      </div>
    </div>
  );
}
