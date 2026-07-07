'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePosStore, PosItem, PosTopping } from '../stores/posStore';
import { checkoutPosOrder } from '../actions/cashierActions';
import { 
  Coffee, Search, Plus, Minus, Trash2, Ticket, Check,
  AlertCircle, ShieldCheck, Printer, RefreshCw, ShoppingCart,
  DollarSign, Landmark, QrCode
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';

interface PosConsoleProps {
  initialData: {
    categories: any[];
    products: any[];
    toppings: any[];
    vouchers: any[];
  };
  activeShift: any;
}

export default function PosConsole({ initialData, activeShift }: PosConsoleProps) {
  const { data: session } = useSession();
  const cashierId = session?.user?.id;

  const { categories, products, toppings, vouchers } = initialData;
  const posCart = usePosStore();

  // POS State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Customization
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedSugar, setSelectedSugar] = useState<any>(null);
  const [selectedIce, setSelectedIce] = useState<any>(null);
  const [selectedToppings, setSelectedToppings] = useState<PosTopping[]>([]);
  const [itemNotes, setItemNotes] = useState<string>('');

  // Payment Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'DEBIT' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Receipt Modal
  const [printedReceipt, setPrintedReceipt] = useState<any>(null);

  // Calculate pricing
  const subtotal = posCart.getCartTotal();
  const discountValue = posCart.selectedVoucher
    ? posCart.selectedVoucher.discountType === 'PERCENTAGE'
      ? Math.min((subtotal * Number(posCart.selectedVoucher.discountValue)) / 100, Number(posCart.selectedVoucher.maxDiscount || Infinity))
      : Number(posCart.selectedVoucher.discountValue)
    : 0;
  const tax = (subtotal - discountValue) * 0.1;
  const totalBill = subtotal - discountValue + tax;
  const changeValue = payMethod === 'CASH' && cashAmount ? Number(cashAmount) - totalBill : 0;

  // Verify shift is open
  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl shadow-2xs max-w-lg mx-auto">
        <div className="bg-amber-100 dark:bg-amber-950 p-4 rounded-full text-amber-600 mb-4">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Shift Belum Dibuka</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">
          Anda tidak bisa melayani transaksi Point of Sale sebelum shift kasir dibuka.
        </p>
        <Link href="/cashier/shift">
          <Button variant="default" className="font-bold">
            Pergi ke Shift Register
          </Button>
        </Link>
      </div>
    );
  }

  // Open item customization dialog
  const openCustomization = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setItemNotes('');
    setSelectedToppings([]);

    const sizes = product.groupedOptions?.['Size'] || [];
    const sugars = product.groupedOptions?.['Sugar'] || [];
    const ices = product.groupedOptions?.['Ice'] || [];

    setSelectedSize(sizes.find((s: any) => s.value === 'Regular') || sizes[0] || null);
    setSelectedSugar(sugars.find((s: any) => s.value === 'Normal') || sugars[0] || null);
    setSelectedIce(ices.find((i: any) => i.value === 'Normal Ice') || ices[0] || null);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    posCart.addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: Number(selectedProduct.price),
      photo: selectedProduct.photo,
      quantity,
      size: selectedSize ? selectedSize.value : 'Regular',
      sizePriceAdjustment: selectedSize ? Number(selectedSize.priceAdjustment) : 0,
      sugarLevel: selectedSugar ? selectedSugar.value : 'Normal',
      iceLevel: selectedIce ? selectedIce.value : 'Normal Ice',
      toppings: selectedToppings,
      notes: itemNotes,
    });

    setSelectedProduct(null);
    toast.success(`${selectedProduct.name} ditambahkan ke laci kasir.`);
  };

  const handleApplyVoucher = () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = vouchers.find((v) => v.code === code && v.isActive);
    if (!found) {
      toast.error('Voucher tidak ditemukan atau tidak aktif.');
      return;
    }

    if (new Date() > new Date(found.expiryDate)) {
      toast.error('Voucher sudah kedaluwarsa.');
      return;
    }

    if (subtotal < Number(found.minOrderAmount)) {
      toast.error(`Minimal order Rp ${Number(found.minOrderAmount).toLocaleString('id-ID')} untuk voucher ini.`);
      return;
    }

    posCart.setVoucher(found);
    toast.success(`Voucher ${code} berhasil dipasang.`);
  };

  const handleCheckout = async () => {
    if (!cashierId) return;
    if (posCart.items.length === 0) {
      toast.error('Belum ada item dalam struk POS.');
      return;
    }

    if (payMethod === 'CASH') {
      const parsedPaid = parseFloat(cashAmount);
      if (isNaN(parsedPaid) || parsedPaid < totalBill) {
        toast.error('Uang tunai pembayaran tidak mencukupi.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await checkoutPosOrder({
        cashierId,
        customerName: posCart.customerName || 'Dine-In Customer',
        tableNumber: posCart.tableNumber,
        items: posCart.items,
        paymentMethod: payMethod,
        voucherCode: posCart.selectedVoucher?.code,
        discount: discountValue,
        notes: 'POS Manual Transaction',
      });

      if (res.success && res.orderNumber) {
        toast.success(`Transaksi berhasil! Kode Struk: ${res.orderNumber}`);
        
        // Save printed receipt layout state
        setPrintedReceipt({
          orderNumber: res.orderNumber,
          customerName: posCart.customerName || 'Dine-In Customer',
          tableNumber: posCart.tableNumber,
          items: [...posCart.items],
          subtotal,
          discount: discountValue,
          tax,
          total: totalBill,
          payMethod,
          cashPaid: payMethod === 'CASH' ? Number(cashAmount) : totalBill,
          change: payMethod === 'CASH' ? Number(cashAmount) - totalBill : 0,
          date: new Date(),
        });
        
        posCart.clearCart();
        setCashAmount('');
        setIsPaymentOpen(false);
      } else {
        toast.error(res.error || 'Gagal memproses transaksi.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'all' || prod.categoryId === activeCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Menu / Product Grid Area (Left 7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
              <Coffee className="h-5.5 w-5.5 text-primary" /> Point of Sale
            </h1>
            <p className="text-xs text-muted-foreground">Kasir Aktif: {session?.user?.name}</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-muted-foreground flex items-center" />
            <Input 
              type="text"
              placeholder="Cari menu POS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-card border-border rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Categories Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'secondary'}
            onClick={() => setActiveCategory('all')}
            size="sm"
            className="rounded-full text-xs font-semibold"
          >
            Semua
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'secondary'}
              onClick={() => setActiveCategory(cat.id)}
              size="sm"
              className="rounded-full text-xs font-semibold"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* POS Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div 
              key={prod.id}
              onClick={() => openCustomization(prod)}
              className="bg-card hover:bg-secondary/40 border border-border hover:border-primary/20 p-3 rounded-xl cursor-pointer shadow-3xs flex flex-col justify-between h-36 transition-all"
            >
              <div>
                <h4 className="font-bold text-xs leading-tight text-foreground truncate">{prod.name}</h4>
                <p className="text-3xs text-muted-foreground line-clamp-2 mt-1 leading-normal font-normal">{prod.description}</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                <span className="font-black text-xs text-foreground">Rp {Number(prod.price).toLocaleString('id-ID')}</span>
                <Badge variant={prod.stock > 0 ? 'secondary' : 'destructive'} className="text-[9px] px-1 py-0 scale-95 font-semibold">
                  {prod.stock > 0 ? `Stok ${prod.stock}` : 'Kosong'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POS Cart Sidebar / Receipt Ticket (Right 5 Cols) */}
      <div className="lg:col-span-5">
        <Card className="border-border shadow-xs bg-card h-[calc(100vh-140px)] flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-1">
                <ShoppingCart className="h-4 w-4 text-primary" /> Struk Penjualan
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => posCart.clearCart()} className="h-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Cart items viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {posCart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-1.5 p-6">
                <ShoppingCart className="h-10 w-10 text-muted/40" />
                <p className="text-xs font-semibold">Belum Ada Item</p>
                <p className="text-3xs text-muted-foreground">Pilih produk kopi di panel sebelah kiri.</p>
              </div>
            ) : (
              posCart.items.map((item) => {
                const itemToppingsPrice = item.toppings.reduce((sum, t) => sum + t.price, 0);
                const itemUnitTotal = Number(item.price) + Number(item.sizePriceAdjustment) + itemToppingsPrice;
                return (
                  <div key={item.cartId} className="flex justify-between items-start gap-2 bg-secondary/30 p-2.5 rounded-xl border border-border">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs truncate leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.size} &bull; {item.sugarLevel} &bull; {item.iceLevel}</p>
                      {item.toppings.length > 0 && (
                        <p className="text-[9px] text-[#865d3f] font-semibold">+{item.toppings.map((t) => t.name).join(', ')}</p>
                      )}
                      <span className="font-black text-xs inline-block mt-1">Rp {(itemUnitTotal * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center border border-border bg-card rounded-lg px-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5.5 w-5.5 rounded-md"
                          onClick={() => posCart.updateQuantity(item.cartId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-2xs font-bold">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5.5 w-5.5 rounded-md"
                          onClick={() => posCart.updateQuantity(item.cartId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing summary footer */}
          <div className="p-4 border-t border-border bg-muted/20 space-y-4">
            
            {/* Customer name and table inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-3xs font-bold uppercase tracking-wider text-muted-foreground">Nama Pelanggan</Label>
                <Input 
                  placeholder="Dine-in Cust" 
                  value={posCart.customerName}
                  onChange={(e) => posCart.setCustomerName(e.target.value)}
                  className="h-8 bg-background border-border text-xs rounded-lg mt-1"
                />
              </div>
              <div>
                <Label className="text-3xs font-bold uppercase tracking-wider text-muted-foreground">Nomor Meja</Label>
                <Input 
                  type="number"
                  placeholder="Take-away" 
                  value={posCart.tableNumber || ''}
                  onChange={(e) => posCart.setTableNumber(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="h-8 bg-background border-border text-xs rounded-lg mt-1"
                />
              </div>
            </div>

            {/* Voucher Codes */}
            <div className="flex gap-2">
              <Input 
                placeholder="Kode Voucher" 
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                className="h-8 bg-background border-border text-xs font-mono rounded-lg"
              />
              <Button size="sm" onClick={handleApplyVoucher} className="h-8 font-semibold text-2xs rounded-lg">
                Pakai
              </Button>
            </div>
            {posCart.selectedVoucher && (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 leading-none mt-[-10px]">
                <Check className="h-3 w-3" /> Voucher {posCart.selectedVoucher.code} dipasang.
              </p>
            )}

            {/* Subtotal calculations */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Voucher</span>
                  <span>-Rp {discountValue.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Pajak (10%)</span>
                <span>Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-foreground pt-1 border-t border-border">
                <span>Total Tagihan</span>
                <span>Rp {totalBill.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Checkout / Pay buttons */}
            <Button
              onClick={() => setIsPaymentOpen(true)}
              className="w-full bg-primary hover:bg-[#322318] text-primary-foreground font-black h-10 rounded-xl"
              disabled={posCart.items.length === 0}
            >
              Bayar Sekarang &rarr;
            </Button>
          </div>
        </Card>
      </div>

      {/* Item customization dialog */}
      <Dialog open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader className="pb-3 border-b border-border">
                <DialogTitle className="text-sm font-bold">Sesuaikan: {selectedProduct.name}</DialogTitle>
                <DialogDescription className="text-3xs text-muted-foreground">{selectedProduct.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                {/* Size */}
                {selectedProduct.groupedOptions?.['Size'] && (
                  <div className="space-y-1">
                    <Label className="text-3xs font-extrabold uppercase text-muted-foreground">Ukuran</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.groupedOptions['Size'].map((opt: any) => (
                        <div 
                          key={opt.id}
                          onClick={() => setSelectedSize(opt)}
                          className={`flex items-center justify-between p-2 border rounded-xl cursor-pointer text-xs transition-all ${
                            selectedSize?.id === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
                          }`}
                        >
                          <span className="font-semibold">{opt.value}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {Number(opt.priceAdjustment) > 0 ? `+Rp ${Number(opt.priceAdjustment).toLocaleString('id-ID')}` : 'Free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugar */}
                {selectedProduct.groupedOptions?.['Sugar'] && (
                  <div className="space-y-1">
                    <Label className="text-3xs font-extrabold uppercase text-muted-foreground">Level Gula</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.groupedOptions['Sugar'].map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedSugar(opt)}
                          className={`py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                            selectedSugar?.id === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ice */}
                {selectedProduct.groupedOptions?.['Ice'] && (
                  <div className="space-y-1">
                    <Label className="text-3xs font-extrabold uppercase text-muted-foreground">Level Es</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.groupedOptions['Ice'].map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedIce(opt)}
                          className={`py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                            selectedIce?.id === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings */}
                {toppings.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-3xs font-extrabold uppercase text-muted-foreground">Toppings</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {toppings.map((top) => {
                        const isChecked = selectedToppings.some((t) => t.name === top.name);
                        return (
                          <div 
                            key={top.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedToppings(selectedToppings.filter((t) => t.name !== top.name));
                              } else {
                                setSelectedToppings([...selectedToppings, { name: top.name, price: Number(top.price) }]);
                              }
                            }}
                            className={`flex items-center justify-between p-2 border rounded-xl cursor-pointer text-xs transition-all ${
                              isChecked ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Checkbox checked={isChecked} onCheckedChange={() => {}} className="pointer-events-none" />
                              <span className="font-semibold text-3xs">{top.name}</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground">+Rp {Number(top.price).toLocaleString('id-ID')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1">
                  <Label htmlFor="itemNotes" className="text-3xs font-extrabold uppercase text-muted-foreground">Catatan Tambahan</Label>
                  <Input 
                    id="itemNotes"
                    placeholder="Contoh: buat agak manis..." 
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="h-9 bg-card border-border text-xs rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center border border-border rounded-xl px-1">
                  <Button variant="ghost" size="icon" onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="h-8 w-8">
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-8 w-8">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button onClick={handleAddToCart} className="flex-1 font-bold h-10 rounded-xl">
                  Simpan - Rp {((Number(selectedProduct.price) + (selectedSize ? Number(selectedSize.priceAdjustment) : 0) + selectedToppings.reduce((sum, t) => sum + t.price, 0)) * quantity).toLocaleString('id-ID')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Processing Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Proses Pembayaran POS</DialogTitle>
            <DialogDescription className="text-xs">Silakan pilih metode bayar dan selesaikan transaksi.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={payMethod === 'CASH' ? 'default' : 'outline'}
                onClick={() => setPayMethod('CASH')}
                className="flex flex-col items-center justify-center h-16 rounded-xl gap-1"
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-[10px] font-bold">TUNAI</span>
              </Button>
              <Button
                type="button"
                variant={payMethod === 'DEBIT' ? 'default' : 'outline'}
                onClick={() => setPayMethod('DEBIT')}
                className="flex flex-col items-center justify-center h-16 rounded-xl gap-1"
              >
                <Landmark className="h-5 w-5" />
                <span className="text-[10px] font-bold">DEBIT / EDC</span>
              </Button>
              <Button
                type="button"
                variant={payMethod === 'QRIS' ? 'default' : 'outline'}
                onClick={() => setPayMethod('QRIS')}
                className="flex flex-col items-center justify-center h-16 rounded-xl gap-1"
              >
                <QrCode className="h-5 w-5" />
                <span className="text-[10px] font-bold">QRIS</span>
              </Button>
            </div>

            {/* Bill Summary */}
            <div className="bg-secondary/40 border border-border rounded-xl p-3.5 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Struk:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Potongan Diskon:</span>
                  <span>-Rp {discountValue.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Pajak PPN (10%):</span>
                <span>Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1.5 border-t border-border/50 text-primary">
                <span>TOTAL HARUS DIBAYAR:</span>
                <span>Rp {totalBill.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Cash Pay Option details */}
            {payMethod === 'CASH' && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="space-y-1">
                  <Label htmlFor="cashPaid" className="text-xs font-bold text-muted-foreground uppercase">Jumlah Tunai yang Diterima</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground font-extrabold text-xs">Rp</span>
                    <Input 
                      id="cashPaid"
                      type="number"
                      placeholder="Contoh: 100000"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="pl-10 h-10 bg-background border-border text-xs rounded-xl"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[totalBill, 20000, 50000, 100000, 200000].map((amt) => {
                    const cleanAmt = Math.ceil(amt);
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashAmount(String(cleanAmt))}
                        className="px-3 py-1 bg-secondary text-foreground border border-border hover:bg-muted text-3xs font-bold rounded-lg whitespace-nowrap"
                      >
                        Rp {cleanAmt.toLocaleString('id-ID')}
                      </button>
                    );
                  })}
                </div>

                {/* Change details */}
                {Number(cashAmount) >= totalBill && (
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600">
                    <span>Uang Kembalian (Return):</span>
                    <span className="text-sm font-black">Rp {changeValue.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={isSubmitting} className="h-10 rounded-xl text-xs font-bold border-border">
              Batal
            </Button>
            <Button onClick={handleCheckout} disabled={isSubmitting} className="h-10 bg-primary text-primary-foreground font-black px-6 rounded-xl flex-1 text-xs">
              {isSubmitting ? 'Memproses Transaksi...' : 'Konfirmasi Transaksi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Simulated Receipt Dialog */}
      <Dialog open={printedReceipt !== null} onOpenChange={(open) => !open && setPrintedReceipt(null)}>
        <DialogContent className="max-w-xs bg-white text-black border-2 border-black p-4 font-mono text-[10px] space-y-3 rounded-none select-text shadow-lg">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-sm tracking-widest uppercase">SMART COFFEE SHOP</h3>
            <p>Jl. Arabica No. 10, Jakarta</p>
            <p>Telp: (021) 8888-9999</p>
          </div>
          
          <div className="border-b border-dashed border-black py-1 space-y-0.5">
            <p>No Struk : {printedReceipt?.orderNumber}</p>
            <p>Tanggal  : {printedReceipt?.date ? new Date(printedReceipt.date).toLocaleString('id-ID') : ''}</p>
            <p>Kasir    : {session?.user?.name}</p>
            <p>Meja     : {printedReceipt?.tableNumber || 'Take-away'}</p>
            <p>Pelanggan: {printedReceipt?.customerName}</p>
          </div>

          <div className="border-b border-dashed border-black py-1.5 space-y-1">
            {printedReceipt?.items?.map((item: any) => {
              const itemToppingsPrice = item.toppings.reduce((sum: number, t: any) => sum + t.price, 0);
              const unitPrice = item.price + item.sizePriceAdjustment + itemToppingsPrice;
              return (
                <div key={item.cartId} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>{item.name} x{item.quantity}</span>
                    <span>Rp {(unitPrice * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-[8px] pl-2 text-black/80">({item.size}, {item.sugarLevel}, {item.iceLevel})</p>
                  {item.toppings.map((t: any) => (
                    <p key={t.name} className="text-[8px] pl-2 text-black/80">+Topping {t.name}</p>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="py-1 space-y-0.5">
            <div className="flex justify-between">
              <span>SUBTOTAL</span>
              <span>Rp {printedReceipt?.subtotal?.toLocaleString('id-ID')}</span>
            </div>
            {printedReceipt?.discount > 0 && (
              <div className="flex justify-between">
                <span>DISKON</span>
                <span>-Rp {printedReceipt?.discount?.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>PPN PAJAK (10%)</span>
              <span>Rp {printedReceipt?.tax?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-dashed border-black pt-1">
              <span>TOTAL</span>
              <span>Rp {printedReceipt?.total?.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black py-1 space-y-0.5">
            <div className="flex justify-between">
              <span>TIPE BAYAR</span>
              <span>{printedReceipt?.payMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>DIBAYAR</span>
              <span>Rp {printedReceipt?.cashPaid?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>KEMBALIAN</span>
              <span>Rp {printedReceipt?.change?.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="text-center border-t border-dashed border-black pt-3 space-y-1">
            <p className="font-bold uppercase tracking-wider">Terima Kasih</p>
            <p>Atas Kunjungan Anda</p>
            <p>Smart Coffee Management System</p>
          </div>

          <DialogFooter className="border-t border-dashed border-black pt-3 flex gap-2 w-full no-print">
            <Button size="sm" onClick={() => window.print()} className="bg-black hover:bg-black/90 text-white font-mono text-[9px] w-full rounded-none flex items-center justify-center gap-1.5 h-8">
              <Printer className="h-3 w-3" /> Cetak Struk
            </Button>
            <Button size="sm" onClick={() => setPrintedReceipt(null)} className="bg-zinc-200 hover:bg-zinc-300 text-black font-mono text-[9px] w-full rounded-none h-8">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
