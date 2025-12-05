import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, User, Lock, Phone, Mail, ChevronDown, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://127.0.0.1:8000";

// Helper to set cookies
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const Login = () => {
  // Modes: login, signup, forgot_password, reset_password
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password" | "reset_password">("login");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get UID and Token from URL (for Reset Password flow)
  const { uid, token } = useParams();

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    re_password: "", 
    new_password: "",
    re_new_password: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Automatically switch to Reset Password mode if UID/Token exist in URL
  useEffect(() => {
    if (uid && token) {
      setMode("reset_password");
    }
  }, [uid, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- LOGIN LOGIC ---
      if (mode === "login") {
        const response = await fetch(`${API_URL}/auth/jwt/create/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store tokens both as cookies (existing) and in localStorage for the SPA
          setCookie("access_token", data.access, 1);
          setCookie("refresh_token", data.refresh, 7);
          try {
            localStorage.setItem('auth_token', data.access);
            // Save email to localStorage
            localStorage.setItem('employee_email', formData.email);
          } catch (err) {
            // ignore storage errors
          }

          // Try to extract user role from JWT payload if present
          try {
            const parts = (data.access || '').split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              const role = payload.role || payload.user_role || payload.role_name || (payload.user && payload.user.role);
              if (role) localStorage.setItem('user_role', String(role));
            }
          } catch (err) {
            // ignore decoding errors
          }

          // Check user role from API to determine redirect
          try {
            const roleResponse = await fetch("http://127.0.0.1:8000/core/api/user-role/", {
              method: "GET",
              headers: {
                'Authorization': `JWT ${data.access}`
              }
            });

            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              
              if (roleData.success && roleData.data) {
                const userRole = roleData.data.role;
                
                toast({
                  title: "Login Successful",
                  description: `Redirecting as ${userRole}...`,
                });

                // Redirect based on role
                if (userRole === 'admin') {
                  window.location.href = "http://localhost:8080/admin";
                } else if (userRole === 'employee') {
                  window.location.href = "http://localhost:8080/employee";
                } else {
                  // Default redirect
                  window.location.href = "http://localhost:8080/";
                }
              } else {
                throw new Error('Unable to determine user role');
              }
            } else {
              throw new Error('Failed to fetch user role');
            }
          } catch (roleError) {
            console.error('Error checking user role:', roleError);
            toast({
              title: "Login Successful",
              description: "Redirecting to dashboard...",
            });
            // Fallback redirect
            window.location.href = "http://localhost:8080/";
          }
        } else {
          throw new Error(data.detail || "Invalid credentials");
        }
      } 
      
      // --- SIGNUP LOGIC ---
      else if (mode === "signup") {
        const payload = {
          ...formData,
          username: formData.username || formData.email.split("@")[0],
          role: role,
        };

        const response = await fetch(`${API_URL}/auth/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Account Created",
            description: "Please check your email to activate your account.",
          });
          setMode("login");
        } else {
          const errorMsg = typeof data === 'object' ? Object.values(data).flat().join(" ") : "Registration failed";
          throw new Error(errorMsg);
        }
      }

      // --- FORGOT PASSWORD LOGIC ---
      else if (mode === "forgot_password") {
        const response = await fetch(`${API_URL}/auth/users/reset_password/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });

        // Djoser returns 204 No Content on success
        if (response.ok || response.status === 204) {
          toast({
            title: "Email Sent",
            description: "Check your inbox for the confirmation link.",
          });
          setMode("login"); 
        } else {
          throw new Error("Failed to send reset link.");
        }
      }

      // --- RESET PASSWORD CONFIRM LOGIC (UPDATED) ---
      else if (mode === "reset_password") {
        const response = await fetch(`${API_URL}/auth/users/reset_password_confirm/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: uid,
            token: token,
            new_password: formData.new_password,
            re_new_password: formData.re_new_password,
          }),
        });

        // Check status explicitly as body might be empty (204)
        if (response.ok || response.status === 204) {
          toast({
            title: "Password Reset Successful",
            description: "You can now login with your new password.",
          });
          
          // 1. Switch View to Login
          setMode("login");
          
          // 2. Clean the URL (remove uid/token) and go to /login path
          navigate("/login"); 
        } else {
          const data = await response.json();
          const errorMsg = typeof data === 'object' ? Object.values(data).flat().join(" ") : "Failed to reset password";
          throw new Error(errorMsg);
        }
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Title Helper
  const getTitle = () => {
    if (mode === "login") return "Welcome Back";
    if (mode === "signup") return "Create Account";
    if (mode === "forgot_password") return "Reset Password";
    if (mode === "reset_password") return "Set New Password";
  };

  // Subtitle Helper
  const getSubtitle = () => {
    if (mode === "login") return "Sign in to access your dashboard";
    if (mode === "signup") return "Fill your details to get started";
    if (mode === "forgot_password") return "Enter your email to receive a reset link";
    if (mode === "reset_password") return "Enter your new password below";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Scan className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VisionTrack
          </span>
        </Link>

        <Card className="p-8 shadow-xl">
          {/* Tabs (Only show in Login/Signup modes) */}
          {(mode === "login" || mode === "signup") && (
            <div className="flex items-center justify-center mb-6 bg-muted p-1 rounded-xl">
              <button
                onClick={() => setMode("login")}
                className={`w-1/2 py-2 rounded-lg transition-all ${
                  mode === "login" ? "bg-primary text-white shadow" : "text-muted-foreground"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`w-1/2 py-2 rounded-lg transition-all ${
                  mode === "signup" ? "bg-primary text-white shadow" : "text-muted-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <h1 className="text-3xl font-bold text-center mb-2">{getTitle()}</h1>
          <p className="text-muted-foreground text-center mb-8">{getSubtitle()}</p>

          {/* Role Dropdown (Signup Only) */}
          {mode === "signup" && (
            <div className="mb-6 relative">
              <button
                type="button"
                onClick={() => setRoleDropdown(!roleDropdown)}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition tracking-wide"
              >
                <span className="capitalize">Role: {role}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {roleDropdown && (
                <div className="absolute w-full mt-2 bg-background border rounded-lg shadow-lg z-20">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-muted transition capitalize"
                    onClick={() => { setRole("admin"); setRoleDropdown(false); }}
                  >
                    Admin
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-muted transition capitalize"
                    onClick={() => { setRole("employee"); setRoleDropdown(false); }}
                  >
                    Employee
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* --- SIGNUP FIELDS --- */}
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input name="first_name" placeholder="John" required onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input name="last_name" placeholder="Doe" required onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input name="username" placeholder="johndoe123" required className="pl-10" onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input name="phone_number" type="text" placeholder="+923001234567" required className="pl-10" onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {/* --- EMAIL FIELD (Login, Signup, Forgot Password) --- */}
            {mode !== "reset_password" && (
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input name="email" type="email" placeholder="user@visiontrack.com" required className="pl-10" onChange={handleChange} />
                </div>
              </div>
            )}

            {/* --- PASSWORD FIELDS (Login, Signup) --- */}
            {(mode === "login" || mode === "signup") && (
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input name="password" type="password" placeholder="Enter password" required className="pl-10" onChange={handleChange} />
                </div>
              </div>
            )}

            {/* --- CONFIRM PASSWORD (Signup) --- */}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input name="re_password" type="password" placeholder="Re-enter password" required className="pl-10" onChange={handleChange} />
                </div>
              </div>
            )}

            {/* --- NEW PASSWORD FIELDS (Reset Password) --- */}
            {mode === "reset_password" && (
              <>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input name="new_password" type="password" placeholder="Enter new password" required className="pl-10" onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input name="re_new_password" type="password" placeholder="Confirm new password" required className="pl-10" onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button type="button" onClick={() => setMode("forgot_password")} className="text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === "login" && "Sign In"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot_password" && "Send Reset Link"}
              {mode === "reset_password" && "Reset Password"}
            </Button>
          </form>

          {mode === "forgot_password" && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mx-auto">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">Back to Home</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;