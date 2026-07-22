import { create } from 'zustand';
import type { CallStatus, UserRole } from './types';

export interface PendingCall {
  calleeId: number | string;
  calleeName: string;
  requestId: number;
}

export interface CallState {
  status: CallStatus;
  callSessionId: number | null;
  peerId: number | string | null;
  peerName: string;
  peerRole: UserRole | string;
  duration: number;
  isOutgoing: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  connectedAt: number | null;
  pendingCall: PendingCall | null;
  setStatus: (status: CallStatus) => void;
  setCallSessionId: (id: number | null) => void;
  setPeerId: (id: number | string | null) => void;
  setPeerName: (name: string) => void;
  setPeerRole: (role: UserRole | string) => void;
  setDuration: (d: number) => void;
  setIsOutgoing: (v: boolean) => void;
  setIsMuted: (v: boolean) => void;
  setIsSpeakerOn: (v: boolean) => void;
  setConnectedAt: (t: number | null) => void;
  requestCall: (calleeId: number | string, calleeName: string, requestId: number) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  callSessionId: null,
  peerId: null,
  peerName: '',
  peerRole: '' as UserRole | string,
  duration: 0,
  isOutgoing: false,
  isMuted: false,
  isSpeakerOn: false,
  connectedAt: null,
  pendingCall: null,
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
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsSpeakerOn: (isSpeakerOn) => set({ isSpeakerOn }),
  setConnectedAt: (connectedAt) => set({ connectedAt }),
  requestCall: (calleeId, calleeName, requestId) => set({ pendingCall: { calleeId, calleeName, requestId } }),
  reset: () => set(initialState),
}));
