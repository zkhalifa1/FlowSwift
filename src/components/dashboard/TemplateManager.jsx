import React, { useState } from "react";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage, db } from "@/apis/firebase/config";
import { useAuth } from "@/contexts/authContext";
import { useTemplates } from "@/hooks/useTemplates";
import TemplateCard from "./TemplateCard";
import TemplateUploadButton from "./TemplateUploadButton";
import TemplateSelectionHeader from "./TemplateSelectionHeader";
import { FileText } from "lucide-react";
import { colors } from "@/styles/colors";
import { logger } from "@/utils/logger";

export default function TemplateManager({
  selectionMode = false,
  selectedTemplateId = null,
  onSelectionChange,
  onExitSelection,
  onContinue,
  onEditTemplate,
}) {
  const { currentUser } = useAuth();
  const { templates, loading } = useTemplates();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".docx")) {
      alert("Only .docx files are allowed");
      event.target.value = ""; // Reset input
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to upload templates");
      return;
    }

    setUploading(true);

    try {
      // Upload to Firebase Storage
      const timestamp = new Date();
      const fileName = `${timestamp.getTime()}_${file.name}`;
      const storagePath = `templates/${currentUser.uid}/${fileName}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      // Save metadata to Firestore
      const templatesRef = collection(
        db,
        "users",
        currentUser.uid,
        "templates",
      );
      await addDoc(templatesRef, {
        name: file.name,
        downloadURL,
        storagePath,
        uploadedAt: timestamp,
        size: file.size,
      });

      logger.info("Template uploaded successfully:", file.name);

      // Reset file input
      event.target.value = "";
    } catch (error) {
      logger.error("Error uploading template:", error);
      alert("Failed to upload template. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    try {
      // Delete from Storage
      const fileRef = ref(storage, template.storagePath);
      await deleteObject(fileRef);

      // Delete from Firestore
      const templateDoc = doc(
        db,
        "users",
        currentUser.uid,
        "templates",
        templateId,
      );
      await deleteDoc(templateDoc);

      logger.info("Template deleted successfully:", template.name);
    } catch (error) {
      logger.error("Error deleting template:", error);
      alert("Failed to delete template. Please try again.");
    }
  };

  const handleEdit = (template) => {
    onEditTemplate?.(template);
  };

  return (
    <div
      className="w-full flex flex-col relative"
      style={{ backgroundColor: colors.background.cream }}
    >
      {/* Selection Mode Header */}
      {selectionMode ? (
        <div className="px-2 pt-4">
          <TemplateSelectionHeader
            hasSelection={selectedTemplateId !== null}
            onExitSelection={onExitSelection}
            onContinue={onContinue}
            canUpload={templates.length > 0}
          />
        </div>
      ) : (
        /* Normal Header */
        <div className="pt-4 pb-3 px-2 flex justify-between items-center">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Templates
          </h2>
          <TemplateUploadButton
            onFileSelect={handleFileSelect}
            uploading={uploading}
          />
        </div>
      )}

      {/* Scrollable Templates List */}
      <div className="overflow-y-auto px-2">
        {loading ? (
          <p
            className="text-center text-sm py-8"
            style={{ color: colors.text.tertiary }}
          >
            Loading templates...
          </p>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: colors.text.tertiary }}
            />
            <p className="text-sm" style={{ color: colors.text.tertiary }}>
              No templates yet. Upload a .docx template to get started.
            </p>
          </div>
        ) : (
          <div>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={handleDelete}
                onEdit={handleEdit}
                selectionMode={selectionMode}
                isSelected={selectedTemplateId === template.id}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
