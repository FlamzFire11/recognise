import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import SettingsPanel from "./SettingsPanel";
import FullscreenButton from "./FullscreenButton";

export default function HandDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const [hands, setHands] = useState(null);

  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(0);

  const [gestureData, setGestureData] = useState({
    gesture: "None",
    distance: 0,
    coords: [],
  });

  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const [options, setOptions] = useState({
    maxHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
    width: 640,
    height: 480,
  });

  // Initialize MediaPipe Hands
  useEffect(() => {
    const h = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    h.setOptions({
      maxNumHands: options.maxHands,
      modelComplexity: options.modelComplexity,
      minDetectionConfidence: options.minDetectionConfidence,
      minTrackingConfidence: options.minTrackingConfidence,
    });
    setHands(h);
    return () => h.close();
  }, [options.maxHands, options.modelComplexity, options.minDetectionConfidence, options.minTrackingConfidence]);

  // Handle results
  useEffect(() => {
    if (!hands) return;
    let lastTime = performance.now();
    let frames = 0;

    hands.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const video = videoRef.current;
      if (!ctx || !video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      let gesture = "None";
      let pinchDistance = 0;
      let coords = [];

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, canvas.width, canvas.height);
          drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

          const thumb = landmarks[4];
          const index = landmarks[8];
          if (thumb && index) {
            const dx = thumb.x - index.x;
            const dy = thumb.y - index.y;
            pinchDistance = Math.sqrt(dx * dx + dy * dy);

            if (pinchDistance < 0.05) gesture = "Pinch";
            else if (index.y < landmarks[6].y && thumb.x < landmarks[3].x)
              gesture = "Thumbs Up";
            else gesture = "Open Hand";
          }

          coords = [4, 8, 12, 16, 20].map((i) => ({
            x: (1 - landmarks[i].x).toFixed(2),
            y: landmarks[i].y.toFixed(2),
          }));
        }
      }

      setGestureData({ gesture, distance: pinchDistance.toFixed(3), coords });

      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
    });
  }, [hands]);

  // Start camera
  async function startCamera(deviceId) {
    if (!videoRef.current || !hands) return;
    const video = videoRef.current;

    try {
      // Stop old camera
      if (cameraRef.current && cameraRef.current.stop) cameraRef.current.stop();
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }

      // Apply MediaPipe options
      hands.setOptions({
        maxNumHands: options.maxHands,
        modelComplexity: options.modelComplexity,
        minDetectionConfidence: options.minDetectionConfidence,
        minTrackingConfidence: options.minTrackingConfidence,
      });

      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;

      cameraRef.current = new Camera(video, {
        onFrame: async () => await hands.send({ image: video }),
        width: options.width,
        height: options.height,
      });

      cameraRef.current.start();
      setRunning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
      setRunning(false);
    }
  }

  // List cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
        startCamera(videoDevices[0].deviceId);
      }
    });
  }, [hands]);

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 p-4">
      <div className="relative w-full max-w-4xl">
        <video ref={videoRef} className="hidden" playsInline />
        <canvas ref={canvasRef} className="w-full rounded-lg shadow-lg bg-black" />
        <div className="absolute top-3 left-3 bg-white/70 px-2 py-1 rounded">
          {running ? "Camera: active" : "Camera: inactive"}
        </div>
        <div className="absolute top-3 right-3 bg-white/70 px-2 py-1 rounded">
          FPS: {fps}
        </div>
        <FullscreenButton targetRef={canvasRef} />
      </div>

      <SettingsPanel
        cameras={cameras}
        selectedCamera={selectedCamera}
        onCameraChange={id => {
          setSelectedCamera(id);
          startCamera(id);
        }}
        options={options}
        onOptionsChange={setOptions}
      />

      <div className="w-full max-w-4xl text-sm bg-gray-100 rounded p-3 shadow">
        <p><strong>Gesture:</strong> {gestureData.gesture}</p>
        <p><strong>Thumb–Index Distance:</strong> {gestureData.distance}</p>
        <p><strong>Finger Coords:</strong></p>
        <ul className="list-disc pl-5">
          {gestureData.coords.map((c, i) => (
            <li key={i}>Finger {i + 1}: (x: {c.x}, y: {c.y})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Draw helpers
function drawLandmarks(ctx, landmarks, width, height) {
  for (const lm of landmarks) {
    const x = (1 - lm.x) * width;
    const y = lm.y * height;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,150,255,0.9)";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();
  }
}

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17]
];

function drawConnectors(ctx, landmarks, width, height) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,200,120,0.85)";
  for (const [aI,bI] of CONNECTIONS) {
    const a = landmarks[aI], b = landmarks[bI];
    if (!a || !b) continue;
    const ax = (1-a.x)*width, ay = a.y*height;
    const bx = (1-b.x)*width, by = b.y*height;
    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.lineTo(bx,by);
    ctx.stroke();
  }
}
