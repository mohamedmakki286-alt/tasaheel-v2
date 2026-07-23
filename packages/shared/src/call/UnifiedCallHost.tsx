import { useCallStore } from './callStore';
import { useCallSignaling } from './useCallSignaling';
import CallOverlay from './CallOverlay';
import IncomingCallDialog from './IncomingCallDialog';
import type { UserRole } from './types';

interface UnifiedCallHostProps {
  userId: number | string;
  userName: string;
  userRole: UserRole;
  token: string;
}

export default function UnifiedCallHost({ userId, userName, userRole, token }: UnifiedCallHostProps) {
  const callState = useCallStore();
  const { answerCall, rejectCall, hangUp, toggleMute, toggleSpeaker } = useCallSignaling({
    userId,
    userName,
    userRole,
    token,
  });

  return (
    <>
      <IncomingCallDialog
        isOpen={callState.status === 'ringing' && !callState.isOutgoing}
        callerName={callState.peerName}
        callerRole={callState.peerRole}
        onAccept={answerCall}
        onReject={rejectCall}
      />
      <CallOverlay
        status={callState.status}
        peerName={callState.peerName}
        duration={callState.duration}
        isOutgoing={callState.isOutgoing}
        isMuted={callState.isMuted}
        isSpeakerOn={callState.isSpeakerOn}
        onHangUp={hangUp}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
      />
    </>
  );
}
