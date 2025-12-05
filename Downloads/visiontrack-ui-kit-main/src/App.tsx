import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Employees from "./pages/Employees";
import RegisterFace from "./pages/RegisterFace";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
// Import the two new pages
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import ActivateAccount from "./pages/ActivateAccount";
// Import employee portal pages
import EmployeeDashboard from "./pages/EmployeeDashboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/register-face" element={<RegisterFace />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* Handles Account Activation Links */}
          {/* Example: http://localhost:8080/activate/Ng/cztvlg... */}
          <Route path="/activate/:uid/:token" element={<ActivateAccount />} />

          {/* Handles Password Reset Links */}
          {/* Example: http://localhost:8080/password/reset/confirm/Ng/cztvlg... */}
          <Route path="/password/reset/confirm/:uid/:token" element={<ResetPasswordConfirm />} />
          
          {/* Employee Portal Routes */}
          <Route path="/employee" element={<EmployeeDashboard />} />

          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;