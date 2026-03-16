import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/apis/firebase/config";
import { useAuth } from "@/contexts/authContext";
import { Note } from "../models/Note";
import { logger } from "@/utils/logger";


export function useVoiceNotes() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users", currentUser.uid, "voiceNotes"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notes = snapshot.docs.map((doc) => Note.fromFirestore(doc));
        setVoiceNotes(notes);
      },
      (error) => {
        logger.error("Firestore snapshot error:", error.message);
      },
    );

    return () => unsubscribe();
  }, [currentUser, refreshTrigger]);

  const deleteVoiceNote = async (noteId) => {
    const noteRef = doc(db, "users", currentUser.uid, "voiceNotes", noteId);

    try {
      // Get the note to find the storage path
      const noteSnap = await getDoc(noteRef);
      if (noteSnap.exists()) {
        const noteData = noteSnap.data();

        // Delete from Storage if storagePath exists
        if (noteData.storagePath) {
          const storageRef = ref(storage, noteData.storagePath);
          await deleteObject(storageRef);
          logger.info('Deleted audio from storage:', noteData.storagePath);
        }
      }

      // Delete from Firestore
      await deleteDoc(noteRef);
      logger.info('Deleted voice note from Firestore:', noteId);
    } catch (error) {
      logger.error('Error deleting voice note:', error);
      // Still try to delete from Firestore even if storage deletion fails
      await deleteDoc(noteRef);
    }
  };

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { voiceNotes, deleteVoiceNote, forceRefresh };
}
