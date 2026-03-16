import { storage, db } from "./config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/utils/logger";


export class TemplateService {
  constructor() {
    this.SUPPORTED_FORMATS = {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
    };
    this.MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  }

  async uploadTemplate(file, templateName, description = "", currentUser) {
    try {
      logger.info(
        "TemplateService: Starting upload with user:",
        currentUser?.uid,
      );

      // Validate user authentication
      if (!currentUser) {
        throw new Error("User must be authenticated to upload templates");
      }

      // Validate file
      this.validateFile(file);
      logger.info("TemplateService: File validation passed");

      // Generate unique template ID
      const templateId = uuidv4();
      const fileExtension = this.getFileExtension(file.type);
      const fileName = `${templateId}${fileExtension}`;

      // Upload file to Firebase Storage
      logger.info(
        "TemplateService: Uploading to storage path:",
        `templates/${currentUser.uid}/${fileName}`,
      );
      const storageRef = ref(
        storage,
        `templates/${currentUser.uid}/${fileName}`,
      );
      const uploadResult = await uploadBytes(storageRef, file);
      logger.info("TemplateService: Storage upload successful");

      const downloadURL = await getDownloadURL(uploadResult.ref);
      logger.info("TemplateService: Download URL obtained");

      // Extract placeholders from template
      const placeholders = await this.extractPlaceholders(file);
      logger.info("TemplateService: Placeholders extracted:", placeholders);

      // Save template metadata to Firestore using subcollection pattern
      const templateData = {
        id: templateId,
        name: templateName,
        description,
        fileName,
        originalFileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        downloadURL,
        placeholders,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info(
        "TemplateService: Saving to Firestore path:",
        `users/${currentUser.uid}/templates`,
      );
      const docRef = await addDoc(
        collection(db, "users", currentUser.uid, "templates"),
        templateData,
      );
      logger.info(
        "TemplateService: Firestore save successful, doc ID:",
        docRef.id,
      );

      const result = {
        ...templateData,
        firestoreId: docRef.id,
      };

      logger.info("TemplateService: Upload completed successfully");
      return result;
    } catch (error) {
      logger.error("Error uploading template:", error);
      throw new Error(`Failed to upload template: ${error.message}`);
    }
  }

  async getUserTemplates(currentUser) {
    try {
      if (!currentUser) {
        throw new Error("User must be authenticated");
      }

      const q = query(
        collection(db, "users", currentUser.uid, "templates"),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);

      const templates = [];
      querySnapshot.forEach((doc) => {
        templates.push({
          firestoreId: doc.id,
          ...doc.data(),
        });
      });

      return templates;
    } catch (error) {
      logger.error("Error fetching user templates:", error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  async deleteTemplate(templateId, firestoreId, currentUser) {
    try {
      if (!currentUser) {
        throw new Error("User must be authenticated");
      }

      // Delete from Firestore using subcollection pattern
      await deleteDoc(
        doc(db, "users", currentUser.uid, "templates", firestoreId),
      );

      // Delete from Storage
      const template = await this.getTemplateById(firestoreId, currentUser);
      if (template) {
        const storageRef = ref(
          storage,
          `templates/${currentUser.uid}/${template.fileName}`,
        );
        await deleteObject(storageRef);
      }

      return true;
    } catch (error) {
      logger.error("Error deleting template:", error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  async getTemplateById(firestoreId, currentUser) {
    try {
      if (!currentUser) {
        throw new Error("User must be authenticated");
      }

      // Get template directly by ID from subcollection
      const templateDoc = await getDocs(
        query(collection(db, "users", currentUser.uid, "templates")),
      );

      let template = null;
      templateDoc.forEach((doc) => {
        if (doc.id === firestoreId) {
          template = {
            firestoreId: doc.id,
            ...doc.data(),
          };
        }
      });

      return template;
    } catch (error) {
      logger.error("Error fetching template:", error);
      throw new Error(`Failed to fetch template: ${error.message}`);
    }
  }

  validateFile(file) {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!this.SUPPORTED_FORMATS[file.type]) {
      throw new Error("Unsupported file type. Only .docx files are supported.");
    }

    return true;
  }

  getFileExtension(mimeType) {
    return this.SUPPORTED_FORMATS[mimeType] || ".docx";
  }

  async extractPlaceholders(file) {
    try {
      const placeholderRegex = /\{\{([A-Z_]+)\}\}/g;
      const placeholders = new Set();

      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // For Word documents, we'll implement basic placeholder detection
        // This is a simplified version - in production, you'd use a proper docx parser
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = new TextDecoder().decode(uint8Array);

        let match;
        while ((match = placeholderRegex.exec(text)) !== null) {
          placeholders.add(match[1]);
        }
      }

      return Array.from(placeholders);
    } catch (error) {
      logger.error("Error extracting placeholders:", error);
      // Return default placeholders if extraction fails
      return [
        "VOICE_NOTES",
        "DATE_RANGE",
        "TOTAL_NOTES",
        "PROJECT_NAME",
        "GENERATION_DATE",
      ];
    }
  }

  getStandardPlaceholders() {
    return {
      VOICE_NOTES: "All selected voice note transcriptions",
      DATE_RANGE: "Selected date range for the report",
      TOTAL_NOTES: "Total number of selected voice notes",
      PROJECT_NAME: "Project or report name",
      GENERATION_DATE: "Date when the report was generated",
      VOICE_NOTE_1: "First voice note transcription",
      VOICE_NOTE_2: "Second voice note transcription",
      VOICE_NOTE_3: "Third voice note transcription",
      TIMESTAMP_1: "Timestamp of first voice note",
      TIMESTAMP_2: "Timestamp of second voice note",
      TIMESTAMP_3: "Timestamp of third voice note",
    };
  }

  async downloadTemplate(templateId) {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      const response = await fetch(template.downloadURL);
      const blob = await response.blob();

      return {
        blob,
        fileName: template.originalFileName,
        fileType: template.fileType,
      };
    } catch (error) {
      logger.error("Error downloading template:", error);
      throw new Error(`Failed to download template: ${error.message}`);
    }
  }
}

export const templateService = new TemplateService();
