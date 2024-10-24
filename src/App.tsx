import { useEffect, useRef } from "react";
import { Button } from "./components/ui/button"
import { useUserMedia } from "./hooks/useUserMedia"

export default function App() {
  const { getUserPermission, activeStream } = useUserMedia();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
    }
  }, [activeStream])

  return (
    <h1 className="w-screen h-screen flex flex-col items-center justify-center">
      <div>
        <video ref={videoRef} autoPlay playsInline muted />
      </div>
      <Button onClick={getUserPermission}>Check Permission</Button>
    </h1>
  )
}