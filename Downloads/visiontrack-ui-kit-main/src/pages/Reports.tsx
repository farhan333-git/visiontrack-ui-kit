import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { attendanceService } from "@/services/attendanceService";
import { useToast } from "@/hooks/use-toast";

type DailyRow = { name: string; present: number; late: number; absent: number };
type EmployeeStatus = { employeeId: string; name: string; status: 'Present' | 'Late' | 'Absent' };

const Reports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dailyRows, setDailyRows] = useState<DailyRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayEmployees, setDayEmployees] = useState<EmployeeStatus[]>([]);
  const [displayLimit, setDisplayLimit] = useState(10);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const daily = await attendanceService.getDaily();
      setDailyRows(daily || []);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : 'Failed to load weekly report';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDayReport = async () => {
    setLoading(true);
    try {
      const records = await attendanceService.getAll({ date: selectedDate });
      const statuses: EmployeeStatus[] = records.map(r => ({
        employeeId: r.employeeId || '',
        name: r.employeeName || 'Unknown',
        status: r.status
      }));
      setDayEmployees(statuses);
      setDisplayLimit(10); // Reset limit when loading new data
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : 'Failed to load day report';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const showMore = () => {
    if (displayLimit === 10) setDisplayLimit(50);
    else if (displayLimit === 50) setDisplayLimit(100);
    else if (displayLimit === 100) setDisplayLimit(dayEmployees.length);
  };

  const visibleEmployees = dayEmployees.slice(0, displayLimit);
  const hasMore = displayLimit < dayEmployees.length;

  useEffect(() => {
    loadDailyReport();
    loadDayReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCSV = (rows: Array<Record<string, unknown>>, filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXLS = (rows: Array<Record<string, unknown>>, filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const worksheetData = [
      headers.join("\t"),
      ...rows.map(r => headers.map(h => String(r[h] ?? "")).join("\t"))
    ].join("\n");
    
    const blob = new Blob([worksheetData], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Weekly Reports</h2>
            <p className="text-muted-foreground mt-1">View weekly attendance reports</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={(e) => { e.preventDefault(); loadDailyReport(); }} disabled={loading}>Reload</Button>
            <Button variant="outline" onClick={() => downloadCSV(dailyRows, 'weekly_report')} disabled={dailyRows.length === 0}>
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => downloadXLS(dailyRows, 'weekly_report')} disabled={dailyRows.length === 0}>
              <Download className="w-4 h-4" />
              Download XLS
            </Button>
          </div>
        </div>

        {/* Weekly Report (Last 7 Days) */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Weekly Report (Last 7 Days)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Day</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Present</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Late</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Absent</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-sm text-muted-foreground">No data</td>
                  </tr>
                )}
                {dailyRows.map((r, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-3 px-4">{r.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.present}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.late}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Per-Day Report */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Per-Day Report</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => downloadCSV(dayEmployees, `day_report_${selectedDate}`)} disabled={dayEmployees.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => downloadXLS(dayEmployees, `day_report_${selectedDate}`)} disabled={dayEmployees.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                XLS
              </Button>
            </div>
          </div>
          <div className="mb-4 max-w-xs">
            <Label htmlFor="selectedDate">Select Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="selectedDate" type="date" className="pl-10" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <Button className="mt-2" onClick={loadDayReport} disabled={loading}>Load</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 px-4 text-center text-sm text-muted-foreground">No data</td>
                  </tr>
                )}
                {visibleEmployees.map((emp, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-3 px-4 text-muted-foreground">{emp.employeeId}</td>
                    <td className="py-3 px-4">{emp.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === 'Present' ? 'bg-success/10 text-success' :
                        emp.status === 'Late' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={showMore}>
                  Show More
                </Button>
              </div>
            )}
            {dayEmployees.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Showing {visibleEmployees.length} of {dayEmployees.length} employees
              </p>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;
