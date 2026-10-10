import { useAuth } from "@/contexts/AuthContext";
import { deleteRecord, fetchDay, markRecords } from "@/services/attendance";
import { useCallback, useEffect, useState } from "react";

export function useAttendanceDay(semesterId, date) {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !semesterId || !date) {
      setPeriods([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDay(token, semesterId, date);
      setPeriods(data.periods ?? []);
    } catch (err) {
      console.error("Failed to load day:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, semesterId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const markPeriod = useCallback(
    async (period, status) => {
      const [record] = await markRecords(token, {
        semesterId,
        date,
        entries: [
          {
            slotId: period.slotId ?? undefined,
            subjectId: period.subjectId,
            startTime: period.startTime,
            endTime: period.endTime,
            status,
          },
        ],
      });
      setPeriods((prev) =>
        prev.map((p) =>
          p === period ? { ...p, status, recordId: record.id } : p,
        ),
      );
      return record;
    },
    [token, semesterId, date],
  );

  const unmarkPeriod = useCallback(
    async (period) => {
      if (!period.recordId) return;
      await deleteRecord(token, period.recordId);
      setPeriods((prev) =>
        prev.map((p) =>
          p === period ? { ...p, status: null, recordId: null } : p,
        ),
      );
    },
    [token],
  );

  return {
    periods,
    loading,
    error,
    markPeriod,
    unmarkPeriod,
    refetch: load,
  };
}
