import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Employees",
      value: "284",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      change: "+12 this month"
    },
    {
      title: "Present Today",
      value: "256",
      icon: UserCheck,
      color: "from-green-500 to-green-600",
      change: "90.1% attendance"
    },
    {
      title: "Absentees",
      value: "28",
      icon: UserX,
      color: "from-red-500 to-red-600",
      change: "9.9% absent"
    },
    {
      title: "Late Arrivals",
      value: "12",
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
      change: "4.2% late"
    }
  ];

  const recentAttendance = [
    { id: 1, name: "John Smith", empId: "EMP001", time: "09:03 AM", status: "present" },
    { id: 2, name: "Sarah Johnson", empId: "EMP002", time: "09:15 AM", status: "present" },
    { id: 3, name: "Michael Brown", empId: "EMP003", time: "09:28 AM", status: "late" },
    { id: 4, name: "Emily Davis", empId: "EMP004", time: "09:01 AM", status: "present" },
    { id: 5, name: "David Wilson", empId: "EMP005", time: "09:45 AM", status: "late" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Attendance Chart Placeholder */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Monthly Attendance Overview</h3>
          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization will be integrated with backend data</p>
            </div>
          </div>
        </Card>

        {/* Recent Attendance */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Attendance Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => (
                  <tr key={record.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {record.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">{record.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{record.empId}</td>
                    <td className="py-3 px-4 text-muted-foreground">{record.time}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'present' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {record.status === 'present' ? 'On Time' : 'Late'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

// Placeholder chart icon
const BarChart = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" x2="12" y1="20" y2="10"></line>
    <line x1="18" x2="18" y1="20" y2="4"></line>
    <line x1="6" x2="6" y1="20" y2="16"></line>
  </svg>
);

export default AdminDashboard;
