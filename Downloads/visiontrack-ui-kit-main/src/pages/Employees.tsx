import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types/models";
import { useNavigate } from "react-router-dom";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  empId: string;
  photo: File | null;
}

const Employees = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [formState, setFormState] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    empId: "",
    photo: null,
  });
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadEmployees = async (initial = false) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await employeeService.getPaginated({ page, pageSize, search: search || undefined });
      setEmployees(res.results);
      setTotalCount(res.count);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      const message = String(e?.message || '').toLowerCase();
      if (e?.statusCode === 401 || /authentication credentials/i.test(message)) {
        alert('Please login first.');
        navigate('/login');
        return;
      }
      setErrorMsg(e?.message || 'Failed to load employees');
      toast({ title: 'Error', description: e?.message || 'Failed to load employees', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEmployees();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target as HTMLInputElement & { files: FileList };
    if (id === 'photo' && files && files[0]) {
      setFormState(fs => ({ ...fs, photo: files[0] }));
    } else {
      setFormState(fs => ({ ...fs, [id]: value }));
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fullName = `${formState.firstName.trim()} ${formState.lastName.trim()}`.trim();
      if (!fullName) throw new Error('Name required');
      const payload = {
        name: fullName,
        email: formState.email,
        empId: formState.empId,
        role: 'employee',
        photo: formState.photo || undefined,
      } as unknown as Record<string, unknown>;
      // add backend-specific fields without breaking TS types
      (payload as Record<string, unknown>)['first_name'] = formState.firstName;
      (payload as Record<string, unknown>)['last_name'] = formState.lastName;

      await employeeService.create(payload as unknown as import('@/types/models').CreateEmployeeDto);
      toast({ title: 'Employee Added', description: 'New employee registered.' });
      setOpen(false);
      setFormState({ firstName: '', lastName: '', email: '', empId: '', photo: null });
      loadEmployees();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ title: 'Error', description: e.message || 'Failed to add employee', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    setTogglingId(emp.id);
    try {
      const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
      await employeeService.update(emp.id, { status: nextStatus });
      setEmployees(list => list.map(e => e.id === emp.id ? { ...e, status: nextStatus } : e));
      toast({ title: 'Status Updated', description: `${emp.name} is now ${nextStatus}` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Employees</h2>
            <p className="text-muted-foreground mt-1">Manage your organization's employees</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formState.firstName} onChange={handleFormChange} placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formState.lastName} onChange={handleFormChange} placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formState.email} onChange={handleFormChange} placeholder="email@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empId">Employee ID</Label>
                  <Input id="empId" value={formState.empId} onChange={handleFormChange} placeholder="EMP001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <label htmlFor="photo" className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{formState.photo ? formState.photo.name : 'Click to upload photo'}</p>
                    <input type="file" id="photo" className="hidden" accept="image/*" onChange={handleFormChange} />
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={creating}>
                    {creating ? 'Adding...' : 'Add Employee'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search employees..." className="pl-10" value={search} onChange={handleSearchChange} />
            </form>
            <Button variant="outline" size="sm" onClick={() => loadEmployees()} disabled={loading} className="gap-2">
              <RefreshCw className={"w-4 h-4" + (loading ? ' animate-spin' : '')} />
              Reload
            </Button>
          </div>

          <div className="overflow-x-auto">
            {errorMsg && (
              <div className="mb-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">First Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-sm text-muted-foreground">No employees found.</td>
                  </tr>
                )}
                {employees.map((employee: Employee & { first_name?: string; last_name?: string }) => {
                  const firstName = employee.first_name ?? (employee.name ? employee.name.split(' ')[0] : '');
                  const lastName = employee.last_name ?? (employee.name ? employee.name.split(' ').slice(1).join(' ') : '');
                  return (
                    <tr key={employee.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-medium">{firstName}</td>
                      <td className="py-4 px-4 text-muted-foreground">{lastName || '—'}</td>
                      <td className="py-4 px-4 text-muted-foreground">{employee.empId}</td>
                      <td className="py-4 px-4 text-muted-foreground">{employee.email}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 items-center">
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(employee)} disabled={togglingId === employee.id}>
                            {togglingId === employee.id ? '...' : employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total: {totalCount}</div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Rows per page</label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); loadEmployees(); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => { setPage(p => Math.max(1, p - 1)); loadEmployees(); }}>
                Prev
              </Button>
              <span className="text-sm">Page {page} / {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil((totalCount || 0) / pageSize) || loading} onClick={() => { setPage(p => p + 1); loadEmployees(); }}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Employees;
