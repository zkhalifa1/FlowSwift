import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/apis/firebase/config";
import { useAuth } from "@/contexts/authContext";
import { logger } from "@/utils/logger";

/**
 * Hook to fetch and listen to user's generated reports
 */
export function useReports() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setReports([]);
      setLoading(false);
      return;
    }

    const reportsRef = collection(db, "users", currentUser.uid, "reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        logger.info("Reports fetched:", reportData.length);
        setReports(reportData);
        setLoading(false);
      },
      (error) => {
        logger.error("Error fetching reports:", error);
        setReports([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return { reports, loading };
}
