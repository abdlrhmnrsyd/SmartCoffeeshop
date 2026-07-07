'use client';

import { useState, useEffect } from 'react';
import { getSalesReport } from '../actions/adminActions';
import { prisma } from '@/lib/db';
import { 
  BarChart3, Calendar, FileText, Download, Printer, 
  Search, RefreshCw, Landmark, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReportsViewProps {
  initialShifts: any[];
}

export default function ReportsView({ initialShifts }: ReportsViewProps) {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Date Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchReport = async () => {
    setLoading(true);
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const res = await getSalesReport(start, end);
    if (res.success && res.report) {
      setReport(res.report);
    } else {
      toast.error('Gagal memuat laporan transaksi.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  // Calculate Aggregations
  const totalRevenue = report.reduce((sum, o) => sum + o.total, 0);
  const totalDiscount = report.reduce((sum, o) => sum + o.discount, 0);
  const totalTax = report.reduce((sum, o) => sum + o.tax, 0);
  const totalSubtotal = report.reduce((sum, o) => sum + o.subtotal, 0);

  // Export to Excel Mock (Downloads actual formatted CSV!)
  const exportToExcel = () => {
    if (report.length === 0) {
      toast.error('Tidak ada data laporan untuk diekspor.');
      return;
    }

    const headers = ['No Struk', 'Tanggal', 'Pelanggan', 'Meja', 'Subtotal', 'Diskon', 'Pajak', 'Total Bayar', 'Metode Bayar'];
    const rows = report.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('id-ID'),
      o.customerName || 'Customer',
      o.tableNumber || 'Take-away',
      o.subtotal,
      o.discount,
      o.tax,
      o.total,
      o.paymentMethod
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_penjualan_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Laporan Excel (.csv) berhasil diunduh!');
  };

  // Export to PDF Mock (Calls print layout window!)
  const exportToPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6.5 w-6.5 text-primary" /> Financial Reports
          </h1>
          <p className="text-sm text-muted-foreground">Analisis penjualan kafe, audit kasir, dan ekspor laporan keuangan.</p>
        </div>

        <div className="flex gap-2 no-print">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToExcel}
            className="h-9 px-3 text-xs font-semibold bg-card border-border flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Ekspor Excel
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={exportToPdf}
            className="h-9 px-3 text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" /> Cetak PDF
          </Button>
        </div>
      </div>

      {/* Date Filters (No-print) */}
      <Card className="border-border shadow-3xs bg-card no-print">
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4 text-xs font-semibold">
          <div className="space-y-1 w-full">
            <Label className="text-3xs uppercase tracking-wider text-muted-foreground">Mulai Tanggal</Label>
            <Input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 bg-background border-border text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1 w-full">
            <Label className="text-3xs uppercase tracking-wider text-muted-foreground">Sampai Tanggal</Label>
            <Input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 bg-background border-border text-xs rounded-xl"
            />
          </div>
          <Button variant="outline" onClick={fetchReport} className="h-10 border-border bg-background flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Filter
          </Button>
        </CardContent>
      </Card>

      {/* Aggregates Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card p-4 flex flex-col justify-between h-24 shadow-3xs">
          <span className="text-3xs font-extrabold uppercase tracking-wider text-muted-foreground">Kotor (Subtotal)</span>
          <h3 className="font-extrabold text-sm sm:text-base">Rp {totalSubtotal.toLocaleString('id-ID')}</h3>
        </Card>
        <Card className="border-border bg-card p-4 flex flex-col justify-between h-24 shadow-3xs">
          <span className="text-3xs font-extrabold uppercase tracking-wider text-muted-foreground">Diskon Voucher</span>
          <h3 className="font-extrabold text-sm sm:text-base text-emerald-600">-Rp {totalDiscount.toLocaleString('id-ID')}</h3>
        </Card>
        <Card className="border-border bg-card p-4 flex flex-col justify-between h-24 shadow-3xs">
          <span className="text-3xs font-extrabold uppercase tracking-wider text-muted-foreground">Pajak PPN (10%)</span>
          <h3 className="font-extrabold text-sm sm:text-base">Rp {totalTax.toLocaleString('id-ID')}</h3>
        </Card>
        <Card className="border-border bg-card p-4 flex flex-col justify-between h-24 shadow-3xs bg-primary text-primary-foreground">
          <span className="text-3xs font-extrabold uppercase tracking-wider text-primary-foreground/75">Pendapatan Bersih</span>
          <h3 className="font-black text-sm sm:text-lg">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
        </Card>
      </div>

      {/* Sales Report Table */}
      <Card className="border-border shadow-xs bg-card overflow-hidden">
        <CardHeader className="p-4 border-b border-border/50">
          <CardTitle className="text-sm font-bold">Rincian Penjualan Terfilter</CardTitle>
          <CardDescription className="text-3xs">Menampilkan {report.length} transaksi selesai.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-bold font-sans">No. Struk</TableHead>
                <TableHead className="text-xs font-bold font-sans">Tanggal</TableHead>
                <TableHead className="text-xs font-bold font-sans">Pelanggan</TableHead>
                <TableHead className="text-xs font-bold font-sans text-center">Meja</TableHead>
                <TableHead className="text-xs font-bold font-sans text-right">Subtotal</TableHead>
                <TableHead className="text-xs font-bold font-sans text-right">Diskon</TableHead>
                <TableHead className="text-xs font-bold font-sans text-right">Total Net</TableHead>
                <TableHead className="text-xs font-bold font-sans text-center">Metode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Mengambil data laporan...
                  </TableCell>
                </TableRow>
              ) : report.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-2xs">
                    Tidak ada transaksi dalam periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                report.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-3xs font-bold">{o.orderNumber}</TableCell>
                    <TableCell className="text-3xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{o.customerName || 'Cust'}</TableCell>
                    <TableCell className="text-xs font-bold text-center">{o.tableNumber || '-'}</TableCell>
                    <TableCell className="text-xs text-right">Rp {o.subtotal.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-xs text-right text-emerald-600">-Rp {o.discount.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-xs font-black text-right">Rp {o.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-xs text-center font-bold text-muted-foreground">{o.paymentMethod}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cashier Shifts Audit (No-print) */}
      <Card className="border-border shadow-xs bg-card overflow-hidden no-print">
        <CardHeader className="p-4 border-b border-border/50">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Laporan Audit Shift Laci Kasir
          </CardTitle>
          <CardDescription className="text-3xs">Daftar rekonsiliasi laci kasir saat pembukaan dan penutupan loket POS.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="text-xs font-bold font-sans">Kasir</TableHead>
                <TableHead className="text-xs font-bold font-sans">Waktu Buka</TableHead>
                <TableHead className="text-xs font-bold font-sans">Waktu Tutup</TableHead>
                <TableHead className="text-xs font-bold font-sans text-right">Modal Awal</TableHead>
                <TableHead className="text-xs font-bold font-sans text-right">Fisik Akhir</TableHead>
                <TableHead className="text-xs font-bold font-sans text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-2xs">
                    Belum ada riwayat shift yang ditutup.
                  </TableCell>
                </TableRow>
              ) : (
                initialShifts.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/10">
                    <TableCell className="text-xs font-semibold">{s.cashier.name}</TableCell>
                    <TableCell className="text-3xs text-muted-foreground">
                      {new Date(s.startTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="text-3xs text-muted-foreground">
                      {s.endTime ? new Date(s.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Masih Buka'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold text-muted-foreground">
                      Rp {Number(s.startCash).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-xs text-right font-extrabold text-primary">
                      {s.endCash ? `Rp ${Number(s.endCash).toLocaleString('id-ID')}` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.status === 'OPEN' ? 'secondary' : 'default'} className="text-[9px] font-semibold">
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
