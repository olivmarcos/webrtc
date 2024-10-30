import { useNavigate } from "react-router-dom"
import { Button } from "./components/ui/button";

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <div className="font-bold text-2xl">WebRTC</div>
      <Button onClick={() => navigate('/room/queue')}>Join Room</Button>
    </div>
  )
}
