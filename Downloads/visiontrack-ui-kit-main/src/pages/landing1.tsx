import { useEffect, useState } from "react";
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

const iconMap = {
  Scan,
  Clock,
  Shield,
  BarChart3,
  Users,
  Zap,
  CheckCircle2,
};

const Landing = () => {
  const [settings, setSettings] = useState(null);
  const [features, setFeatures] = useState([]);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/core/landing/")// your API endpoint
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings);
        setFeatures(data.features);
        setSteps(data.steps);
      });
  }, []);

  if (!settings) return <div className="text-center py-20">Loading...</div>;

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
                {settings.hero_title.split(" ")[0]}{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {settings.hero_title.replace(settings.hero_title.split(" ")[0], "")}
                </span>
              </h1>

              <p className="text-xl text-muted-foreground">
                {settings.hero_subtitle}
              </p>

              <div className="flex flex-wrap gap-4">
                <a href={settings.cta_primary_link}>
                  <Button size="lg" className="gap-2">
                    {settings.cta_primary_text}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>

                <a href={settings.cta_secondary_link}>
                  <Button size="lg" variant="outline">
                    {settings.cta_secondary_text}
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {settings.accuracy_rate}
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>

                <div>
                  <div className="text-3xl font-bold text-primary">
                    {settings.recognition_time}
                  </div>
                  <div className="text-sm text-muted-foreground">Recognition Time</div>
                </div>

                <div>
                  <div className="text-3xl font-bold text-primary">
                    {settings.uptime}
                  </div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <img
                
                src={settings?.hero_image ? `http://127.0.0.1:8000${settings.hero_image}` : heroImage } 
                alt="AI Face Recognition"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>  
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline attendance management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = iconMap[feature.icon_name] || Scan;

              return (
                <Card
                  key={feature.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up"
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

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="relative animate-fade-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white">
                    {step.step_number}
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

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">{settings.site_name}</span>
          </div>
          <p className="text-muted-foreground">{settings.footer_text}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
