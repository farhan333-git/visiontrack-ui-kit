import EmployeeLayout from "@/components/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Scan, Clock, Calendar } from "lucide-react";
import * as faceapi from '@vladmandic/face-api';
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EmployeeCheckResponse {
  success: boolean;
  exists: boolean;
  data: {
    userId: string;
    name: string;
    email: string;
    hasEncoding: boolean;
  } | null;
  message: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  timestamp: string;
  date: string;
  time: string;
  status: string;
}

interface AttendanceHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    success: boolean;
    verified: boolean;
    data?: AttendanceRecord[];
    message: string;
  };
}

const EmployeeDashboard = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBox, setFaceBox] = useState<FaceDetection | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedFaceLandmarks, setCapturedFaceLandmarks] = useState<faceapi.FaceLandmarks68 | null>(null);
  const [showMesh, setShowMesh] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const capturedImageRef = useRef<HTMLImageElement>(null);
  
  // New states for employee verification
  const [isCheckingEmployee, setIsCheckingEmployee] = useState(true);
  const [employeeExists, setEmployeeExists] = useState<boolean | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeCheckResponse | null>(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);

  // Attendance logs states
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isVerifiedForLogs, setIsVerifiedForLogs] = useState<boolean | null>(null);
  const [logsMessage, setLogsMessage] = useState<string>("");

  // Check if employee exists on component mount
  useEffect(() => {
    const checkEmployee = async () => {
      const userEmail = localStorage.getItem('employee_email');
      
      if (!userEmail) {
        toast({
          title: "Error",
          description: "No email found. Please login again.",
          variant: "destructive"
        });
        setIsCheckingEmployee(false);
        return;
      }

      try {
        setIsCheckingEmployee(true);
        const response = await fetch('http://127.0.0.1:8000/core/api/employees/check/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ email: userEmail })
        });

        const result: EmployeeCheckResponse = await response.json();
        
        if (result.success) {
          setEmployeeData(result);
          setEmployeeExists(result.exists);
          // Don't auto-show face capture, let user click the button
        } else {
          // If API doesn't return expected format, assume employee doesn't exist
          setEmployeeExists(false);
        }
      } catch (error) {
        console.error('Error checking employee:', error);
        toast({
          title: "Error",
          description: "Failed to check employee status",
          variant: "destructive"
        });
        // On error, assume employee doesn't exist but don't auto-show capture
        setEmployeeExists(false);
      } finally {
        setIsCheckingEmployee(false);
      }
    };

    checkEmployee();
  }, [toast]);

  // Fetch attendance logs
  useEffect(() => {
    const fetchAttendanceLogs = async () => {
      const userEmail = localStorage.getItem('employee_email');
      
      if (!userEmail) {
        return;
      }

      setIsLoadingLogs(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/core/api/employees/attendance-history/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ email: userEmail })
        });

        const result: AttendanceHistoryResponse = await response.json();
        
        if (result.results.success && result.results.verified) {
          setIsVerifiedForLogs(true);
          setAttendanceLogs(result.results.data || []);
          setLogsMessage(result.results.message);
        } else if (!result.results.verified) {
          setIsVerifiedForLogs(false);
          setLogsMessage(result.results.message);
        }
      } catch (error) {
        console.error('Error fetching attendance logs:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance history",
          variant: "destructive"
        });
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAttendanceLogs();
  }, [toast]);

  useEffect(() => {
    // Only initialize camera and models if face capture should be shown
    if (!showFaceCapture) return;

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

    // Real-time face detection every 5 seconds
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
            
            // Calculate center of detected face
            const faceCenterX = box.x + (box.width / 2);
            const faceCenterY = box.y + (box.height / 2);
            
            // Make box larger (add 100px to width and height)
            const newWidth = box.width + 100;
            const newHeight = box.height + 100;
            
            // Position box so face is centered, then move 85px to the right and 30px up
            const newX = faceCenterX - (newWidth / 2) + 85;
            const newY = faceCenterY - (newHeight / 2) - 30;
            
            // Update face box with centered position
            setFaceBox({
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
            });
            setFaceDetected(true);
            console.log('✓ Face detected at:', { x: newX, y: newY, width: newWidth, height: newHeight });
          } else {
            // No face detected - clear the box
            setFaceBox(null);
            setFaceDetected(false);
            console.log('✗ No face detected');
          }
        } catch (err) {
          console.error('Face detection error:', err);
          setFaceBox(null);
          setFaceDetected(false);
        }
      };

      // Run detection immediately
      detectFace();

      // Then run every 1 second
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
  }, [toast, modelsLoaded, showFaceCapture]);

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current || !canvasRef.current || !faceBox) {
      toast({
        title: "Error",
        description: "Camera not ready or face not detected",
        variant: "destructive"
      });
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Expand capture area: 80px to the left only
      const captureX = Math.max(0, faceBox.x - 80);
      const captureWidth = faceBox.width + 80; // Add left margin only
      const captureY = faceBox.y;
      const captureHeight = faceBox.height;
      
      // Set canvas to the expanded capture size
      canvas.width = captureWidth;
      canvas.height = captureHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Draw the expanded portion of video
      ctx.drawImage(
        video,
        captureX, captureY, captureWidth, captureHeight,  // Source rectangle from video (expanded)
        0, 0, captureWidth, captureHeight  // Destination rectangle on canvas
      );

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Stop camera stream
      stopVideoStream();
      
      // Stop face detection
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      
      setCapturedImage(imageDataUrl);
      
      // Analyze the captured image for face detection
      setTimeout(() => analyzeCapturedImage(imageDataUrl), 100);
      
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message?: string }).message) 
        : 'Failed to capture image';
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  const confirmCapture = async () => {
    if (!capturedImage) return;

    // Testing: use hardcoded email
    // const userEmail = "mb@vision.com";
    const userEmail = localStorage.getItem('employee_email');

    console.log('Sending image with email:', userEmail);
    setIsProcessing(true);
    try {
      // Convert data URL to blob and ensure JPEG type
      const response = await fetch(capturedImage);
      let blob = await response.blob();
      if (blob.type !== 'image/jpeg') {
        blob = new Blob([await blob.arrayBuffer()], { type: 'image/jpeg' });
      }
      
      const formData = new FormData();
      // Send current user email
      formData.append('email', userEmail);
      formData.append('image', blob, 'face-verification.jpg');

      // Post to core/api/employees/face-upload/ endpoint
      const uploadResponse = await fetch('http://localhost:8000/core/api/employees/upload/', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `JWT ${localStorage.getItem('auth_token')}`
        }
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Face upload failed');
      }

      const result = await uploadResponse.json();
      console.log('Upload result:', result);

      toast({
        title: "Success",
        description: result.message || "✓ Face uploaded successfully",
      });
      
      // Reload the page after successful verification
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err 
        ? String((err as { message?: string }).message) 
        : 'Face verification failed';
      
      toast({
        title: "Error",
        description: `✗ ${message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeCapturedImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    
    try {
      // Create an image element from the data URL
      const img = new Image();
      img.src = imageDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Detect face in the captured image
      const detections = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks();
      
      if (detections && detections.landmarks) {
        // Face detected - show mesh overlay
        console.log('✓ Face detected in captured image');
        setCapturedFaceLandmarks(detections.landmarks);
        setShowMesh(true);
        
        // Show mesh for 5 seconds
        setTimeout(() => {
          setShowMesh(false);
          setIsAnalyzing(false);
        }, 5000);
        
        toast({
          title: "Face Analyzed",
          description: "✓ Face detected and verified",
        });
      } else {
        // No face detected - auto retry
        console.log('✗ No face detected in captured image, retrying...');
        toast({
          title: "No Face Detected",
          description: "Returning to camera...",
          variant: "destructive"
        });
        
        setTimeout(() => {
          recapture();
        }, 1500);
      }
    } catch (err) {
      console.error('Face analysis error:', err);
      toast({
        title: "Analysis Failed",
        description: "Returning to camera...",
        variant: "destructive"
      });
      
      setTimeout(() => {
        recapture();
      }, 1500);
    }
  };

  const recapture = () => {
    // Reload the page instead of restarting camera
    window.location.reload();
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
          
          // Calculate center of detected face
          const faceCenterX = box.x + (box.width / 2);
          const faceCenterY = box.y + (box.height / 2);
          
          // Make box larger (add 100px to width and height)
          const newWidth = box.width + 100;
          const newHeight = box.height + 100;
          
          // Position box so face is centered, then move 85px to the right and 30px up
          const newX = faceCenterX - (newWidth / 2) + 85;
          const newY = faceCenterY - (newHeight / 2) - 30;
          
          // Update face box with centered position
          setFaceBox({
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          });
          setFaceDetected(true);
          console.log('✓ Face detected at:', { x: newX, y: newY, width: newWidth, height: newHeight });
        } else {
          // No face detected - clear the box
          setFaceBox(null);
          setFaceDetected(false);
          console.log('✗ No face detected');
        }
      } catch (err) {
        console.error('Face detection error:', err);
        setFaceBox(null);
        setFaceDetected(false);
      }
    };

    // Run detection immediately
    detectFace();

    // Then run every 1 second
    detectionIntervalRef.current = setInterval(detectFace, 1000);
  };

  return (
    <EmployeeLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Face Verification</h2>
          <p className="text-muted-foreground mt-1">
            Position your face clearly in the camera for verification
          </p>
        </div>

        {/* Loading State */}
        {isCheckingEmployee && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-muted-foreground">Checking your verification status...</p>
            </CardContent>
          </Card>
        )}

        {/* Employee Already Verified */}
        {!isCheckingEmployee && employeeExists && employeeData?.data && !showFaceCapture && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Face Already Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Your face is already verified!
                </h3>
                <p className="text-green-700 mb-4">
                  Welcome back, {employeeData.data?.name}
                </p>
                <p className="text-sm text-green-600 mb-6">
                  You can now mark your attendance. If you want to update your face verification, click the button below.
                </p>
                <Button 
                  onClick={() => setShowFaceCapture(true)}
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Re-verify Face
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Not Found - Need Verification */}
        {!isCheckingEmployee && employeeExists === false && !showFaceCapture && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-6 w-6 text-orange-500" />
                Verification Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <Scan className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-orange-900 mb-2">
                  Face Verification Needed
                </h3>
                <p className="text-orange-700 mb-4">
                  To mark your attendance, you need to verify your face first.
                </p>
                <p className="text-sm text-orange-600 mb-6">
                  This is a one-time process that helps us securely identify you for attendance tracking.
                </p>
                <Button 
                  onClick={() => setShowFaceCapture(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Face Capture Section - Only shown when needed */}
        {showFaceCapture && (
          <Card>
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
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    width="640"
                    height="480"
                    autoPlay
                    playsInline
                    muted
                    className="rounded-lg"
                  />
                  
                  {/* AI Overlay Effects - only show when not captured */}
                  <div className="absolute inset-0 pointer-events-none">
                {/* Corner Brackets */}
                <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}>
                  {/* Top-left corner */}
                  <path d="M 60 40 L 40 40 L 40 60" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Top-right corner */}
                  <path d="M 580 40 L 600 40 L 600 60" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Bottom-left corner */}
                  <path d="M 40 420 L 40 440 L 60 440" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Bottom-right corner */}
                  <path d="M 580 440 L 600 440 L 600 420" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>

                {/* Face Detection Frame - only shows when face is actually detected */}
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
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br" />
                    
                    {/* Face detection label */}
                    <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      FACE DETECTED
                    </div>
                  </div>
                )}

                {/* Scanning Line Animation */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  style={{ 
                    top: `${scanAnimation}%`,
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
                    transition: 'top 0.05s linear'
                  }}
                />

                {/* Grid Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-20">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Status Indicators */}
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

                {/* Crosshair Center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative w-8 h-8">
                    <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-blue-400 -translate-x-1/2" />
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-blue-400 -translate-x-1/2" />
                    <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-blue-400 -translate-y-1/2" />
                    <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-blue-400 -translate-y-1/2" />
                  </div>
                </div>
              </div>
                </>
              ) : (
                // Show captured image for confirmation
                <div className="relative">
                  <img
                    ref={capturedImageRef}
                    src={capturedImage}
                    alt="Captured face"
                    className="rounded-lg max-w-full"
                    style={{ maxHeight: '480px' }}
                  />
                  
                  {/* Analyzing Overlay */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-white font-semibold text-lg">Analyzing Face...</p>
                        <p className="text-blue-300 text-sm mt-1">AI Detection in Progress</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Mesh Overlay */}
                  {showMesh && capturedFaceLandmarks && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 3px rgba(34, 197, 94, 0.8))' }}>
                      {/* Draw face mesh using landmarks */}
                      {/* Jaw line */}
                      {Array.from({ length: 16 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[i];
                        const p2 = capturedFaceLandmarks.positions[i + 1];
                        return (
                          <line
                            key={`jaw-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {/* Right eyebrow */}
                      {Array.from({ length: 4 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[17 + i];
                        const p2 = capturedFaceLandmarks.positions[17 + i + 1];
                        return (
                          <line
                            key={`rbrow-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {/* Left eyebrow */}
                      {Array.from({ length: 4 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[22 + i];
                        const p2 = capturedFaceLandmarks.positions[22 + i + 1];
                        return (
                          <line
                            key={`lbrow-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {/* Nose bridge */}
                      {Array.from({ length: 3 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[27 + i];
                        const p2 = capturedFaceLandmarks.positions[27 + i + 1];
                        return (
                          <line
                            key={`nose-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {/* Nose bottom */}
                      {Array.from({ length: 4 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[31 + i];
                        const p2 = capturedFaceLandmarks.positions[31 + ((i + 1) % 5)];
                        return (
                          <line
                            key={`noseb-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {/* Right eye */}
                      {Array.from({ length: 6 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[36 + i];
                        const p2 = capturedFaceLandmarks.positions[36 + ((i + 1) % 6)];
                        return (
                          <line
                            key={`reye-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.9"
                          />
                        );
                      })}
                      
                      {/* Left eye */}
                      {Array.from({ length: 6 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[42 + i];
                        const p2 = capturedFaceLandmarks.positions[42 + ((i + 1) % 6)];
                        return (
                          <line
                            key={`leye-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.9"
                          />
                        );
                      })}
                      
                      {/* Outer lips */}
                      {Array.from({ length: 12 }).map((_, i) => {
                        const p1 = capturedFaceLandmarks.positions[48 + i];
                        const p2 = capturedFaceLandmarks.positions[48 + ((i + 1) % 12)];
                        return (
                          <line
                            key={`lips-${i}`}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {/* Draw landmark points */}
                      {capturedFaceLandmarks.positions.map((point, i) => (
                        <circle
                          key={`point-${i}`}
                          cx={point.x}
                          cy={point.y}
                          r="2"
                          fill="#22c55e"
                          opacity="0.7"
                        />
                      ))}
                    </svg>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    {isAnalyzing ? (
                      <>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Analyzing
                      </>
                    ) : showMesh ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Face Verified
                      </>
                    ) : (
                      'Preview'
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Action Buttons */}
            {!isAnalyzing && (
              <div className="flex justify-center gap-3">
                {!capturedImage ? (
                  <Button 
                    onClick={verifyFace} 
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
                        Capture Face
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={confirmCapture} 
                      size="lg"
                      disabled={isProcessing}
                      className="min-w-[150px]"
                    >
                      {isProcessing ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={recapture}
                      variant="outline"
                      size="lg"
                      disabled={isProcessing}
                      className="min-w-[150px]"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Recapture
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Instructions */}
            {!capturedImage && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Instructions:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Position your face within the detection frame</li>
                  <li>• Ensure good lighting and clear visibility</li>
                  <li>• Wait for "Face Detected" status before capturing</li>
                  <li>• Review captured image before confirming</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Attendance Logs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading attendance history...</span>
              </div>
            ) : isVerifiedForLogs === false ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <Scan className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-orange-900 mb-2">
                  Verification Required
                </h3>
                <p className="text-orange-700">
                  {logsMessage || "You are not verified. Please do face verification first for logs."}
                </p>
              </div>
            ) : attendanceLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No attendance records found.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(log.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {log.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.status.toLowerCase() === 'present'
                                ? 'bg-green-100 text-green-800'
                                : log.status.toLowerCase() === 'late'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
