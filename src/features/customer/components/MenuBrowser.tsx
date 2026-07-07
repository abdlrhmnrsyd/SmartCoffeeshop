'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore, CartItem, CartTopping } from '../stores/cartStore';
import { getMenuData } from '../actions/menuActions';
import { createCustomerOrder, callWaiter } from '../actions/customerActions';
import { 
  Coffee, Search, ShoppingBag, Plus, Minus, X, 
  Bell, Check, Utensils, Award, CreditCard, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface MenuBrowserProps {
  initialData: {
    categories: any[];
    products: any[];
    toppings: any[];
  };
  tableNo: number;
}

export default function MenuBrowser({ initialData, tableNo }: MenuBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Zustand Cart Store
  const cart = useCartStore();

  // Menu Data
  const { categories, products, toppings } = initialData;

  // State Management
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Customization State
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedSugar, setSelectedSugar] = useState<any>(null);
  const [selectedIce, setSelectedIce] = useState<any>(null);
  const [selectedToppings, setSelectedToppings] = useState<CartTopping[]>([]);
  const [itemNotes, setItemNotes] = useState<string>('');

  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set Table Number in Store
  useEffect(() => {
    cart.setTableNumber(tableNo);
  }, [tableNo]);

  // Handle Voucher Application
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customer/vouchers?code=${voucherCode}&total=${cart.getCartTotal()}`);
      const data = await res.json();
      if (data.success) {
        setAppliedVoucher(data.voucher);
        toast.success(`Voucher ${voucherCode} berhasil digunakan!`);
      } else {
        toast.error(data.error || 'Voucher tidak valid.');
        setAppliedVoucher(null);
      }
    } catch (err) {
      toast.error('Gagal memproses voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Customization Modal
  const openCustomization = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setItemNotes('');
    setSelectedToppings([]);
    
    // Set default options if available
    const sizes = product.groupedOptions?.['Size'] || [];
    const sugars = product.groupedOptions?.['Sugar'] || [];
    const ices = product.groupedOptions?.['Ice'] || [];

    setSelectedSize(sizes.find((s: any) => s.value === 'Regular') || sizes[0] || null);
    setSelectedSugar(sugars.find((s: any) => s.value === 'Normal') || sugars[0] || null);
    setSelectedIce(ices.find((i: any) => i.value === 'Normal Ice') || ices[0] || null);
  };

  // Calculate customized price in modal
  const getCustomizedItemPrice = () => {
    if (!selectedProduct) return 0;
    const base = Number(selectedProduct.price);
    const sizeAdjustment = selectedSize ? Number(selectedSize.priceAdjustment) : 0;
    const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return base + sizeAdjustment + toppingsTotal;
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    cart.addItem({
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
    toast.success(`${selectedProduct.name} ditambahkan ke keranjang.`);
  };

  // Handle Checkout / Place Order
  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error('Silakan masukkan nama Anda untuk memesan.');
      return;
    }
    if (cart.items.length === 0) {
      toast.error('Keranjang belanja Anda kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        sizePriceAdjustment: item.sizePriceAdjustment,
        sugarLevel: item.sugarLevel,
        iceLevel: item.iceLevel,
        toppings: item.toppings,
        notes: item.notes,
      }));

      const res = await createCustomerOrder({
        customerName,
        tableNumber: tableNo,
        items: orderItems,
        notes: checkoutNotes,
      });

      if (res.success && res.orderId) {
        toast.success('Pemesanan sukses! Mengalihkan ke halaman status...');
        cart.clearCart();
        setIsCartOpen(false);
        // Save order reference in localStorage so they can check status later
        localStorage.setItem(`last_order_id_table_${tableNo}`, res.orderId);
        router.push(`/menu/status?orderId=${res.orderId}`);
      } else {
        toast.error(res.error || 'Gagal memproses pesanan.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat memesan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Call Waiter Button Action
  const handleCallWaiter = async () => {
    const res = await callWaiter(tableNo);
    if (res.success) {
      toast.success('Pelayan sedang menuju ke meja Anda.');
    } else {
      toast.error('Gagal memanggil pelayan.');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'all' || prod.categoryId === activeCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate Cart Totals
  const subtotal = cart.getCartTotal();
  const discountValue = appliedVoucher
    ? appliedVoucher.discountType === 'PERCENTAGE'
      ? Math.min((subtotal * Number(appliedVoucher.discountValue)) / 100, Number(appliedVoucher.maxDiscount || Infinity))
      : Number(appliedVoucher.discountValue)
    : 0;
  
  const tax = (subtotal - discountValue) * 0.1;
  const totalBill = subtotal - discountValue + tax;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Table Header Bar */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-xs px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl flex items-center justify-center">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-none text-foreground">Meja {tableNo}</h2>
            <span className="text-2xs text-muted-foreground font-medium">Smart Coffee Menu</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-background hover:bg-accent hover:text-accent-foreground text-xs h-9 rounded-xl"
            onClick={handleCallWaiter}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Panggil Pelayan</span>
          </Button>

          {/* Cart Trigger */}
          <Button 
            variant="default"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="relative h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold shadow-xs bg-primary text-primary-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs">{cart.items.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
          </Button>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* Banner Promo */}
        <div className="bg-gradient-to-r from-[#4a3728] to-[#6d503b] text-[#fbf7f4] rounded-2xl p-5 shadow-xs border border-[#3c2d21]/20 relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] text-white/5 opacity-10 rotate-12">
            <Coffee className="h-48 w-48" />
          </div>
          <div className="z-10 relative space-y-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-[#ebd9cc] text-[#4a3728] uppercase tracking-wider">
              Coffee promo
            </span>
            <h3 className="font-bold text-xl sm:text-2xl mt-1">Diskon 10% Pakai Kode: COFFEE10</h3>
            <p className="text-xs text-[#ebd9cc]/80 max-w-md">Nikmati menu kopi pilihan dengan harga hemat. Gunakan kode diskon saat checkout.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-muted-foreground flex items-center" />
          <Input 
            type="text"
            placeholder="Cari kopi, teh, croissant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border rounded-xl focus:border-primary placeholder:text-muted-foreground text-sm"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'secondary'}
            onClick={() => setActiveCategory('all')}
            size="sm"
            className="rounded-full text-xs font-semibold whitespace-nowrap"
          >
            Semua
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'secondary'}
              onClick={() => setActiveCategory(cat.id)}
              size="sm"
              className="rounded-full text-xs font-semibold whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => (
            <motion.div
              key={prod.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full bg-card border-border hover:border-primary/30 transition-all hover:shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  {prod.photo && (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <img 
                        src={prod.photo} 
                        alt={prod.name}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader className="p-3.5 pb-1 space-y-1">
                    <CardTitle className="text-sm font-bold truncate text-foreground">{prod.name}</CardTitle>
                    <p className="text-2xs text-muted-foreground line-clamp-2 h-7 font-normal">{prod.description || 'Tidak ada deskripsi.'}</p>
                  </CardHeader>
                </div>
                
                <CardFooter className="p-3.5 pt-2 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-foreground">Rp {Number(prod.price).toLocaleString('id-ID')}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => openCustomization(prod)}
                    className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Tidak ada menu yang cocok dengan pencarian Anda.
          </div>
        )}
      </main>

      {/* Floating Check Status Bar (if there is a recent order) */}
      <AnimatePresence>
        {typeof window !== 'undefined' && localStorage.getItem(`last_order_id_table_${tableNo}`) && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-3.5 rounded-xl shadow-lg z-30 flex items-center justify-between border border-primary-foreground/10"
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary-foreground/10 p-1.5 rounded-lg text-primary-foreground">
                <Utensils className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-none">Ada Pesanan Aktif</h4>
                <p className="text-2xs text-primary-foreground/75 mt-0.5">Lihat status pembuatan minuman Anda secara realtime.</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/menu/status?orderId=${localStorage.getItem(`last_order_id_table_${tableNo}`)}`)}
              className="text-xs font-semibold h-8 rounded-lg bg-background hover:bg-accent text-foreground"
            >
              Cek Status
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customization Dialog */}
      <Dialog open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader className="pb-3 border-b border-border">
                <DialogTitle className="text-lg font-bold">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">{selectedProduct.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Size Options */}
                {selectedProduct.groupedOptions?.['Size'] && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pilih Ukuran</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.groupedOptions['Size'].map((opt: any) => (
                        <div 
                          key={opt.id}
                          onClick={() => setSelectedSize(opt)}
                          className={`flex items-center justify-between p-2.5 border rounded-xl cursor-pointer transition-all ${
                            selectedSize?.id === opt.id 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <span className="text-sm font-semibold">{opt.value}</span>
                          <span className="text-xs text-muted-foreground">
                            {Number(opt.priceAdjustment) > 0 ? `+Rp ${Number(opt.priceAdjustment).toLocaleString('id-ID')}` : 'Free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugar Options */}
                {selectedProduct.groupedOptions?.['Sugar'] && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Level Gula</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.groupedOptions['Sugar'].map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedSugar(opt)}
                          className={`py-2 text-xs font-semibold border rounded-lg transition-all ${
                            selectedSugar?.id === opt.id 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ice Options */}
                {selectedProduct.groupedOptions?.['Ice'] && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Level Es</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.groupedOptions['Ice'].map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedIce(opt)}
                          className={`py-2 text-xs font-semibold border rounded-lg transition-all ${
                            selectedIce?.id === opt.id 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings Selection */}
                {toppings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">Tambahan Topping</Label>
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
                            className={`flex items-center justify-between p-2.5 border rounded-xl cursor-pointer transition-all ${
                              isChecked 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={isChecked} onCheckedChange={() => {}} className="pointer-events-none" />
                              <span className="text-xs font-medium">{top.name}</span>
                            </div>
                            <span className="text-2xs text-muted-foreground">+Rp {Number(top.price).toLocaleString('id-ID')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Special Notes */}
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catatan Khusus</Label>
                  <Input 
                    id="notes" 
                    placeholder="Contoh: kopi lebih pekat, tanpa es..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="text-xs h-9 bg-card border-border rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-4 border-t border-border pt-4 mt-2">
                {/* Quantity Selector */}
                <div className="flex items-center border border-border rounded-xl px-1 py-0.5">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)} 
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl h-11"
                >
                  Tambah - Rp {(getCustomizedItemPrice() * quantity).toLocaleString('id-ID')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer Panel (AnimatePresence) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h3 className="font-extrabold text-base">Keranjang Pesanan</h3>
                  <Badge variant="secondary">{cart.items.reduce((sum, i) => sum + i.quantity, 0)}</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.items.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                    <ShoppingBag className="h-10 w-10 text-muted/50" />
                    <p className="text-sm font-semibold">Keranjang Anda masih kosong</p>
                    <p className="text-xs text-muted-foreground">Silakan pilih menu kopi favorit Anda terlebih dahulu.</p>
                  </div>
                ) : (
                  cart.items.map((item) => {
                    const itemToppingsPrice = item.toppings.reduce((sum, t) => sum + t.price, 0);
                    const itemUnitTotal = Number(item.price) + Number(item.sizePriceAdjustment) + itemToppingsPrice;
                    return (
                      <div key={item.cartId} className="flex gap-3 bg-secondary/50 p-3 rounded-xl border border-border">
                        {item.photo && (
                          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate">{item.name}</h4>
                          <p className="text-3xs text-muted-foreground mt-0.5">
                            {item.size} | {item.sugarLevel} | {item.iceLevel}
                          </p>
                          {item.toppings.length > 0 && (
                            <p className="text-3xs text-[#7c5b43] font-medium mt-0.5">
                              Topping: {item.toppings.map((t) => t.name).join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-3xs text-muted-foreground italic mt-0.5">
                              Catatan: &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2.5">
                            <span className="font-extrabold text-xs">Rp {(itemUnitTotal * item.quantity).toLocaleString('id-ID')}</span>
                            
                            {/* Counter */}
                            <div className="flex items-center border border-border rounded-lg bg-card px-0.5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md"
                                onClick={() => cart.updateQuantity(item.cartId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-2xs font-bold">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md"
                                onClick={() => cart.updateQuantity(item.cartId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Checkout Form & Pricing Summary */}
              {cart.items.length > 0 && (
                <div className="border-t border-border bg-card p-4 space-y-4 shadow-xl">
                  
                  {/* Name and Notes Inputs */}
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="custName" className="text-xs font-bold">Nama Pemesan <span className="text-destructive">*</span></Label>
                      <Input 
                        id="custName"
                        type="text"
                        placeholder="Masukkan nama panggilan Anda"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="text-xs h-9 bg-background mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkoutNotes" className="text-xs font-semibold text-muted-foreground">Catatan Tambahan untuk Kasir/Barista</Label>
                      <Input 
                        id="checkoutNotes"
                        type="text"
                        placeholder="Contoh: jadikan satu nampan..."
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        className="text-xs h-9 bg-background mt-1"
                      />
                    </div>
                  </div>

                  {/* Voucher Codes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Gunakan Kode Voucher</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        placeholder="Contoh: COFFEE10" 
                        value={voucherCode} 
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="text-xs h-9 bg-background font-mono"
                      />
                      <Button 
                        size="sm" 
                        type="button" 
                        onClick={handleApplyVoucher}
                        className="h-9 px-3 font-semibold text-xs"
                        disabled={isSubmitting}
                      >
                        Pakai
                      </Button>
                    </div>
                    {appliedVoucher && (
                      <p className="text-3xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                        <Check className="h-3 w-3" /> Voucher {appliedVoucher.code} berhasil dipasang (Potongan Rp {discountValue.toLocaleString('id-ID')}).
                      </p>
                    )}
                  </div>

                  {/* Price Calculation details */}
                  <div className="space-y-1 text-xs border-t border-border pt-3">
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
                    <div className="flex justify-between font-extrabold text-sm text-foreground pt-1.5 border-t border-border/50">
                      <span>Total Tagihan</span>
                      <span>Rp {totalBill.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-11 rounded-xl shadow-lg mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Memproses Pesanan...' : `Buat Pesanan & Bayar (Rp ${totalBill.toLocaleString('id-ID')})`}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
