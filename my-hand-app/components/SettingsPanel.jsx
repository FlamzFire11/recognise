import React from "react";

export default function SettingsPanel({ cameras, selectedCamera, onCameraChange, options, onOptionsChange }) {
  return (
    <div className="w-full max-w-4xl bg-white rounded shadow p-3 flex flex-col gap-3">
      <div>
        <label>Select Camera:</label>
        <select value={selectedCamera || ""} onChange={e => onCameraChange(e.target.value)} className="border p-2 rounded w-full">
          {cameras.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cam.deviceId}`}</option>)}
        </select>
      </div>

      <div>
        <label>Max Hands: {options.maxHands}</label>
        <input type="range" min={1} max={5} value={options.maxHands} onChange={e => onOptionsChange({...options, maxHands: parseInt(e.target.value)})} />
      </div>

      <div>
        <label>Model Complexity: {options.modelComplexity}</label>
        <select value={options.modelComplexity} onChange={e => onOptionsChange({...options, modelComplexity: parseInt(e.target.value)})}>
          <option value={0}>0 (fast)</option>
          <option value={1}>1</option>
          <option value={2}>2 (accurate)</option>
        </select>
      </div>

      <div>
        <label>Detection Confidence: {options.minDetectionConfidence}</label>
        <input type="range" min={0.05} max={0.95} step={0.05} value={options.minDetectionConfidence} onChange={e => onOptionsChange({...options, minDetectionConfidence: parseFloat(e.target.value)})}/>
      </div>

      <div>
        <label>Tracking Confidence: {options.minTrackingConfidence}</label>
        <input type="range" min={0.05} max={0.95} step={0.05} value={options.minTrackingConfidence} onChange={e => onOptionsChange({...options, minTrackingConfidence: parseFloat(e.target.value)})}/>
      </div>

      <div>
        <label>Resolution:</label>
        <select value={`${options.width}x${options.height}`} onChange={e => {
          const [w,h] = e.target.value.split('x').map(Number);
          onOptionsChange({...options, width: w, height: h});
        }}>
          <option value="640x480">640x480</option>
          <option value="1280x720">1280x720</option>
          <option value="1920x1080">1920x1080</option>
        </select>
      </div>
    </div>
  );
}
