import { useRef, useCallback, useEffect } from 'react';
import { useCallStore } from './callStore';

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

let cachedIceServers: RTCIceServer[] | null = null;
let iceServersPromise: Promise<RTCIceServer[]> | null = null;

async function fetchIceServers(token?: string): Promise<RTCIceServer[]> {
  if (cachedIceServers) return cachedIceServers;
  if (iceServersPromise) return iceServersPromise;

  iceServersPromise = (async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/calls/ice-servers`, { headers });
      if (!res.ok) return DEFAULT_STUN_SERVERS;
      const json = await res.json();
      const servers: RTCIceServer[] = json.data?.iceServers || DEFAULT_STUN_SERVERS;
      cachedIceServers = servers;
      return servers;
    } catch {
      return DEFAULT_STUN_SERVERS;
    }
  })();

  return iceServersPromise;
}

export function useWebRTCCall(onIceCandidate: (candidate: RTCIceCandidate) => void, token?: string) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(DEFAULT_STUN_SERVERS);

  useEffect(() => {
    fetchIceServers(token).then((servers) => {
      iceServersRef.current = servers;
    });
  }, [token]);

  const cleanup = useCallback(() => {
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    useCallStore.getState().setConnectedAt(null);
  }, []);

  const getOrCreatePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        onIceCandidate(e.candidate);
      }
    };

    pc.ontrack = (e) => {
      if (audioElRef.current) {
        audioElRef.current.srcObject = e.streams[0];
        return;
      }
      const audio = document.createElement('audio');
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      audio.id = 'remote-audio';
      document.body.appendChild(audio);
      audioElRef.current = audio;
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        const store = useCallStore.getState();
        if (store.status !== 'active') {
          store.setStatus('active');
          store.setConnectedAt(Date.now());
          durationRef.current = setInterval(() => {
            useCallStore.setState((s: { duration: number }) => ({ duration: s.duration + 1 }));
          }, 1000);
        }
      } else if (state === 'failed' || state === 'disconnected') {
        useCallStore.getState().setStatus('failed');
        cleanup();
        setTimeout(() => useCallStore.getState().reset(), 2000);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [onIceCandidate, cleanup]);

  const addLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    const pc = getOrCreatePC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    return stream;
  }, [getOrCreatePC]);

  const createOffer = useCallback(async () => {
    const pc = getOrCreatePC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, [getOrCreatePC]);

  const createAnswer = useCallback(async () => {
    const pc = getOrCreatePC();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, [getOrCreatePC]);

  const setRemoteDescription = useCallback(async (sdp: string) => {
    const pc = getOrCreatePC();
    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sdp)));
  }, [getOrCreatePC]);

  const addIceCandidate = useCallback(async (candidateStr: string) => {
    if (pcRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(candidateStr)));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        useCallStore.getState().setIsMuted(!track.enabled);
      }
    }
  }, []);

  const toggleSpeaker = useCallback(async () => {
    const next = !useCallStore.getState().isSpeakerOn;
    useCallStore.getState().setIsSpeakerOn(next);
    const audio = audioElRef.current;
    if (!audio) return;
    if ('setSinkId' in audio) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
        if (next && audioOutputs.length > 1) {
          const speaker =
            audioOutputs.find((d) => /speaker|external|phone/i.test(d.label)) ||
            audioOutputs[1];
          await (audio as any).setSinkId(speaker.deviceId);
        } else if (audioOutputs.length > 0) {
          await (audio as any).setSinkId(audioOutputs[0].deviceId);
        }
      } catch {
        // setSinkId not supported or failed
      }
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    addLocalStream,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleMute,
    toggleSpeaker,
    cleanup,
  };
}
