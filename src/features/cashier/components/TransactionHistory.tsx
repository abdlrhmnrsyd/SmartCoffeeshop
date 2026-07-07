'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCashierOrdersData, refundOrder } from '../actions/cashierActions';
import { 
  History, Calendar, RotateCcw, AlertTriangle, 
  Search, Eye, RefreshCw, X, Receipt
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function TransactionHistory() {
  const { data: session } = useSession();
  const cashierId = session?.user?.id;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Refund and detail states
  const [refundingOrder, setRefundingOrder] = useState<any>(null);
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchHistory = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const res = await getCashierOrdersData();
    if (res.success && res.orders) {
      // Only keep PAID, COMPLETED, or REFUNDED orders for transaction history
      const historyOrders = res.orders.filter(
        (o) => o.paymentStatus === 'PAID' || o.paymentStatus === 'REFUNDED'
      );
      setOrders(historyOrders);
    } else {
      toast.error('Gagal mengambil riwayat transaksi.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory(true);
  }, []);

  const handleRefund = async () => {
    if (!refundingOrder || !cashierId) return;
    setIsSubmitting(true);
    const res = await refundOrder(refundingOrder.id, cashierId);
    if (res.success) {
      toast.success(`Refund berhasil diproses untuk struk ${refundingOrder.orderNumber}!`);
      setRefundingOrder(null);
      fetchHistory(false);
    } else {
      toast.error(res.error || 'Gagal memproses refund.');
    }
    setIsSubmitting(false);
  };

  const filteredOrders = orders.filter((o) => {
    return o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (o.tableNumber && String(o.tableNumber).includes(searchQuery));
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <History className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat riwayat transaksi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Riwayat Transaksi
          </h1>
          <p className="text-sm text-muted-foreground">Lihat riwayat laporan kasir dan lakukan refund pembatalan transaksi.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-muted-foreground flex items-center" />
          <Input 
            type="text"
            placeholder="Cari No. Struk atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card border-border text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Transactions Table Card */}
      <Card className="border-border shadow-xs bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold font-sans">No. Struk</TableHead>
                  <TableHead className="text-xs font-bold font-sans">Tanggal</TableHead>
                  <TableHead className="text-xs font-bold font-sans">Pelanggan</TableHead>
                  <TableHead className="text-xs font-bold font-sans text-center">Meja</TableHead>
                  <TableHead className="text-xs font-bold font-sans text-right">Total Bayar</TableHead>
                  <TableHead className="text-xs font-bold font-sans text-center">Metode</TableHead>
                  <TableHead className="text-xs font-bold font-sans text-center">Status</TableHead>
                  <TableHead className="text-xs font-bold font-sans text-center no-print">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs font-medium">
                      Belum ada riwayat transaksi yang terekam.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-2xs font-bold">{order.orderNumber}</TableCell>
                      <TableCell className="text-2xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{order.customerName || 'Cust'}</TableCell>
                      <TableCell className="text-xs font-bold text-center">{order.tableNumber || '-'}</TableCell>
                      <TableCell className="text-xs font-bold text-right">Rp {Number(order.total).toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-xs text-center font-semibold text-muted-foreground">{order.paymentMethod}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={order.paymentStatus === 'PAID' ? 'secondary' : 'destructive'} className="text-[9px] font-semibold uppercase">
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDetailedOrder(order)}
                            className="h-7 w-7 rounded-lg"
                            title="Detail Struk"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          
                          {order.paymentStatus === 'PAID' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setRefundingOrder(order)}
                              className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                              title="Proses Refund"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Items Modal */}
      <Dialog open={detailedOrder !== null} onOpenChange={(open) => !open && setDetailedOrder(null)}>
        {detailedOrder && (
          <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-sm font-bold">Rincian Riwayat Transaksi</DialogTitle>
              <DialogDescription className="text-3xs">
                No Struk: {detailedOrder.orderNumber} &bull; Meja {detailedOrder.tableNumber || 'Take-away'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-2.5">
                {detailedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start text-xs border-b border-border/20 pb-2">
                    <div>
                      <h5 className="font-bold">{item.name} <span className="text-muted-foreground text-3xs">x{item.quantity}</span></h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Size: {item.size} | Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>
                      {item.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">&ldquo;{item.notes}&rdquo;</p>}
                    </div>
                    <span className="font-extrabold">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs font-semibold bg-muted/40 p-3 rounded-xl">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>Rp {Number(detailedOrder.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {Number(detailedOrder.discount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon:</span>
                    <span>-Rp {Number(detailedOrder.discount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Pajak (10%):</span>
                  <span>Rp {Number(detailedOrder.tax).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-border/50 text-primary">
                  <span>TOTAL BILL:</span>
                  <span>Rp {Number(detailedOrder.total).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button size="sm" onClick={() => setDetailedOrder(null)} className="h-9 rounded-lg w-full">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <Dialog open={refundingOrder !== null} onOpenChange={(open) => !open && setRefundingOrder(null)}>
        {refundingOrder && (
          <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl">
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-sm font-bold">Konfirmasi Pembatalan & Refund</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Apakah Anda yakin ingin membatalkan transaksi untuk No Struk <span className="font-mono font-bold text-foreground">{refundingOrder.orderNumber}</span>?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-xl space-y-1.5 leading-normal">
              <p className="font-bold">Konsekuensi Refund:</p>
              <ul className="list-disc list-inside space-y-0.5 text-3xs text-destructive-foreground/90 font-medium">
                <li>Status pembayaran diubah menjadi REFUNDED.</li>
                <li>Status pemesanan diubah menjadi CANCELLED.</li>
                <li>Laci meja {refundingOrder.tableNumber || 'Take-away'} dibebaskan.</li>
                <li>Bahan baku yang sudah dikurangi TIDAK otomatis dikembalikan ke inventaris (silakan catat manual jika perlu).</li>
              </ul>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setRefundingOrder(null)} disabled={isSubmitting} className="h-9 rounded-lg text-xs font-bold border-border">
                Batal
              </Button>
              <Button onClick={handleRefund} disabled={isSubmitting} className="h-9 bg-destructive hover:bg-destructive/95 text-destructive-foreground font-bold px-4 rounded-lg flex-1 text-xs">
                {isSubmitting ? 'Memproses Refund...' : 'Ya, Batalkan & Refund'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
