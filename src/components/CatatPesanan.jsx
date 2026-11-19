import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Banknote,
  X,
} from "lucide-react";

export default function CatatPesanan({
  apiUrl,
  menuDetail,
  formatRp,
  onSuccess,
}) {
  const [platform, setPlatform] = useState("Offline");
  const [cart, setCart] = useState([]);
  const [uangDiterima, setUangDiterima] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState(null);
  const [struk, setStruk] = useState(null);

  const tambahKeKeranjang = (item) => {
    setNotif(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.menu === item.menu);
      if (existing) {
        return prev.map((c) =>
          c.menu === item.menu ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { menu: item.menu, harga: item.harga, qty: 1 }];
    });
  };

  const ubahQty = (namaMenu, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menu === namaMenu ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const ubahHargaItem = (namaMenu, hargaBaru) => {
    setCart((prev) =>
      prev.map((c) =>
        c.menu === namaMenu ? { ...c, harga: Number(hargaBaru) || 0 } : c
      )
    );
  };

  const totalBelanja = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const kembalian =
    platform === "Offline" && uangDiterima
      ? Number(uangDiterima) - totalBelanja
      : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setNotif({ type: "error", text: "Keranjang masih kosong." });
      return;
    }
    if (
      platform === "Offline" &&
      uangDiterima &&
      Number(uangDiterima) < totalBelanja
    ) {
      setNotif({ type: "error", text: "Uang diterima kurang dari total belanja." });
      return;
    }

    setSubmitting(true);
    setNotif(null);

    try {
      // Kirim 1 request per unit agar pemotongan stok resep di backend akurat
      for (const item of cart) {
        for (let i = 0; i < item.qty; i++) {
          const res = await fetch(`${apiUrl}/tambah-pesanan/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform,
              menu: item.menu,
              harga_kotor: item.harga,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(
              errData.detail || `Gagal memproses '${item.menu}'.`
            );
          }
        }
      }

      setStruk({
        waktu: new Date().toLocaleString("id-ID"),
        platform,
        items: [...cart],
        total: totalBelanja,
        bayar: platform === "Offline" ? Number(uangDiterima) || totalBelanja : totalBelanja,
        kembalian: platform === "Offline" && uangDiterima ? kembalian : 0,
      });

      setCart([]);
      setUangDiterima("");
      setNotif({ type: "success", text: "Pesanan berhasil diproses!" });
      onSuccess();
    } catch (err) {
      setNotif({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* KIRI: KATALOG MENU */}
      <section className="xl:col-span-7 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pilih Menu</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik kartu menu untuk menambahkan ke keranjang pesanan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {["Offline", "ShopeeFood", "GoFood", "GrabFood"].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatform(plat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    platform === plat
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          {menuDetail.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Belum ada menu terdaftar. Tambahkan menu di halaman Pengaturan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuDetail.map((item) => {
                const inCart = cart.find((c) => c.menu === item.menu);
                return (
                  <button
                    key={item.menu}
                    onClick={() => tambahKeKeranjang(item)}
                    className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-32 ${
                      inCart
                        ? "border-orange-500 bg-orange-50/40 ring-1 ring-orange-500"
                        : "border-slate-200 hover:border-slate-400 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-[15px] leading-snug">
                        {item.menu}
                      </span>
                      {inCart && (
                        <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-orange-600 text-white shrink-0">
                          {inCart.qty}x
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-800">
                        {formatRp(item.harga)}
                      </span>
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* KANAN: KERANJANG & PEMBAYARAN */}
      <section className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Keranjang ({platform})
            </h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              Kosongkan
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            Belum ada item di keranjang.
          </div>
        ) : (
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.menu}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {item.menu}
                  </span>
                  <button
                    onClick={() => ubahQty(item.menu, -item.qty)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.harga}
                      onChange={(e) => ubahHargaItem(item.menu, e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => ubahQty(item.menu, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => ubahQty(item.menu, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RINGKASAN BAYAR */}
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">
              Total Tagihan
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              {formatRp(totalBelanja)}
            </span>
          </div>

          {platform === "Offline" && (
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Uang Tunai Diterima (Opsional)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Contoh: 50000"
                value={uangDiterima}
                onChange={(e) => setUangDiterima(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {uangDiterima && (
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-semibold text-slate-600">Kembalian</span>
                  <span
                    className={`font-extrabold ${
                      kembalian < 0 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {formatRp(kembalian)}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-[15px] transition shadow-sm cursor-pointer"
          >
            {submitting ? "Memproses Pesanan..." : "Bayar & Simpan Pesanan"}
          </button>

          {notif && (
            <div
              className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-semibold ${
                notif.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {notif.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{notif.text}</span>
            </div>
          )}
        </div>
      </section>

      {/* MODAL PRATINJAU STRUK */}
      {struk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Transaksi Sukses
              </span>
              <button
                onClick={() => setStruk(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-dashed border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-bold text-sm">MAMABITES MALANG</p>
                <p className="text-[11px] text-slate-500">
                  Sawojajar, Malang • Nolan AI POS
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {struk.waktu} • {struk.platform}
                </p>
              </div>

              <div className="space-y-1.5 py-1">
                {struk.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {it.qty}x {it.menu}
                    </span>
                    <span>{formatRp(it.harga * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-bold">
                <div className="flex justify-between text-sm">
                  <span>TOTAL</span>
                  <span>{formatRp(struk.total)}</span>
                </div>
                {struk.platform === "Offline" && (
                  <>
                    <div className="flex justify-between font-normal">
                      <span>Bayar</span>
                      <span>{formatRp(struk.bayar)}</span>
                    </div>
                    <div className="flex justify-between font-normal">
                      <span>Kembali</span>
                      <span>{formatRp(struk.kembalian)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={() => setStruk(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
