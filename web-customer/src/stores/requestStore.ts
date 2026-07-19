import { create } from 'zustand';

interface RequestState {
  selectedServiceTypeIds: string[];
  selectedCarId: string | null;
  selectedWorkshopIds: number[];
  description: string;
  locationLat: number | null;
  locationLng: number | null;
  locationAddress: string;
  city: string;
  mediaFiles: File[];
  serviceMode: 'marketplace' | 'full_service';
  toggleServiceType: (id: string) => void;
  setCar: (id: string | null) => void;
  toggleWorkshop: (id: number) => void;
  clearWorkshops: () => void;
  setDescription: (desc: string) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  setCity: (city: string) => void;
  addMedia: (file: File) => void;
  removeMedia: (index: number) => void;
  clearMedia: () => void;
  setServiceMode: (mode: 'marketplace' | 'full_service') => void;
  reset: () => void;
}

const initialState = {
  selectedServiceTypeIds: [] as string[],
  selectedCarId: null,
  selectedWorkshopIds: [] as number[],
  description: '',
  locationLat: null as number | null,
  locationLng: null as number | null,
  locationAddress: '',
  city: '',
  mediaFiles: [] as File[],
  serviceMode: 'marketplace' as const,
};

export const useRequestStore = create<RequestState>()((set) => ({
  ...initialState,
  toggleServiceType: (id) => set((s) => ({
    selectedServiceTypeIds: s.selectedServiceTypeIds.includes(id)
      ? s.selectedServiceTypeIds.filter((sid) => sid !== id)
      : [...s.selectedServiceTypeIds, id],
  })),
  setCar: (id) => set({ selectedCarId: id }),
  toggleWorkshop: (id) => set((s) => ({
    selectedWorkshopIds: s.selectedWorkshopIds.includes(id)
      ? s.selectedWorkshopIds.filter((wid) => wid !== id)
      : [...s.selectedWorkshopIds, id],
  })),
  clearWorkshops: () => set({ selectedWorkshopIds: [] }),
  setDescription: (desc) => set({ description: desc }),
  setLocation: (lat, lng, address) => set({ locationLat: lat, locationLng: lng, locationAddress: address }),
  setCity: (city) => set({ city }),
  addMedia: (file) => set((s) => ({ mediaFiles: [...s.mediaFiles, file] })),
  removeMedia: (index) => set((s) => ({ mediaFiles: s.mediaFiles.filter((_, i) => i !== index) })),
  clearMedia: () => set({ mediaFiles: [] }),
  setServiceMode: (mode) => set({ serviceMode: mode }),
  reset: () => set(initialState),
}));
