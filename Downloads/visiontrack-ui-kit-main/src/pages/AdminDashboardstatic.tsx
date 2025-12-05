import React, { useState } from 'react';
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, UserCheck, UserX, Clock, Settings, 
  Bell, Save, AlertCircle, CheckCircle2, Filter 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// --- MOCK DATA ---

const monthlyStatsData = [
  { name: 'Present', value: 75, color: '#22c55e' },
  { name: 'Late', value: 15, color: '#eab308' },
  { name: 'Absent', value: 10, color: '#ef4444' },
];

const dailyActivityData = [
  { name: 'Mon', present: 240, late: 15, absent: 29 },
  { name: 'Tue', present: 255, late: 10, absent: 19 },
  { name: 'Wed', present: 230, late: 25, absent: 29 },
  { name: 'Thu', present: 250, late: 8, absent: 26 },
  { name: 'Fri', present: 260, late: 12, absent: 12 },
];

// EXPANDED DATA: All employees for the dropdown list
const allEmployeeStats = [
  { id: '1', name: 'John Smith', present: 20, late: 2, absent: 0 },
  { id: '2', name: 'Sarah Johnson', present: 22, late: 0, absent: 0 },
  { id: '3', name: 'Michael Brown', present: 15, late: 5, absent: 2 },
  { id: '4', name: 'Emily Davis', present: 18, late: 3, absent: 1 },
  { id: '5', name: 'David Wilson', present: 21, late: 1, absent: 0 },
  { id: '6', name: 'Jessica Lee', present: 19, late: 2, absent: 1 },
  { id: '7', name: 'Robert Taylor', present: 22, late: 0, absent: 0 },
  { id: '8', name: 'William Anderson', present: 16, late: 4, absent: 2 },
];

const AdminDashboard = () => {
  // --- STATE MANAGEMENT ---
  
  const [attendanceConfig, setAttendanceConfig] = useState({
    startTime: "09:00",
    endTime: "18:00",
    lateThresholdMinutes: "15",
  });

  const [loadingId, setLoadingId] = useState<number | null>(null);
  
  // NEW: State for the Employee Filter Dropdown
  const [selectedEmpId, setSelectedEmpId] = useState<string>("top5");

  // Mock Data for Table
  const [recentAttendance] = useState([
    { id: 1, name: "John Smith", empId: "EMP001", time: "09:03 AM", status: "present" },
    { id: 2, name: "Sarah Johnson", empId: "EMP002", time: "09:15 AM", status: "present" },
    { id: 3, name: "Michael Brown", empId: "EMP003", time: "09:28 AM", status: "late" },
    { id: 4, name: "Emily Davis", empId: "EMP004", time: "09:01 AM", status: "present" },
    { id: 5, name: "David Wilson", empId: "EMP005", time: "09:45 AM", status: "late" },
  ]);

  // --- LOGIC: Filter Chart Data ---
  const getChartData = () => {
    if (selectedEmpId === "top5") {
      return allEmployeeStats.slice(0, 5); // Return first 5
    }
    return allEmployeeStats.filter(emp => emp.id === selectedEmpId); // Return specific user
  };

  const displayedStats = getChartData();

  // --- HANDLERS ---

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttendanceConfig({ ...attendanceConfig, [e.target.name]: e.target.value });
  };

  const saveSettings = () => {
    alert(`Settings Saved!\nCheck-in: ${attendanceConfig.startTime}\nLate Buffer: ${attendanceConfig.lateThresholdMinutes} mins`);
  };

  const sendLateNotice = (id: number, name: string) => {
    setLoadingId(id);
    setTimeout(() => {
      alert(`Late notice sent to ${name}`);
      setLoadingId(null);
    }, 1000);
  };

  const stats = [
    { title: "Total Employees", value: "284", icon: Users, color: "from-blue-500 to-blue-600", change: "+12 this month" },
    { title: "Present Today", value: "256", icon: UserCheck, color: "from-green-500 to-green-600", change: "90.1% attendance" },
    { title: "Absentees", value: "28", icon: UserX, color: "from-red-500 to-red-600", change: "9.9% absent" },
    { title: "Late Arrivals", value: "12", icon: Clock, color: "from-yellow-500 to-yellow-600", change: "4.2% late" }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* 1. CONFIGURATION PANEL */}
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Attendance Rules Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Shift Start Time</label>
                <Input type="time" name="startTime" value={attendanceConfig.startTime} onChange={handleConfigChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Shift End Time</label>
                <Input type="time" name="endTime" value={attendanceConfig.endTime} onChange={handleConfigChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Late Buffer (Minutes)</label>
                <Input type="number" name="lateThresholdMinutes" value={attendanceConfig.lateThresholdMinutes} onChange={handleConfigChange} />
              </div>
              <Button onClick={saveSettings} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                <Save className="w-4 h-4 mr-2" /> Update Rules
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. STATS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 3. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Chart A: Monthly Overview */}
          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={monthlyStatsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {monthlyStatsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart B: Daily Trends */}
          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Daily Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyActivityData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stroke="#22c55e" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="late" stroke="#eab308" fill="none" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

           {/* Chart C: Employee Breakdown (UPDATED WITH DROPDOWN) */}
           <Card className="col-span-1 lg:col-span-2 xl:col-span-1 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Performance Stats</CardTitle>
              
              {/* DROPDOWN SELECTOR */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select 
                  className="h-8 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                >
                  <option value="top5">Top 5 Overview</option>
                  <option disabled>──────</option>
                  {allEmployeeStats.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {/* Dynamically render data based on 'displayedStats' */}
                <BarChart data={displayedStats} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconSize={8} fontSize={10}/>
                  
                  {/* Stacked Bars */}
                  <Bar dataKey="present" name="Present" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={20} />
                  <Bar dataKey="late" name="Late" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} barSize={20} />
                  <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 4. RECENT ATTENDANCE TABLE */}
        <Card className="shadow-sm border-t-4 border-t-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Today's Live Logs</CardTitle>
            <Button variant="outline" size="sm">Live Updating</Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase text-muted-foreground">Employee</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase text-muted-foreground">ID</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase text-muted-foreground">Time</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-sm">{record.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{record.empId}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{record.time}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        record.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {record.status === 'present' ? <CheckCircle2 className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                        {record.status === 'present' ? 'On Time' : 'Late'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {record.status === 'late' && (
                        <Button 
                          size="sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                          onClick={() => sendLateNotice(record.id, record.name)}
                          disabled={loadingId === record.id}
                        >
                          {loadingId === record.id ? 'Sending...' : <><Bell className="w-4 h-4 mr-1.5" /> Send Notice</>}
                        </Button>
                      )}
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

export default AdminDashboard;