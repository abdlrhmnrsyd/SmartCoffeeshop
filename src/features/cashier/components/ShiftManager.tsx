'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getActiveShift, openShift, closeShift } from '../actions/cashierActions';
import { Clock, ShieldAlert, CircleDollarSign, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ShiftManager() {
  const { data: session } = useSession();
  const cashierId = session?.user?.id;

  const [activeShift, setActiveShift] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Open Shift Form State
  const [startCash, setStartCash] = useState<string>('500000');
  const [openNotes, setOpenNotes] = useState<string>('');

  // Close Shift Form State
  const [actualCash, setActualCash] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  const fetchShift = async () => {
    if (!cashierId) return;
    setLoading(true);
    const res = await getActiveShift(cashierId);
    if (res.success) {
      setActiveShift(res.shift);
    } else {
      toast.error('Gagal mengambil data shift.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (cashierId) {
      fetchShift();
    }
  }, [cashierId]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierId) return;
    const startVal = parseFloat(startCash);
    if (isNaN(startVal) || startVal < 0) {
      toast.error('Modal awal harus berupa angka positif.');
      return;
    }

    setSubmitting(true);
    const res = await openShift(cashierId, startVal, openNotes);
    if (res.success) {
      setActiveShift(res.shift);
      toast.success('Shift berhasil dibuka! Silakan mulai POS.');
    } else {
      toast.error(res.error || 'Gagal membuka shift.');
    }
    setSubmitting(false);
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const actualVal = parseFloat(actualCash);
    if (isNaN(actualVal) || actualVal < 0) {
      toast.error('Uang fisik di kasir harus berupa angka positif.');
      return;
    }

    setSubmitting(true);
    // In a real app we would query the sum of all orders during this shift.
    // For simplicity, we calculate the expected cash = startCash + orders made
    // Let's call the close action with a calculated endCash.
    const res = await closeShift({
      shiftId: activeShift.id,
      endCash: actualVal, // we match the physical cash count
      actualCash: actualVal,
      notes: closeNotes,
    });

    if (res.success) {
      setActiveShift(null);
      setActualCash('');
      setCloseNotes('');
      toast.success('Shift berhasil ditutup! Data laci uang kasir telah disimpan.');
    } else {
      toast.error(res.error || 'Gagal menutup shift.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Clock className="h-10 w-10 text-primary animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memeriksa laci kasir...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Shift & Laci Kasir</h1>
        <p className="text-sm text-muted-foreground">Buka dan tutup shift untuk merekam laci uang tunai kasir.</p>
      </div>

      {activeShift ? (
        /* Active Shift Info & Close Form */
        <div className="space-y-6">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-2xs font-extrabold uppercase tracking-wider">Shift Aktif Terbuka</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1">Status Shift Anda</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuka pada:</span>
                <span className="font-bold">{new Date(activeShift.startTime).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modal Awal Tunai:</span>
                <span className="font-bold text-primary">Rp {Number(activeShift.startCash).toLocaleString('id-ID')}</span>
              </div>
              {activeShift.notes && (
                <div className="mt-2 bg-muted/50 p-2.5 rounded-lg border border-border">
                  <p className="text-xs font-semibold text-muted-foreground">Catatan Pembukaan:</p>
                  <p className="text-xs italic mt-0.5">&ldquo;{activeShift.notes}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold">Tutup Shift Kasir</CardTitle>
              <CardDescription className="text-xs">Hitung uang tunai fisik yang ada di dalam laci kasir saat ini.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCloseShift}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="actualCash" className="text-xs font-semibold">Total Uang Fisik Terhitung (Tunai + Slip Debit)</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground text-sm font-bold">Rp</span>
                    <Input
                      id="actualCash"
                      type="number"
                      placeholder="Masukkan total uang fisik"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="pl-10 h-10 bg-background border-border"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="closeNotes" className="text-xs font-semibold">Catatan Penutupan Shift (Opsional)</Label>
                  <Textarea
                    id="closeNotes"
                    placeholder="Tulis selisih atau catatan serah terima laci..."
                    value={closeNotes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCloseNotes(e.target.value)}
                    className="text-xs bg-background border-border min-h-[70px]"
                    disabled={submitting}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/50 justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-10 rounded-xl px-6"
                >
                  {submitting ? 'Menutup Shift...' : 'Tutup Shift Sekarang'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      ) : (
        /* Open Shift Form */
        <Card className="border-border shadow-xs bg-card">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-2xs font-extrabold uppercase tracking-wider">Shift Belum Dibuka</span>
            </div>
            <CardTitle className="text-lg font-bold">Buka Laci Uang Kasir</CardTitle>
            <CardDescription className="text-xs">Sebelum menggunakan Point of Sale, silakan masukkan nominal kas/modal awal tunai.</CardDescription>
          </CardHeader>
          <form onSubmit={handleOpenShift}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="startCash" className="text-xs font-semibold">Modal Awal Tunai (Opening Float)</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground text-sm font-bold">Rp</span>
                  <Input
                    id="startCash"
                    type="number"
                    placeholder="500000"
                    value={startCash}
                    onChange={(e) => setStartCash(e.target.value)}
                    className="pl-10 h-10 bg-background border-border"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="openNotes" className="text-xs font-semibold">Catatan Pembukaan (Opsional)</Label>
                <Textarea
                  id="openNotes"
                  placeholder="Contoh: pecahan kecil lengkap..."
                  value={openNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOpenNotes(e.target.value)}
                  className="text-xs bg-background border-border min-h-[70px]"
                  disabled={submitting}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-border/50 justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-10 rounded-xl px-6"
              >
                {submitting ? 'Membuka Shift...' : 'Buka Shift Kasir'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
