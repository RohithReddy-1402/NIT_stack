const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchPapers() {
  const response = await fetch(`${API_URL}/papers`);

  return await response.json();
}
