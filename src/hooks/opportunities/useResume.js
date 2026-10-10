import { useAuth } from "@/contexts/AuthContext";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { deleteResume, fetchResumes, registerResume } from "@/services/careerProfile";
import { pickDocument, uploadFile } from "@/services/opportunityUploads";
import { useCallback, useEffect, useState } from "react";

/** Resume upload/versioning. Never auto-submitted anywhere — purely stored for the student's own use when tracking applications. */
export function useResume() {
  const { token, isLoggedIn } = useAuth();
  const { handleError } = useOpportunityGate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setResumes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { items } = await fetchResumes(token);
      setResumes(items);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = useCallback(async () => {
    let file;
    try {
      file = await pickDocument();
    } catch (err) {
      handleError(err, "Couldn't open that file");
      return null;
    }
    if (!file) return null;

    setUploading(true);
    try {
      const uploaded = await uploadFile(token, "resume", file);
      const resume = await registerResume(token, { key: uploaded.key, filename: file.name, size: file.bytes });
      setResumes((prev) => [resume, ...prev]);
      return resume;
    } catch (err) {
      handleError(err, "Couldn't upload your resume");
      return null;
    } finally {
      setUploading(false);
    }
  }, [token, handleError]);

  const remove = useCallback(
    async (id) => {
      try {
        await deleteResume(token, id);
        setResumes((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        handleError(err, "Couldn't remove that resume");
      }
    },
    [token, handleError],
  );

  return { resumes, latest: resumes[0] ?? null, loading, uploading, upload, remove, reload: load };
}
