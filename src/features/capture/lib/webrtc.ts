import {
  mediaDevices as nativeMediaDevices,
  RTCPeerConnection as NativePeerConnection,
} from 'react-native-webrtc';

// WebRTC on iOS and Android comes from react-native-webrtc, the web build
// uses the browser's (webrtc.web.ts). Both are typed as the browser API,
// which react-native-webrtc mirrors, so the hook has one code path.
export const RTCPeerConnection =
  NativePeerConnection as unknown as typeof globalThis.RTCPeerConnection;
export const mediaDevices = nativeMediaDevices as unknown as MediaDevices;
