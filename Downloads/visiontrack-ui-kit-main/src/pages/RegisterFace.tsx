import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RegisterFace = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    setCaptured(true);
    setTimeout(() => {
      toast({
        title: "Face Captured Successfully",
        description: "Face data has been registered for attendance.",
      });
    }, 500);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Face Registration</h2>
          <p className="text-muted-foreground mt-1">Register employee faces for attendance tracking</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Live Camera Feed</h3>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
              {!isCapturing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Camera is off</p>
                    <Button onClick={startCamera} className="gap-2">
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Face Detection Frame */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-64 h-80 border-4 rounded-3xl transition-all duration-300 ${
                      captured 
                        ? 'border-success animate-pulse' 
                        : 'border-primary animate-pulse-slow'
                    }`}>
                      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                      
                      {captured && (
                        <div className="absolute inset-0 flex items-center justify-center bg-success/20">
                          <CheckCircle2 className="w-16 h-16 text-success" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Scanning Line Effect */}
                  {isCapturing && !captured && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan opacity-50"></div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              {isCapturing && (
                <>
                  <Button onClick={capturePhoto} className="flex-1 gap-2" disabled={captured}>
                    <Camera className="w-4 h-4" />
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Upload Section */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Upload Photo</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Upload Employee Photo</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to select or drag and drop an image
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG (Max 5MB)
                </p>
                <input type="file" className="hidden" accept="image/*" />
              </div>

              <div className="bg-muted/30 rounded-lg p-6 space-y-3">
                <h4 className="font-semibold text-sm">Photo Guidelines:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Clear, well-lit photo of the face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Front-facing, no accessories blocking face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Neutral expression, eyes open</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Plain background preferred</span>
                  </li>
                </ul>
              </div>

              <Button className="w-full" size="lg">
                Register Face
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RegisterFace;
