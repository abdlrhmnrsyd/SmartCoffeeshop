'use client';

import { useState, useEffect } from 'react';
import { getTables, createTable, deleteTable } from '@/features/admin/actions/adminActions';
import { Table, Plus, Trash2, QrCode, Printer, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminTablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [tableNumber, setTableNumber] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('4');

  // QR Modal State
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const fetchTables = async () => {
    setLoading(true);
    const res = await getTables();
    if (res.success && res.tables) {
      setTables(res.tables);
    } else {
      toast.error('Gagal memuat meja.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(tableNumber, 10);
    const cap = parseInt(capacity, 10);

    if (isNaN(num) || num <= 0 || isNaN(cap) || cap <= 0) {
      toast.error('Nomor meja dan kapasitas harus berupa angka positif.');
      return;
    }

    setSubmitting(true);
    const res = await createTable(num, cap);
    if (res.success) {
      toast.success(`Meja nomor ${num} berhasil ditambahkan!`);
      setTableNumber('');
      fetchTables();
    } else {
      toast.error(res.error || 'Gagal menambahkan meja. Pastikan nomor meja unik.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, num: number) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Meja ${num}?`)) return;

    const res = await deleteTable(id);
    if (res.success) {
      toast.success(`Meja ${num} berhasil dihapus.`);
      fetchTables();
    } else {
      toast.error(res.error || 'Gagal menghapus meja.');
    }
  };

  const getQrUrl = (tableNum: number) => {
    // Generates a local or production scan url
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const scanUrl = `${origin}/menu/${tableNum}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(scanUrl)}`;
  };

  const printQrCode = (tableNum: number) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const scanUrl = `${origin}/menu/${tableNum}`;
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(scanUrl)}`;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak QR Code - Meja ${tableNum}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { border: 4px solid #4a3728; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 320px; }
            h1 { color: #4a3728; margin-top: 0; margin-bottom: 5px; font-size: 28px; font-weight: 900; }
            p { font-size: 14px; color: #7c685c; margin-bottom: 25px; }
            img { width: 220px; height: 220px; }
            .footer { font-size: 11px; margin-top: 25px; color: #9c8b82; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <h1>MEJA ${tableNum}</h1>
            <p>Scan untuk memesan kopi & makanan</p>
            <img src="${qrImage}" alt="QR Meja ${tableNum}" />
            <div class="footer">Smart Coffee Shop</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Table className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat data meja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <QrCode className="h-6.5 w-6.5 text-primary" /> Tables & QR Code Generator
        </h1>
        <p className="text-sm text-muted-foreground">Kelola meja restoran dan cetak barcode QR order untuk setiap meja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Create Table Card (Left 4 Cols) */}
        <div className="md:col-span-4">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Tambah Meja Baru</CardTitle>
              <CardDescription className="text-3xs">Masukkan rincian nomor dan kapasitas kursi meja.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="tblNo" className="text-xs font-semibold">Nomor Meja (Unik)</Label>
                  <Input 
                    id="tblNo"
                    type="number"
                    placeholder="Contoh: 11"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="h-10 bg-background border-border text-xs rounded-xl"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tblCap" className="text-xs font-semibold">Kapasitas Kursi</Label>
                  <Input 
                    id="tblCap"
                    type="number"
                    placeholder="4"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Meja'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Tables list area (Right 8 Cols) */}
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-sm font-medium bg-card border border-dashed border-border rounded-2xl">
                Belum ada meja restoran terdaftar.
              </div>
            ) : (
              tables.map((tbl) => (
                <Card key={tbl.id} className="border-border shadow-3xs bg-card flex flex-col justify-between overflow-hidden">
                  <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">Meja {tbl.number}</h4>
                      <p className="text-3xs text-muted-foreground">Kapasitas: {tbl.capacity} kursi</p>
                    </div>
                    <Badge variant={tbl.status === 'AVAILABLE' ? 'secondary' : 'default'} className="text-[9px] font-semibold uppercase">
                      {tbl.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 pb-3 flex justify-center bg-muted/20 border-y border-border/30 my-3">
                    {/* Simulated small QR preview */}
                    <div className="bg-white p-2 rounded-lg border border-border shadow-3xs cursor-pointer group relative" onClick={() => setSelectedTable(tbl)}>
                      <img src={getQrUrl(tbl.number)} alt={`QR Meja ${tbl.number}`} className="h-28 w-28 object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-lg">
                        <Eye className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 justify-between items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tbl.id, tbl.number)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Hapus Meja"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printQrCode(tbl.number)}
                        className="h-8 px-2.5 text-3xs font-bold border-border bg-background flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" /> Cetak QR
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>

      {/* QR Code Magnifier Dialog */}
      <Dialog open={selectedTable !== null} onOpenChange={(open) => !open && setSelectedTable(null)}>
        {selectedTable && (
          <DialogContent className="max-w-xs bg-card text-card-foreground border-border rounded-2xl shadow-xl text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-center">QR CODE MEJA {selectedTable.number}</DialogTitle>
              <DialogDescription className="text-3xs text-center">
                Scan barcode ini menggunakan kamera HP untuk masuk menu.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center p-4 bg-white border border-border rounded-xl shadow-xs">
              <img src={getQrUrl(selectedTable.number)} alt={`QR Meja ${selectedTable.number}`} className="h-48 w-48 object-contain" />
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTable(null)} className="h-9 w-full rounded-lg text-xs">
                Tutup
              </Button>
              <Button size="sm" onClick={() => printQrCode(selectedTable.number)} className="bg-primary text-primary-foreground font-bold h-9 w-full rounded-lg text-xs flex items-center justify-center gap-1">
                <Printer className="h-3.5 w-3.5" /> Cetak QR
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
