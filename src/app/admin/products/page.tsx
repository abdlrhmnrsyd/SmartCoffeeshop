'use client';

import { useState, useEffect } from 'react';
import { getMenuData } from '@/features/customer/actions/menuActions';
import { createCategory, deleteCategory } from '@/features/admin/actions/adminActions';
import { Coffee, Plus, Trash2, ShieldAlert, Check, X, Box } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Reusable action to create a product
import { prisma } from '@/lib/db';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [stock, setStock] = useState<string>('999');

  const fetchProducts = async () => {
    setLoading(true);
    const res = await getMenuData();
    if (res.success && res.products && res.categories) {
      setProducts(res.products);
      setCategories(res.categories);
      if (res.categories.length > 0) setCategoryId(res.categories[0].id);
    } else {
      toast.error('Gagal memuat produk menu.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      toast.error('Harap lengkapi semua field wajib.');
      return;
    }

    const priceVal = parseFloat(price);
    const stockVal = parseInt(stock, 10);

    if (isNaN(priceVal) || priceVal <= 0 || isNaN(stockVal) || stockVal < 0) {
      toast.error('Harga dan stok harus berupa angka positif.');
      return;
    }

    setSubmitting(true);
    try {
      // Direct post to api since creating products can have recipe linkages
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: priceVal,
          categoryId,
          photo: photo || undefined,
          stock: stockVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Menu "${name}" berhasil ditambahkan!`);
        setName('');
        setDescription('');
        setPrice('');
        setPhoto('');
        fetchProducts();
      } else {
        toast.error(data.error || 'Gagal menambahkan produk.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Menu "${name}" berhasil dihapus.`);
        fetchProducts();
      } else {
        toast.error(data.error || 'Gagal menghapus menu.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Coffee className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat produk menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Coffee className="h-6.5 w-6.5 text-primary" /> Product Menu Management
        </h1>
        <p className="text-sm text-muted-foreground">Kelola daftar menu makanan, minuman kopi, harga, dan ketersediaan stok.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Create Product Form (Left 4 Cols) */}
        <div className="lg:col-span-4">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Tambah Produk Menu Baru</CardTitle>
              <CardDescription className="text-3xs">Isi formulir berikut untuk menerbitkan menu baru.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <Label htmlFor="prodName" className="text-xs font-semibold">Nama Menu</Label>
                  <Input 
                    id="prodName"
                    placeholder="Contoh: Affogato"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prodDesc" className="text-xs font-semibold">Deskripsi Menu</Label>
                  <Input 
                    id="prodDesc"
                    placeholder="Contoh: Espresso shot disajikan dengan es krim vanila..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prodPrice" className="text-xs font-semibold">Harga Jual (Rp)</Label>
                  <Input 
                    id="prodPrice"
                    type="number"
                    placeholder="25000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kategori Menu</Label>
                  <Select 
                    value={categoryId} 
                    onValueChange={(val) => setCategoryId(val || '')}
                    disabled={submitting}
                  >
                    <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prodStock" className="text-xs font-semibold">Stok Ketersediaan (Porsi)</Label>
                  <Input 
                    id="prodStock"
                    type="number"
                    placeholder="999"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prodPhoto" className="text-xs font-semibold">URL Foto Produk</Label>
                  <Input 
                    id="prodPhoto"
                    placeholder="https://images.unsplash.com/..."
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                  />
                </div>

              </CardContent>
              <CardFooter className="pt-2 border-t border-border/50 justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-9 rounded-xl px-4 text-xs"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Produk'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Products list table (Right 8 Cols) */}
        <div className="lg:col-span-8">
          <Card className="border-border shadow-xs bg-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-bold font-sans">Menu</TableHead>
                    <TableHead className="text-xs font-bold font-sans">Kategori</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-right">Harga Jual</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Stok</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-medium">
                        Belum ada menu yang dibuat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((prod) => (
                      <TableRow key={prod.id} className="hover:bg-muted/10">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {prod.photo && (
                              <img src={prod.photo} alt={prod.name} className="h-10 w-10 object-cover rounded-lg border shadow-3xs" />
                            )}
                            <div>
                              <h4 className="font-bold text-xs">{prod.name}</h4>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">{prod.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground">
                          {categories.find((c) => c.id === prod.categoryId)?.name || 'Kopi'}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-right">
                          Rp {Number(prod.price).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-center">
                          {prod.stock}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus Menu"
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
