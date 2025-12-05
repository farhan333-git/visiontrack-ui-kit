import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { 
  Scan, 
  Clock, 
  Shield, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Users
} from "lucide-react";
import heroImage from "@/assets/faca-recognition_Jngq3Yy.jpg";

const Landing = () => {
  const features = [
    {
      icon: Scan,
      title: "Real-Time Face Recognition",
      description: "Advanced AI technology identifies employees instantly with high accuracy"
    },
    {
      icon: Clock,
      title: "Automatic Attendance",
      description: "No manual check-ins required. Attendance is marked automatically on recognition"
    },
    {
      icon: Users,
      title: "Employee Dashboard",
      description: "Personal dashboards for employees to view their attendance history and records"
    },
    {
      icon: BarChart3,
      title: "Admin Reporting",
      description: "Comprehensive analytics and reports for better workforce management"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Register Face",
      description: "Employees register their face in seconds using the webcam or photo upload"
    },
    {
      number: "02",
      title: "Walk In",
      description: "Simply walk past the camera at entrance. No cards or badges needed"
    },
    {
      number: "03",
      title: "Automatic Tracking",
      description: "Attendance is automatically recorded with accurate timestamps"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                AI-Powered Technology
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                AI-Powered Face
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}Attendance System
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Fast, automatic, and secure attendance tracking using advanced facial recognition technology. 
                Say goodbye to manual attendance and buddy punching.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>  
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Admin Login
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">2s</div>
                  <div className="text-sm text-muted-foreground">Recognition Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </div>
            
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="Face Recognition Technology" 
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline attendance management and boost productivity
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up border-border/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with attendance tracking in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative animate-fade-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-accent/50"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-accent">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Attendance System?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations using VisionTrack for accurate, automated attendance tracking
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">VisionTrack</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 VisionTrack. AI-Powered Face Attendance System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
