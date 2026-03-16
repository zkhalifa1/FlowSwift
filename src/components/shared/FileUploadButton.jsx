import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

/**
 * Reusable file upload button component
 * @param {string} accept - File types to accept (e.g., ".docx", ".pdf")
 * @param {Function} onFileSelect - Handler for file selection
 * @param {boolean} isUploading - Whether file is currently uploading
 * @param {string} buttonText - Text to display on button (default: "Browse")
 * @param {string} error - Error message to display
 * @param {string} className - Additional CSS classes for the container
 */
export function FileUploadButton({
  accept = "*",
  onFileSelect,
  isUploading = false,
  buttonText = "Browse",
  error = null,
  className = "",
}) {
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelect(e);
    } else {
      setSelectedFileName("");
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />
      <Button
        type="button"
        onClick={handleBrowseClick}
        disabled={isUploading}
        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600 flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        {isUploading ? "Uploading..." : buttonText}
      </Button>
      {selectedFileName && (
        <p className="text-sm text-zinc-300 mt-2 truncate" title={selectedFileName}>
          📄 {selectedFileName}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400 mt-2 font-medium flex items-center gap-1">
          <span className="text-red-500">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
