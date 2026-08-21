const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchSyllabus() {
  const response = await fetch(`${API_URL}/api/syllabus`);

  return await response.json();
}
