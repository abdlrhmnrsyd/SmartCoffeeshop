'use client';

import { useState, useEffect } from 'react';
import { getVouchers, createVoucher, deleteVoucher } from '@/features/admin/actions/adminActions';
import { Ticket, Plus, Trash2, Calendar, Check, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [code, setCode] = useState<string>('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const fetchVouchers = async () => {
    setLoading(true);
    const res = await getVouchers();
    if (res.success && res.vouchers) {
      setVouchers(res.vouchers);
    } else {
      toast.error('Gagal memuat voucher.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue || !expiryDate) {
      toast.error('Harap lengkapi semua field wajib.');
      return;
    }

    const val = parseFloat(discountValue);
    const minVal = parseFloat(minOrderAmount);
    const maxVal = maxDiscount ? parseFloat(maxDiscount) : undefined;

    if (isNaN(val) || val <= 0 || isNaN(minVal) || minVal < 0) {
      toast.error('Nilai diskon dan minimal order harus berupa angka positif.');
      return;
    }

    setSubmitting(true);
    const res = await createVoucher({
      code: code.toUpperCase(),
      discountType,
      discountValue: val,
      maxDiscount: maxVal,
      minOrderAmount: minVal,
      expiryDate: new Date(expiryDate),
    });

    if (res.success) {
      toast.success(`Voucher ${code.toUpperCase()} berhasil dibuat!`);
      setCode('');
      setDiscountValue('');
      setMaxDiscount('');
      setMinOrderAmount('0');
      setExpiryDate('');
      fetchVouchers();
    } else {
      toast.error(res.error || 'Gagal membuat voucher.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus voucher ${code}?`)) return;

    const res = await deleteVoucher(id);
    if (res.success) {
      toast.success(`Voucher ${code} telah dihapus.`);
      fetchVouchers();
    } else {
      toast.error(res.error || 'Gagal menghapus voucher.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Ticket className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat voucher kupon...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Ticket className="h-6.5 w-6.5 text-primary" /> Vouchers & Promotions
        </h1>
        <p className="text-sm text-muted-foreground">Buat kode kupon potongan harga belanja customer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Create Voucher Form (Left 5 Cols) */}
        <div className="lg:col-span-4">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Terbitkan Voucher Baru</CardTitle>
              <CardDescription className="text-3xs">Masukkan rincian kupon diskon belanja.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <Label htmlFor="vCode" className="text-xs font-semibold">Kode Kupon (Unik)</Label>
                  <Input 
                    id="vCode"
                    placeholder="Contoh: BEIGE20"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl font-mono"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tipe Potongan</Label>
                  <Select 
                    value={discountType} 
                    onValueChange={(val: any) => setDiscountType(val)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="h-10 bg-background border-border rounded-xl">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FIXED">Nominal Tetap (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vVal" className="text-xs font-semibold">
                    {discountType === 'PERCENTAGE' ? 'Persen Diskon (%)' : 'Jumlah Diskon (Rp)'}
                  </Label>
                  <Input 
                    id="vVal"
                    type="number"
                    placeholder={discountType === 'PERCENTAGE' ? '10' : '20000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                {discountType === 'PERCENTAGE' && (
                  <div className="space-y-1">
                    <Label htmlFor="vMax" className="text-xs font-semibold">Maksimal Diskon Rp (Opsional)</Label>
                    <Input 
                      id="vMax"
                      type="number"
                      placeholder="10000"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="h-10 bg-background border-border text-xs rounded-xl"
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="vMin" className="text-xs font-semibold">Minimal Pembelian (Rp)</Label>
                  <Input 
                    id="vMin"
                    type="number"
                    placeholder="20000"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vExpiry" className="text-xs font-semibold">Tanggal Kedaluwarsa</Label>
                  <Input 
                    id="vExpiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
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
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Voucher'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Vouchers list table (Right 7 Cols) */}
        <div className="lg:col-span-8">
          <Card className="border-border shadow-xs bg-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-bold font-sans">Kode Kupon</TableHead>
                    <TableHead className="text-xs font-bold font-sans">Potongan Diskon</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-right font-sans">Min Belanja</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Kedaluwarsa</TableHead>
                    <TableHead className="text-xs font-bold font-sans text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-medium">
                        Belum ada kode voucher terbit.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vouchers.map((v) => (
                      <TableRow key={v.id} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs font-black text-foreground">{v.code}</TableCell>
                        <TableCell className="text-xs font-semibold">
                          {v.discountType === 'PERCENTAGE' 
                            ? `${v.discountValue}% (Maks Rp ${(v.maxDiscount || '∞')})` 
                            : `Rp ${Number(v.discountValue).toLocaleString('id-ID')}`
                          }
                        </TableCell>
                        <TableCell className="text-xs font-bold text-right">Rp {Number(v.minOrderAmount).toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-2xs text-center text-muted-foreground">
                          {new Date(v.expiryDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(v.id, v.code)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus Voucher"
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
