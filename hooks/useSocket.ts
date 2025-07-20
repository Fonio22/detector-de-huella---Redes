// hooks/useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Tipos de enrolamiento
export interface EnrollStep {
  step: "scan1" | "scan2";
  message: string;
}
export interface EnrolledData {
  slot: number;
  message: string;
}
export interface VerifiedData {
  id: number;
  confidence: number;
}
export interface PhotoData {
  people_count: number;
  image: string;
}

// Return del hook
export interface UseSocketReturn {
  socketConnected: boolean;
  // Enrolamiento
  registerFingerprint: () => void;
  enrollStep: EnrollStep | null;
  enrolledData: EnrolledData | null;
  // Verificación
  verifyFingerprint: () => void;
  verifyResult: VerifiedData | null;
  verifyError: string | null;
  disableFingerprint: () => void;
  enableFingerprint: () => void;
  isFingerprintEnabled: boolean;
  // Reset contador
  resetCounter: () => void;
  resetMessage: string | null;
  // Preview
  startPreview: () => void;
  stopPreview: () => void;
  previewFrame: string | null;
  previewRunning: boolean;
  // Take photo
  takePhoto: () => void;
  photoData: PhotoData | null;
  photoError: string | null;
  resetPhoto: () => void;
  // Indicador de actividad
  isFingerprintActive: boolean;
  stopFingerprint: () => void;
}

let socket: Socket | null = null;

export function useSocket(): UseSocketReturn {
  const [connected, setConnected] = useState<boolean>(
    socket?.connected ?? false
  );
  const [enrollStep, setEnrollStep] = useState<EnrollStep | null>(null);
  const [enrolledData, setEnrolledData] = useState<EnrolledData | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifiedData | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isFingerprintEnabled, setIsFingerprintEnabled] =
    useState<boolean>(true);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [previewRunning, setPreviewRunning] = useState<boolean>(false);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isFingerprintActive, setIsFingerprintActive] =
    useState<boolean>(false);

  useEffect(() => {
    if (!socket) {
      const url = process.env.NEXT_PUBLIC_RASPERRY_PI_HOST;
      socket = io(url as string, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true,
      });
      // socket.onAny((event, ...args) => {
      //   console.log(`[useSocket] event [${event}]`, args);
      // });
    }

    setConnected(socket.connected);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Enrolamiento
    socket.on("enroll_step", (data) => setEnrollStep(data));
    socket.on("enrolled", (data) => {
      setEnrolledData(data);
      setIsFingerprintActive(false);
    });

    // Verificación
    socket.on("verified", (data) => {
      setVerifyResult(data);
      setIsFingerprintActive(false);
    });
    socket.on("fingerprint_disabled", () => setIsFingerprintEnabled(false));
    socket.on("fingerprint_enabled", () => setIsFingerprintEnabled(true));

    // Reset contador
    socket.on("reset_done", (data) => setResetMessage(data.message));

    // Preview
    socket.on("preview_started", () => setPreviewRunning(true));
    socket.on("preview_stopped", () => setPreviewRunning(false));
    socket.on("preview_frame", (data) => setPreviewFrame(data.image));

    // Take photo
    socket.on("photo_taken", (data) => setPhotoData(data));

    // Errores
    socket.on("error", (err) => {
      setVerifyError(err.detail);
      setPhotoError(err.detail);
      setIsFingerprintActive(false);
    });

    return () => {
      socket?.offAny();
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("enroll_step");
      socket?.off("enrolled");
      socket?.off("verified");
      socket?.off("fingerprint_disabled");
      socket?.off("fingerprint_enabled");
      socket?.off("reset_done");
      socket?.off("preview_started");
      socket?.off("preview_stopped");
      socket?.off("preview_frame");
      socket?.off("photo_taken");
      socket?.off("error");
    };
  }, []);

  const registerFingerprint = () => {
    if (!socket?.connected) return;
    setIsFingerprintActive(true);
    setEnrollStep(null);
    setEnrolledData(null);
    socket.emit("enroll");
  };

  const verifyFingerprint = () => {
    if (!socket?.connected || !isFingerprintEnabled) return;
    setIsFingerprintActive(true);
    setVerifyResult(null);
    setVerifyError(null);
    socket.emit("verify");
  };

  const disableFingerprint = () => {
    if (!socket?.connected) return;
    socket.emit("disable_fingerprint");
  };

  const enableFingerprint = () => {
    if (!socket?.connected) return;
    socket.emit("enable_fingerprint");
  };

  const resetCounter = () => {
    if (!socket?.connected) return;
    setResetMessage(null);
    socket.emit("reset");
  };

  const startPreview = () => {
    if (!socket?.connected) return;
    setPreviewFrame(null);
    socket.emit("start_preview");
  };

  const stopPreview = () => {
    if (!socket?.connected) return;
    socket.emit("stop_preview");
  };

  const takePhoto = () => {
    if (!socket?.connected) return;
    setPhotoData(null);
    setPhotoError(null);
    socket.emit("take_photo");
  };

  const resetPhoto = () => {
    setPhotoData(null);
    setPhotoError(null);
  };

  const stopFingerprint = () => setIsFingerprintActive(false);

  return {
    socketConnected: connected,
    registerFingerprint,
    enrollStep,
    enrolledData,
    verifyFingerprint,
    verifyResult,
    verifyError,
    disableFingerprint,
    enableFingerprint,
    isFingerprintEnabled,
    resetCounter,
    resetMessage,
    startPreview,
    stopPreview,
    previewFrame,
    previewRunning,
    takePhoto,
    photoData,
    photoError,
    resetPhoto,
    isFingerprintActive,
    stopFingerprint,
  };
}
