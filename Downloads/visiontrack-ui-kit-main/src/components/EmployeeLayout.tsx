import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  UserPlus,
  UserCog,
  Scan,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface EmployeeLayoutProps {
  children: ReactNode;
}

interface UserRoleResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    role: string;
  };
  message: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee" },
];

const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employeeName, setEmployeeName] = useState<string>("Employee User");
  const [employeeEmail, setEmployeeEmail] = useState<string>("employee@visiontrack.com");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // First check user role
    const checkUserRole = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/core/api/user-role/', {
          method: 'GET',
          headers: {
            'Authorization': `JWT ${localStorage.getItem('auth_token')}`
          }
        });

        const result: UserRoleResponse = await response.json();
        
        if (!mounted) return;

        if (result.success && result.data.role === 'employee') {
          setIsAuthorized(true);
          setEmployeeEmail(result.data.email);
          
          // Get full employee name from check API using email
          const userEmail = result.data.email;
          try {
            const checkResponse = await fetch('http://127.0.0.1:8000/core/api/employees/check/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `JWT ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({ email: userEmail })
            });

            const checkResult = await checkResponse.json();
            
            if (checkResult.success && checkResult.data?.name) {
              setEmployeeName(checkResult.data.name);
            } else {
              setEmployeeName(userEmail.split('@')[0] || 'Employee User');
            }
          } catch (checkErr) {
            console.error('Error fetching employee name:', checkErr);
            setEmployeeName(userEmail.split('@')[0] || 'Employee User');
          }
        } else if (result.success && result.data.role === 'admin') {
          // User is admin, not authorized
          setIsAuthorized(false);
          toast({
            title: "Access Denied",
            description: "You are not authorized to access the employee portal.",
            variant: "destructive"
          });
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setIsAuthorized(false);
        toast({
          title: "Error",
          description: "Failed to verify access permissions.",
          variant: "destructive"
        });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } finally {
        if (mounted) {
          setIsCheckingRole(false);
        }
      }
    };

    checkUserRole();

    return () => {
      mounted = false;
    };
  }, [navigate, toast]);

  // Show loading state while checking role
  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  // If not authorized, don't render the layout
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VisionTrack
            </span>
          </Link>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              try {
                // Clear localStorage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('employee_name');
                localStorage.removeItem('employee_email');

                // Clear cookies (access_token, refresh_token)
                if (typeof document !== 'undefined') {
                  document.cookie = 'access_token=; Max-Age=0; path=/;';
                  document.cookie = 'refresh_token=; Max-Age=0; path=/;';
                }
              } catch (e) {
                // noop
              }
              // Redirect to login
              window.location.href = '/login';
            }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Employee Portal</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{employeeName?.[0] ?? 'E'}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{employeeName}</p>
                  <p className="text-xs text-muted-foreground">{employeeEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
