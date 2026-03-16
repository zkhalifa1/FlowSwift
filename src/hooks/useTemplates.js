import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/apis/firebase/config";
import { useAuth } from "@/contexts/authContext";
import { logger } from "@/utils/logger";

/**
 * Hook to fetch and listen to user's templates
 */
export function useTemplates() {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const templatesRef = collection(db, "users", currentUser.uid, "templates");
    const q = query(templatesRef, orderBy("uploadedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const templateData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTemplates(templateData);
        setLoading(false);
      },
      (error) => {
        logger.error("Error fetching templates:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return { templates, loading };
}
