const API_URL = process.env.EXPO_PUBLIC_API_URL;

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return await response.json();
}

// Semesters
export const fetchSemesters = (token) =>
  request("/attendance/semesters", token);

export const createSemester = (token, data) =>
  request("/attendance/semesters", token, {
    method: "POST",
    body: JSON.stringify(data),
  });

// Subjects
export const fetchSubjects = (token, semesterId) =>
  request(`/attendance/semesters/${semesterId}/subjects`, token);

export const createSubject = (token, semesterId, data) =>
  request(`/attendance/semesters/${semesterId}/subjects`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateSubject = (token, id, data) =>
  request(`/attendance/subjects/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteSubject = (token, id) =>
  request(`/attendance/subjects/${id}`, token, { method: "DELETE" });

// Timetable
export const fetchTimetable = (token, semesterId) =>
  request(`/attendance/semesters/${semesterId}/timetable`, token);

export const createTimetableSlot = (token, semesterId, data) =>
  request(`/attendance/semesters/${semesterId}/timetable`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateTimetableSlot = (token, slotId, data) =>
  request(`/attendance/timetable/${slotId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteTimetableSlot = (token, slotId) =>
  request(`/attendance/timetable/${slotId}`, token, { method: "DELETE" });

// Day view + marking
export const fetchDay = (token, semesterId, date) =>
  request(`/attendance/semesters/${semesterId}/day/${date}`, token);

export const markRecords = (token, payload) =>
  request("/attendance/records", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateRecord = (token, id, status) =>
  request(`/attendance/records/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteRecord = (token, id) =>
  request(`/attendance/records/${id}`, token, { method: "DELETE" });

// Stats + per-subject calendar
export const fetchStats = (token, semesterId) =>
  request(`/attendance/semesters/${semesterId}/stats`, token);

export const fetchSubjectCalendar = (token, semesterId, subjectId, month) =>
  request(
    `/attendance/semesters/${semesterId}/subjects/${subjectId}/calendar?month=${month}`,
    token,
  );
