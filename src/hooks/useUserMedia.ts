import { useCallback, useEffect, useMemo, useState } from "react";

type MediaConstraints = {
  audio?: string;
  video?: string;
};

export const useUserMedia = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [ready, setReady] = useState<boolean>(false);

  const stopStreaming = useCallback(async (_stream?: MediaStream) => {
    if (_stream) {
      _stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const _stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setAccessGranted(true);
      stopStreaming(_stream);

      return {
        video: true,
        audio: true,
      };
    } catch (error) {
      console.error("Error accessing media devices.", error);
      setAccessGranted(false);
      return {
        video: false,
        audio: false,
      };
    }
  }, [setAccessGranted, stopStreaming]);

  const stopAllStreaming = useCallback(async () => {
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  const requestPermission = useCallback(async () => {
    const _stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    stopStreaming(_stream);
    checkPermission();
  }, [stopStreaming, checkPermission]);

  const getDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setDevices(devices || []);
    return devices;
  }, [setDevices]);

  const updateUserMedia = useCallback(async (constraints: MediaConstraints) => {
    const _stream = await navigator.mediaDevices.getUserMedia({
      audio: constraints.audio
        ? { deviceId: { exact: constraints.audio } }
        : true,
      video: constraints.video
        ? { deviceId: { exact: constraints.video } }
        : true,
    });

    setActiveStream(_stream);
    setReady(true);
    return _stream;
  }, []);

  const audioDevices = useMemo(() => {
    return devices.filter(
      (device) => device.kind === "audioinput" && !!device.deviceId
    );
  }, [devices]);

  const outputDevices = useMemo(() => {
    return devices.filter(
      (device) => device.kind === "audiooutput" && !!device.deviceId
    );
  }, [devices]);

  const videoDevices = useMemo(() => {
    return devices.filter(
      (device) => device.kind === "videoinput" && !!device.deviceId
    );
  }, [devices]);

  useEffect(() => {
    const init = async () => {
      const permission = await checkPermission();

      if (!permission.audio || !permission.video) {
        requestPermission();
      }
    };

    init();
  }, [checkPermission, getDevices, requestPermission]);

  useEffect(() => {
    const init = async () => {
      const _devices = await getDevices();
      const audio = _devices.find(
        (device) => device.kind === "audioinput"
      )?.deviceId;
      const video = _devices.find(
        (device) => device.kind === "videoinput"
      )?.deviceId;

      const _stream = await updateUserMedia({ audio, video });
      setStream(_stream);
    };

    if (accessGranted && !stream) {
      init();
    }
  }, [getDevices, updateUserMedia, accessGranted, stream]);

  return {
    stream,
    activeStream,
    audioDevices,
    videoDevices,
    outputDevices,
    accessGranted,
    checkPermission,
    getDevices,
    devices,
    updateUserMedia,
    ready,
    stopAllStreaming
  };
};
