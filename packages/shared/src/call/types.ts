export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'active' | 'ended' | 'missed' | 'rejected' | 'cancelled' | 'failed' | 'disconnected' | 'busy';

export type UserRole = 'customer' | 'workshop' | 'technician' | 'admin';

export interface CallUser {
  id: number | string;
  name: string;
  role: UserRole;
}

export interface CallOfferPayload {
  type: 'call_offer';
  callSessionId: number;
  callerId: number | string;
  callerName: string;
  callerRole: UserRole;
  calleeId: number | string;
  calleeRole: UserRole;
  requestId: number;
  sdp: string;
  timestamp: number;
}

export interface CallAnswerPayload {
  type: 'call_answer';
  callSessionId: number;
  calleeId: number | string;
  sdp: string;
}

export interface CallCandidatePayload {
  type: 'call_candidate';
  callSessionId: number;
  userId: number | string;
  candidate: string;
}

export interface CallEndedPayload {
  type: 'call_ended';
  callSessionId: number;
  duration: number;
  endReason?: string;
}

export interface CallRejectedPayload {
  type: 'call_rejected';
  callSessionId: number;
}

export interface CallCancelledPayload {
  type: 'call_cancelled';
  callSessionId: number;
}

export interface CallErrorPayload {
  type: 'call_error';
  error: string;
}

export type CallMessage =
  | CallOfferPayload
  | CallAnswerPayload
  | CallCandidatePayload
  | CallEndedPayload
  | CallRejectedPayload
  | CallCancelledPayload
  | CallErrorPayload;

export const ROLE_LABELS: Record<string, string> = {
  customer: 'عميل',
  workshop: 'ورشة',
  technician: 'فني',
  admin: 'إدارة',
};
