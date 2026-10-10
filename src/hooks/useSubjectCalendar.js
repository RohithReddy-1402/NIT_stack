import { useAuth } from "@/contexts/AuthContext";
import { deleteRecord, fetchSubjectCalendar, markRecords } from "@/services/attendance";
import { useCallback, useEffect, useState } from "react";

// Per-day status for one subject within a month, plus the ability to mark
// or clear any day directly — including days with no scheduled class, for
// genuine extra classes.
export function useSubjectCalendar(semesterId, subjectId, month) {
  const { token } = useAuth();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !semesterId || !subjectId || !month) {
      setDays([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubjectCalendar(token, semesterId, subjectId, month);
      setDays(data.days ?? []);
    } catch (err) {
      console.error("Failed to load subject calendar:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, semesterId, subjectId, month]);

  useEffect(() => {
    load();
  }, [load]);

  // Adds (or, if `startTime` matches an existing entry, updates) one entry
  // for that day — a day can hold more than one entry for the same subject
  // (e.g. two separate sessions), so this never replaces the whole day.
  const addEntry = useCallback(
    async (date, { startTime, endTime, status }) => {
      const [record] = await markRecords(token, {
        semesterId,
        date,
        entries: [{ subjectId, startTime, endTime, status }],
      });
      const entry = {
        recordId: record.id,
        startTime: record.startTime,
        endTime: record.endTime,
        status: record.status,
      };
      setDays((prev) =>
        prev.map((d) => {
          if (d.date !== date) return d;
          const records = (d.records ?? []).filter((r) => r.recordId !== entry.recordId);
          records.push(entry);
          return { ...d, records };
        }),
      );
      return record;
    },
    [token, semesterId, subjectId],
  );

  const removeEntry = useCallback(
    async (date, recordId) => {
      await deleteRecord(token, recordId);
      setDays((prev) =>
        prev.map((d) =>
          d.date === date
            ? { ...d, records: (d.records ?? []).filter((r) => r.recordId !== recordId) }
            : d,
        ),
      );
    },
    [token],
  );

  return { days, loading, error, addEntry, removeEntry, refetch: load };
}
