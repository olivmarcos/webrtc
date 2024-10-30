import { Button } from "@/components/ui/button"
import { useUserMedia } from "@/hooks/useUserMedia"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import useWebSocket from "react-use-websocket"

export default function RoomQueue() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  const [me, setMe] = useState('')
  const [usersOnline, setUsersOnline] = useState(null)
  const [inQueue, setInQueue] = useState(false)

  const {
    accessGranted,
    activeStream: stream,
    stopAllStreaming,
  } = useUserMedia()

  useEffect(() => {
    console.log({ usersOnline })
  }, [usersOnline])

  const { sendJsonMessage } = useWebSocket("http://127.0.0.1:4000", {
    onOpen: () => {
      sendJsonMessage({
        type: 'me',
      })
    },
    onMessage: (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'me':
          setMe(data.id)
          break
        case 'usersOnline':
          setUsersOnline(data.size)
          break
        case 'roomFound':
          navigate(`/room/${data.roomId}`)
          break
        default:
          break
      }
    },
  })

  const onConnect = useCallback(() => {
    setInQueue(!inQueue) // TODO: Replace to update the state when receive it from backend
    sendJsonMessage({ type: inQueue ? 'queueExit' : 'queueJoin', userId: me })
  }, [inQueue, me, sendJsonMessage])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }
  }, [stream])

  useEffect(() => {
    return () => {
      stopAllStreaming()
    }
  }, [stopAllStreaming])

  const handleRefresh = useCallback(() => {
    location.replace(`/room/queue`)
  }, [])

  return (
    <div>

      {accessGranted ? (
        <div className="flex flex-col items-center justify-center">
          <video className="" ref={videoRef} autoPlay playsInline />

          <div className="mt-2 flex w-full flex-col items-center justify-between gap-6 sm:flex-row">
            <h2 className="text-sm sm:text-base">
              {inQueue
                ? 'Finding a practice buddy'
                : "Hit the 'I'm Ready' button when you feel ready to start practicing with someone."}
            </h2>
            <Button
              onClick={onConnect}
              className="z-10 w-full rounded-xl font-normal sm:w-auto"
            >
              {inQueue ? 'Cancel' : "I'm Ready"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-5 p-5">
          <h2 className="text-lg">
            We need access to your microphone and camera. Please
            enable permissions to continue.
          </h2>
          <Button className="h-12" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      )}
    </div>
  )
}
