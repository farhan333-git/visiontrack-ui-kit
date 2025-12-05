import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, UserCheck, UserX, Clock, Settings, 
  Bell, Save, AlertCircle, CheckCircle2, Filter, Calendar 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { attendanceService } from '@/services/attendanceService';

// --- DYNAMIC DATA (fetched from backend) ---

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

  // Fetched state
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [monthlyStatsData, setMonthlyStatsData] = useState<any[]>([]);
  const [dailyActivityData, setDailyActivityData] = useState<any[]>([]);
  const [allEmployeeStats, setAllEmployeeStats] = useState<any[]>([]);
  const [cardsStats, setCardsStats] = useState<any>({});
  const [todayPieData, setTodayPieData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [pieChartDate, setPieChartDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();


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
    // Convert to backend shape and call update
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('No auth token found. Please login as admin to update settings.');
      return;
    }

    const pad = (s: string) => s.length === 4 ? `0${s}` : s;
    const start = attendanceConfig.startTime.includes(':') ? `${attendanceConfig.startTime}:00` : `${attendanceConfig.startTime}:00`;
    const end = attendanceConfig.endTime.includes(':') ? `${attendanceConfig.endTime}:00` : `${attendanceConfig.endTime}:00`;

    const payload = {
      start_time: start,
      end_time: end,
      late_buffer_minutes: Number(attendanceConfig.lateThresholdMinutes),
    };

    setLoading(true);
    attendanceService.updateConfig(payload)
      .then(() => {
        alert('Attendance rules updated');
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to update attendance rules');
      })
      .finally(() => setLoading(false));
  };

  const sendLateNotice = (id: number, name: string) => {
    // Use notify API (employee id must be provided). Our table stores empId as `empId` or employee_id
    setLoadingId(id);
    const record = recentAttendance.find(r => r.id === id) || {};
    const employeeId = record.employee_id || record.empId || record.employeeId || String(record.id);
    attendanceService.notifyEmployee(String(employeeId), 'late_warning')
      .then((res) => {
        alert(res?.message || `Notification sent to ${name}`);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to send notification');
      })
      .finally(() => setLoadingId(null));
  };

  const loadPieChartData = async (date: string) => {
    try {
      const records = await attendanceService.getAll({ date });
      const presentCount = records.filter(r => r.status === 'Present').length;
      const lateCount = records.filter(r => r.status === 'Late').length;
      const absentCount = records.filter(r => r.status === 'Absent').length;
      setTodayPieData([
        { name: 'Present', value: presentCount, color: '#22c55e' },
        { name: 'Late', value: lateCount, color: '#eab308' },
        { name: 'Absent', value: absentCount, color: '#ef4444' },
      ]);
    } catch (err) {
      console.error('Failed to load pie chart data:', err);
    }
  };

  // Load all dashboard data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // parallel requests
        const [cfg, summary, daily, employees, logs] = await Promise.all([
          attendanceService.getConfig(),
          attendanceService.getSummary(),
          attendanceService.getDaily(),
          attendanceService.getEmployeesStats(),
          attendanceService.getTodayLogs(),
        ]);

        if (!mounted) return;

        if (cfg) {
          // backend returns e.g. "09:00:00" strings
          const toTimeInput = (t: string) => t ? t.slice(0,5) : '';
          setAttendanceConfig({
            startTime: toTimeInput(cfg.start_time || ''),
            endTime: toTimeInput(cfg.end_time || ''),
            lateThresholdMinutes: String(cfg.late_buffer_minutes ?? '15'),
          });
        }

        if (summary) {
          setCardsStats(summary.cards || summary.cards_stats || {});
          setMonthlyStatsData(summary.pie_chart || summary.pie_chart || []);
        }

        if (daily) {
          setDailyActivityData(daily || []);
        }

        if (employees) {
          setAllEmployeeStats(employees || []);
        }

        if (logs) {
          // logs expected as array of { id, employee_id, name, time, status }
          setRecentAttendance(logs || []);
        }

        // Fetch today's attendance for pie chart
        await loadPieChartData(new Date().toISOString().slice(0, 10));

      } catch (err: unknown) {
          console.error('Failed to load dashboard data', err);

          // Detect authentication failures from ApiError or error message
          const statusCode = (err && typeof err === 'object' && 'statusCode' in err) ? (err as { statusCode?: number }).statusCode : undefined;
          const message = (err && typeof err === 'object' && 'message' in err) ? String((err as { message?: string }).message) : '';

          if (statusCode === 401 || /authentication credentials were not provided/i.test(message) || /not authenticated/i.test(message)) {
            // Prompt user to login and redirect to login page
            alert('You must sign in first. Redirecting to login page.');
            navigate('/login', { replace: true });
            return;
          }

          if (statusCode === 403 || /permission denied/i.test(message) || /not authorized/i.test(message)) {
            alert('You are not authorized to view this page.');
            navigate('/', { replace: true });
            return;
          }

        } finally {
          setLoading(false);
        }
    };

    load();
    return () => { mounted = false; };
  }, [navigate]);

  const stats = [
    { title: "Total Employees", value: String(cardsStats?.total_employees ?? cardsStats?.totalEmployees ?? 0), icon: Users, color: "from-blue-500 to-blue-600", change: "" },
    { title: "Present Today", value: String(cardsStats?.present_today ?? cardsStats?.presentToday ?? 0), icon: UserCheck, color: "from-green-500 to-green-600", change: "" },
    { title: "Absentees", value: String(cardsStats?.absent_today ?? cardsStats?.absentToday ?? 0), icon: UserX, color: "from-red-500 to-red-600", change: "" },
    { title: "Late Arrivals", value: String(cardsStats?.late_today ?? cardsStats?.lateToday ?? 0), icon: Clock, color: "from-yellow-500 to-yellow-600", change: "" }
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
          
          {/* Chart A: Today's Attendance Breakdown */}
          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Attendance by Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Select Date</label>
                <div className="relative max-w-[200px]">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-10" 
                    value={pieChartDate} 
                    onChange={(e) => { setPieChartDate(e.target.value); loadPieChartData(e.target.value); }} 
                  />
                </div>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={todayPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {todayPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
                          {String((record.name || record.full_name || '').split(' ').map((n: string) => n[0]).join('')).slice(0,3)}
                        </div>
                        <span className="font-medium text-sm">{record.name || record.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{record.employee_id || record.empId || record.employeeId || '—'}</td>
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