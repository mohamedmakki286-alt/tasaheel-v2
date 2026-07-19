export interface ReverseGeocodeResult {
  city: string;
  district: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
    { headers: { 'User-Agent': 'salaba-platform/1.0' } }
  );
  const data = await res.json();
  const addr = data.address || {};
  return {
    city: addr.city || addr.state_district || addr.region || addr.state || addr.county || '',
    district: addr.suburb || addr.neighbourhood || addr.district || addr.town || addr.village || addr.municipality || '',
  };
}
