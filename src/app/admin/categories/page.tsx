'use client';

import { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory } from '@/features/admin/actions/adminActions';
import { Layers, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCatName, setNewCatName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await getCategories();
    if (res.success && res.categories) {
      setCategories(res.categories);
    } else {
      toast.error('Gagal memuat kategori.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    const res = await createCategory(newCatName);
    if (res.success) {
      toast.success(`Kategori "${newCatName}" berhasil dibuat!`);
      setNewCatName('');
      fetchCategories();
    } else {
      toast.error(res.error || 'Gagal membuat kategori.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;

    const res = await deleteCategory(id);
    if (res.success) {
      toast.success(`Kategori "${name}" telah dihapus.`);
      fetchCategories();
    } else {
      toast.error(res.error || 'Gagal menghapus kategori. Pastikan tidak ada menu yang memakai kategori ini.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Layers className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat kategori menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Layers className="h-6.5 w-6.5 text-primary" /> Category Management
        </h1>
        <p className="text-sm text-muted-foreground">Tambah dan hapus kategori klasifikasi menu kopi shop.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Create Category Form (Left 4 Cols) */}
        <div className="md:col-span-4">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Tambah Kategori Baru</CardTitle>
              <CardDescription className="text-3xs">Masukkan nama kategori baru untuk menu Anda.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="catName" className="text-xs font-semibold">Nama Kategori</Label>
                  <Input 
                    id="catName"
                    type="text"
                    placeholder="Contoh: Cold Brew"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/50 justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-9 rounded-xl px-4 text-xs"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Categories Table (Right 8 Cols) */}
        <div className="md:col-span-8">
          <Card className="border-border shadow-xs bg-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-bold font-sans">Nama Kategori</TableHead>
                    <TableHead className="text-xs font-bold font-sans">Slug URI</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-xs font-medium">
                        Belum ada kategori yang dibuat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id} className="hover:bg-muted/10">
                        <TableCell className="font-bold text-xs">{cat.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{cat.slug}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus Kategori"
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
