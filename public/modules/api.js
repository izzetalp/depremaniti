const API_URL = "/api/depremler";

export async function fetchEarthquakes() {
  const response = await fetch(API_URL);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detay || `HTTP hatası! Durum: ${response.status}`);
  }

  return await response.json();
}
