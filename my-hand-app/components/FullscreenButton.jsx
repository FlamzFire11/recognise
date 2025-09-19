import React from "react";
import { Maximize2 } from "lucide-react";

export default function FullscreenButton({ targetRef }) {
  const enterFullscreen = () => {
    if (targetRef.current?.requestFullscreen) {
      targetRef.current.requestFullscreen();
    }
  };
  return (
    <button onClick={enterFullscreen} className="absolute bottom-3 right-3 bg-white/70 p-2 rounded shadow">
      <Maximize2 size={18} />
    </button>
  );
}
