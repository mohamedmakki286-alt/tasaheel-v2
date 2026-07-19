import { create } from 'zustand';

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'active' | 'ended';

interface CallState {
  status: CallStatus;
  callSessionId: number | null;
  peerId: number | null;
  peerName: string;
  peerRole: string;
  duration: number;
  isOutgoing: boolean;
  setStatus: (status: CallStatus) => void;
  setCallSessionId: (id: number | null) => void;
  setPeerId: (id: number | null) => void;
  setPeerName: (name: string) => void;
  setPeerRole: (role: string) => void;
  setDuration: (d: number) => void;
  setIsOutgoing: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  callSessionId: null,
  peerId: null,
  peerName: '',
  peerRole: '',
  duration: 0,
  isOutgoing: false,
};

export const useCallStore = create<CallState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setCallSessionId: (callSessionId) => set({ callSessionId }),
  setPeerId: (peerId) => set({ peerId }),
  setPeerName: (peerName) => set({ peerName }),
  setPeerRole: (peerRole) => set({ peerRole }),
  setDuration: (duration) => set({ duration }),
  setIsOutgoing: (isOutgoing) => set({ isOutgoing }),
  reset: () => set(initialState),
}));
