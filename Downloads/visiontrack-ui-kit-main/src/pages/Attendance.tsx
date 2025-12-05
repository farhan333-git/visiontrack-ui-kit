import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, Scan, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import * as faceapi from '@vladmandic/face-api';

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Attendance = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBox, setFaceBox] = useState<FaceDetection | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let videoElement: HTMLVideoElement | null = null;
    let animationFrame: number;

    // Load face detection models
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        console.log('✓ Face detection models loaded successfully');
        
        toast({
          title: "AI Ready",
          description: "Face detection initialized",
        });
      } catch (err) {
        console.error('Failed to load face detection models:', err);
        setModelsLoaded(false);
        toast({
          title: "Warning",
          description: "Face detection models failed to load",
          variant: "destructive"
        });
      }
    };

    loadModels();

    // Start video stream
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoElement = videoRef.current;
          
          // Wait for video to be ready before starting detection
          videoRef.current.onloadedmetadata = () => {
            console.log('✓ Video stream ready');
            startFaceDetection();
          };
        }
      } catch (err) {
        console.error('Webcam error:', err);
        toast({
          title: "Camera Error",
          description: "Cannot access webcam. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    // Real-time face detection
    const startFaceDetection = () => {
      if (!modelsLoaded) {
        console.log('Models not loaded, skipping detection');
        return;
      }

      const detectFace = async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
          return;
        }

        try {
          const detections = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.5
            }))
            .withFaceLandmarks();

          if (detections && detections.detection) {
            const box = detections.detection.box;
            
            const faceCenterX = box.x + (box.width / 2);
            const faceCenterY = box.y + (box.height / 2);
            
            const newWidth = box.width + 100;
            const newHeight = box.height + 100;
            
            const newX = faceCenterX - (newWidth / 2) + 85;
            const newY = faceCenterY - (newHeight / 2) - 30;
            
            setFaceBox({
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
            });
            setFaceDetected(true);
          } else {
            setFaceBox(null);
            setFaceDetected(false);
          }
        } catch (err) {
          console.error('Face detection error:', err);
          setFaceBox(null);
          setFaceDetected(false);
        }
      };

      detectFace();
      detectionIntervalRef.current = setInterval(detectFace, 1000);
    };

    initCamera();

    // Scanning animation
    const animateScan = () => {
      setScanAnimation(prev => (prev + 2) % 100);
      animationFrame = requestAnimationFrame(animateScan);
    };
    animateScan();

    return () => {
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrame);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [toast, modelsLoaded]);

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const markAttendance = async () => {
    if (!videoRef.current || !canvasRef.current || !faceBox) {
      toast({
        title: "Error",
        description: "Camera not ready or face not detected",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const captureX = Math.max(0, faceBox.x - 80);
      const captureWidth = faceBox.width + 80;
      const captureY = faceBox.y;
      const captureHeight = faceBox.height;
      
      canvas.width = captureWidth;
      canvas.height = captureHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.drawImage(
        video,
        captureX, captureY, captureWidth, captureHeight,
        0, 0, captureWidth, captureHeight
      );

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Extract base64 data from the data URL
      const base64Image = imageDataUrl.split(',')[1];
      
      // Send directly to API
      const uploadResponse = await fetch('http://127.0.0.1:8000/core/api/mark-attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         
        },
        body: JSON.stringify({
          image: `data:image/jpeg;base64,${base64Image}`
        })
      });

      const result = await uploadResponse.json();
      console.log('Attendance result:', result);

      if (result.status === 'success') {
        if (result.data?.alreadyMarked) {
          toast({
            title: "Already Marked",
            description: result.message || `${result.data.employeeName} already marked today`,
          });
        } else {
          toast({
            title: "Attendance Confirmed",
            description: result.message || `✓ Attendance marked successfully`,
          });
        }
      } else if (result.status === 'error') {
        if (result.message.includes('No user found') || result.message.includes('No face')) {
          toast({
            title: "Recognition Failed",
            description: result.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Attendance marking failed",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(result.message || 'Attendance marking failed');
      }
      
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message?: string }).message) 
        : 'Failed to mark attendance';
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startFaceDetection = () => {
    if (!modelsLoaded) {
      console.log('Models not loaded, skipping detection');
      return;
    }

    const detectFace = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        return;
      }

      try {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks();

        if (detections && detections.detection) {
          const box = detections.detection.box;
          
          const faceCenterX = box.x + (box.width / 2);
          const faceCenterY = box.y + (box.height / 2);
          
          const newWidth = box.width + 100;
          const newHeight = box.height + 100;
          
          const newX = faceCenterX - (newWidth / 2) + 85;
          const newY = faceCenterY - (newHeight / 2) - 30;
          
          setFaceBox({
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          });
          setFaceDetected(true);
        } else {
          setFaceBox(null);
          setFaceDetected(false);
        }
      } catch (err) {
        console.error('Face detection error:', err);
        setFaceBox(null);
        setFaceDetected(false);
      }
    };

    detectFace();
    detectionIntervalRef.current = setInterval(detectFace, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Mark Attendance</h1>
            <p className="text-gray-400 mt-2">
              Position your face clearly in the camera for attendance marking
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Preview
              </div>
              {faceDetected && (
                <div className="flex items-center gap-2 text-green-500">
                  <Scan className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Face Detected</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                width="640"
                height="480"
                autoPlay
                playsInline
                muted
                className="rounded-lg"
              />
              
              <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}>
                  <path d="M 160 40 L 140 40 L 140 60" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 680 40 L 700 40 L 700 60" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 140 420 L 140 440 L 160 440" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 680 440 L 700 440 L 700 420" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>

                {faceDetected && faceBox && (
                  <div 
                    className="absolute border-2 border-green-500 rounded-lg transition-all duration-300"
                    style={{ 
                      left: `${faceBox.x}px`,
                      top: `${faceBox.y}px`,
                      width: `${faceBox.width}px`, 
                      height: `${faceBox.height}px`,
                      boxShadow: '0 0 30px rgba(34, 197, 94, 0.6), inset 0 0 30px rgba(34, 197, 94, 0.2)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  >
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br" />
                    
                    <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      FACE DETECTED
                    </div>
                  </div>
                )}

                <div 
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  style={{ 
                    top: `${scanAnimation}%`,
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
                    transition: 'top 0.05s linear'
                  }}
                />

                <svg className="absolute inset-0 w-full h-full opacity-20">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-xs text-white font-mono">
                      {faceDetected ? 'LOCKED' : 'SCANNING'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-xs text-blue-400 font-mono">AI: ACTIVE</span>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative w-8 h-8">
                    <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-blue-400 -translate-x-1/2" />
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-blue-400 -translate-x-1/2" />
                    <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-blue-400 -translate-y-1/2" />
                    <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-blue-400 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="flex justify-center gap-3">
              <Button 
                onClick={markAttendance} 
                size="lg"
                disabled={isProcessing || !faceDetected}
                className="min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <Camera className="h-4 w-4 mr-2 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Position your face within the detection frame</li>
                <li>• Ensure good lighting and clear visibility</li>
                <li>• Wait for "Face Detected" status before capturing</li>
                <li>• Click "Mark Attendance" to complete</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
