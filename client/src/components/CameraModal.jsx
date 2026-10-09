import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [cameraError, setCameraError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Hidden native camera input as fallback for devices/browsers that block getUserMedia
  const nativeCameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsStarting(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(err.message || 'Could not access camera. Please grant camera permission.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror image if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedImage({
            file,
            previewUrl: URL.createObjectURL(blob),
          });
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleRetake = () => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
    startCamera();
  };

  const handleSend = () => {
    if (capturedImage?.file) {
      onCapture(capturedImage.file);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Fallback native photo capture for mobile
  const handleNativeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onCapture(file);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay" onClick={handleClose}>
      <div className="camera-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="camera-close-btn" onClick={handleClose} title="Close camera">
          <X size={22} />
        </button>

        <div className="camera-modal-header">
          <h3>Live Camera 📸</h3>
        </div>

        {/* Viewfinder area */}
        <div className="camera-viewfinder-box">
          {capturedImage ? (
            <img src={capturedImage.previewUrl} alt="Captured" className="captured-preview-img" />
          ) : cameraError ? (
            <div className="camera-error-box">
              <AlertCircle size={36} className="error-icon" />
              <p>{cameraError}</p>
              <button
                type="button"
                className="btn-native-camera-fallback"
                onClick={() => nativeCameraInputRef.current?.click()}
              >
                <Camera size={18} />
                <span>Open Device Camera App</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`camera-video-feed ${facingMode === 'user' ? 'mirrored' : ''}`}
              />
              {isStarting && <div className="camera-loading-pill">Starting camera...</div>}
            </>
          )}
        </div>

        {/* Fallback hidden input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={nativeCameraInputRef}
          style={{ display: 'none' }}
          onChange={handleNativeFileChange}
        />

        {/* Control Buttons */}
        <div className="camera-controls-bar">
          {capturedImage ? (
            <div className="captured-actions">
              <button type="button" className="btn-camera-retake" onClick={handleRetake}>
                <RefreshCw size={18} />
                <span>Retake</span>
              </button>
              <button type="button" className="btn-camera-send" onClick={handleSend}>
                <Check size={18} />
                <span>Send Photo</span>
              </button>
            </div>
          ) : (
            <div className="live-actions">
              <button
                type="button"
                className="btn-camera-flip"
                onClick={toggleCameraFacing}
                title="Switch Camera (Front/Back)"
              >
                <RefreshCw size={20} />
              </button>

              <button
                type="button"
                className="btn-shutter-snap"
                onClick={handleTakeSnapshot}
                title="Capture Photo"
              >
                <div className="shutter-inner"></div>
              </button>

              <button
                type="button"
                className="btn-camera-device"
                onClick={() => nativeCameraInputRef.current?.click()}
                title="Use phone camera app"
              >
                <Camera size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
