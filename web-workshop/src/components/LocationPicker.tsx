import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, Globe, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const defaultLat = 24.7136;
const defaultLng = 46.6753;

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
}

function extractCoords(input: string): { lat: number; lng: number } | null {
  const trimmed = input.trim();

  // Pattern 1: @lat,lng or @lat,lng,zoom (Google Maps URL format)
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Pattern 2: q=lat,lng (Google Maps query param)
  const qMatch = trimmed.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Pattern 3: plain "(lat, lng)" or "lat, lng" with optional parentheses
  const plainMatch = trimmed.match(/^\(?(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\)?$/);
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1]);
    const lng = parseFloat(plainMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const { t } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [linkInput, setLinkInput] = useState('');
  const [locating, setLocating] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((lat: number, lng: number) => {
    const latRounded = parseFloat(lat.toFixed(6));
    const lngRounded = parseFloat(lng.toFixed(6));
    markerRef.current?.setLatLng([latRounded, lngRounded]);
    mapRef.current?.setView([latRounded, lngRounded], mapRef.current?.getZoom() || 15);
    onChangeRef.current(latRounded, lngRounded);
    setLinkInput(`${latRounded}, ${lngRounded}`);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const lat = latitude || defaultLat;
    const lng = longitude || defaultLng;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updatePosition(pos.lat, pos.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;
    setLinkInput(`${parseFloat(lat.toFixed(6))}, ${parseFloat(lng.toFixed(6))}`);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) return;
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!map || !marker) return;
    if (marker.getLatLng().lat !== latitude || marker.getLatLng().lng !== longitude) {
      marker.setLatLng([latitude, longitude]);
      map.setView([latitude, longitude], map.getZoom());
      setLinkInput(`${parseFloat(latitude.toFixed(6))}, ${parseFloat(longitude.toFixed(6))}`);
    }
  }, [latitude, longitude]);

  const handleLinkChange = (val: string) => {
    setLinkInput(val);
  };

  const handleApplyLink = () => {
    const coords = extractCoords(linkInput);
    if (coords) {
      const latRounded = parseFloat(coords.lat.toFixed(6));
      const lngRounded = parseFloat(coords.lng.toFixed(6));
      markerRef.current?.setLatLng([latRounded, lngRounded]);
      mapRef.current?.setView([latRounded, lngRounded], mapRef.current?.getZoom() || 15);
      onChangeRef.current(latRounded, lngRounded);
    } else if (linkInput.trim()) {
      alert(t('locationPicker.coordsNotFound'));
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert(t('locationPicker.geolocationNotSupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        alert(t('locationPicker.geolocationFailed'));
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <label className="label flex items-center gap-2">
        <MapPin size={16} className="text-primary-500" />
        {t('locationPicker.title')}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="btn-secondary flex items-center gap-2 py-2 text-sm shrink-0"
        >
          <Crosshair size={16} className={locating ? 'animate-spin' : ''} />
          {locating ? t('locationPicker.detecting') : t('locationPicker.detectLocation')}
        </button>
        <div className="relative flex-1">
          <Link size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            value={linkInput}
            onChange={(e) => handleLinkChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleApplyLink(); }}
            className="input-field pr-9"
            dir="ltr"
            placeholder={t('locationPicker.placeholder')}
          />
        </div>
        <button type="button" onClick={handleApplyLink} className="btn-primary py-2 text-sm shrink-0">
          {t('locationPicker.apply')}
        </button>
      </div>

      <div className="text-[10px] text-surface-400 flex items-center gap-1">
        <Globe size={12} />
        {t('locationPicker.helpText')}
      </div>

      <div ref={mapContainerRef} className="rounded-xl overflow-hidden border border-surface-200" style={{ height: 250 }} />
    </div>
  );
}
