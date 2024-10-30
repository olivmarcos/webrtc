import { MutableRefObject, useEffect, useRef, useState } from "react";
import Peer from 'simple-peer'
import useWebSocket from "react-use-websocket";
import { useUserMedia } from "@/hooks/useUserMedia";
import { useParams } from "react-router-dom";

export type Message = {
  sender: 'me' | 'other'
  content: string
}

export default function Room() {
  const { activeStream } = useUserMedia();
  const videoRef: MutableRefObject<HTMLVideoElement | null> = useRef(null)
  const peerRef: MutableRefObject<Peer.Instance | null> = useRef(null)
  const remoteRef = useRef<HTMLVideoElement | null>(null)

  const { id: roomId } = useParams();

  console.log({ roomId })

  const [me, setMe] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (connected && messages.length) {
      console.log('messages', messages)
    }
  }, [messages, connected])

  useEffect(() => {
    console.log({ loading })
  }, [loading])

  const { sendJsonMessage, getWebSocket } = useWebSocket(
    "http://127.0.0.1:4000",
    {
      onOpen: () => {
        sendJsonMessage({
          type: 'me',
        })
      },
      onClose: () => {
        console.log('websocket disconnected')
      },
      onMessage: (event) => {
        const data = JSON.parse(event.data)
        let isHost: boolean = false

        switch (data.type) {
          case 'me':
            setMe(data.id)
            break
          case 'createRoomFail':
            setError(
              'Unable to connect to the room. Please check your network connection and try again.'
            )
            setLoading(false)
            break
          case 'hostCall':
            isHost = me !== data.to
            peerRef.current = new Peer({
              initiator: isHost,
              trickle: false,
              stream: activeStream!,
            })

            peerRef.current?.on('stream', (remoteStream) => {
              if (remoteRef.current) {
                console.log('remoteStream', remoteStream)
                remoteRef.current.srcObject = remoteStream
              }
            })

            peerRef.current.on('connect', () => {
              const ws = getWebSocket()
              if (ws) {
                ws.close()
              }
              setConnected(true)
              setLoading(false)
            })

            peerRef.current.on('close', () => {
              if (!error) {
                location.replace(`/`)
              }
            })

            peerRef.current?.on('data', (message) => {
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'other', content: message.toString() },
              ])
            })

            if (isHost) {
              peerRef.current?.on('signal', (signalData) => {
                if (peerRef.current?.connected) return

                if (signalData.type === 'offer') {
                  sendJsonMessage({
                    type: 'sendOffer',
                    to: data.to,
                    signal: signalData,
                    from: me,
                  })
                }
              })
            }

            break
          case 'receiveOffer':
            peerRef.current?.signal(data.signal)
            peerRef.current?.on('signal', (signalData) => {
              if (peerRef.current?.connected) return
              if (signalData.type === 'answer') {
                sendJsonMessage({
                  type: 'sendAnswer',
                  to: data.from,
                  signal: signalData,
                })
              }
            })
            break
          case 'receiveAnswer':
            peerRef.current?.signal(data.signal)
            break
          default:
            break
        }
      },
    }
  )

  useEffect(() => {
    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play()

      setVideoReady(true)
    }
  }, [activeStream])

  useEffect(() => {
    if (videoReady && me) {
      sendJsonMessage({ type: 'roomEnter', roomId, id: me })
    }
  }, [me, videoReady, roomId, sendJsonMessage])
  

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="flex gap-2">
        <video className="w-1/2" ref={videoRef} autoPlay playsInline />
        <video className="w-1/2" ref={remoteRef} autoPlay playsInline />
      </div>
    </div>
  )
}