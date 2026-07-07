'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUsers, createUser, deleteUser } from '@/features/admin/actions/adminActions';
import { Users, Plus, Trash2, Key, UserCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsers();
    if (res.success && res.users && res.roles) {
      setUsers(res.users);
      setRoles(res.roles);
      if (res.roles.length > 0) setRoleId(res.roles[0].id);
    } else {
      toast.error('Gagal memuat pengguna.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim() || !roleId) {
      toast.error('Harap lengkapi semua field wajib.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal terdiri dari 6 karakter.');
      return;
    }

    setSubmitting(true);
    const res = await createUser({
      name,
      username: username.toLowerCase().trim(),
      email: email.trim() || undefined,
      password,
      roleId,
    });

    if (res.success) {
      toast.success(`Akun user "${name}" berhasil dibuat!`);
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } else {
      toast.error(res.error || 'Gagal membuat user. Pastikan username belum dipakai.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUserId) {
      toast.error('Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (name === 'admin') {
      toast.error('Akun master administrator tidak boleh dihapus.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus akun user "${name}"?`)) return;

    const res = await deleteUser(id);
    if (res.success) {
      toast.success(`Akun "${name}" berhasil dihapus.`);
      fetchUsers();
    } else {
      toast.error(res.error || 'Gagal menghapus user.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Users className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat pengguna sistem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6.5 w-6.5 text-primary" /> User Management
        </h1>
        <p className="text-sm text-muted-foreground">Registrasi dan atur hak akses akun pegawai kasir, barista, dan admin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Create User Form (Left 4 Cols) */}
        <div className="lg:col-span-4">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Daftarkan Pegawai Baru</CardTitle>
              <CardDescription className="text-3xs">Buat akun login kredensial staf coffee shop.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <Label htmlFor="usrName" className="text-xs font-semibold">Nama Lengkap</Label>
                  <Input 
                    id="usrName"
                    placeholder="Contoh: Sarah Adelia"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="usrUsername" className="text-xs font-semibold">Username Login</Label>
                  <Input 
                    id="usrUsername"
                    placeholder="Contoh: sarah123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="usrEmail" className="text-xs font-semibold">Email Staf (Opsional)</Label>
                  <Input 
                    id="usrEmail"
                    type="email"
                    placeholder="sarah@coffeeshop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="usrPass" className="text-xs font-semibold">Password (Min 6 Karakter)</Label>
                  <Input 
                    id="usrPass"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hak Akses (Role)</Label>
                  <Select 
                    value={roleId} 
                    onValueChange={(val) => setRoleId(val || '')}
                    disabled={submitting}
                  >
                    <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
              <CardFooter className="pt-2 border-t border-border/50 justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-9 rounded-xl px-4 text-xs"
                >
                  {submitting ? 'Mendaftarkan...' : 'Daftarkan Staf'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Users list table (Right 8 Cols) */}
        <div className="lg:col-span-8">
          <Card className="border-border shadow-xs bg-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-bold font-sans">Nama Staf</TableHead>
                    <TableHead className="text-xs font-bold font-sans">Username</TableHead>
                    <TableHead className="text-xs font-bold font-sans">Email</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Hak Akses</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-medium">
                        Belum ada user yang terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((usr) => (
                      <TableRow key={usr.id} className="hover:bg-muted/10">
                        <TableCell className="font-semibold text-xs">{usr.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{usr.username}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{usr.email || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={usr.role.name === 'ADMIN' ? 'default' : 'secondary'} className="text-[9px] px-2 py-0.5 font-bold uppercase">
                            {usr.role.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(usr.id, usr.username)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={usr.id === currentUserId || usr.username === 'admin'}
                            title="Hapus Akun"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
