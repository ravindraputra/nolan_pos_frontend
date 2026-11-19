import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  Scale,
  Package,
  Settings,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Boxes,
} from "lucide-react";

import CatatPesanan from "./components/CatatPesanan";
import Rekonsiliasi from "./components/Rekonsiliasi";
import Pengaturan from "./components/Pengaturan";

const API_URL = "http://127.0.0.1:8000";

const formatRp = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka || 0);

export default function App() {
  // Navigasi & Status API
  const [activeMenu, setActiveMenu] = useState("Dasbor Utama");
  const [apiStatus, setApiStatus] = useState("loading");

  // Data Global dari Backend
  const [laporan, setLaporan] = useState(null);
  const [stokList, setStokList] = useState([]);
  const [daftarMenu, setDaftarMenu] = useState([]);
  const [menuDetail, setMenuDetail] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [komisiList, setKomisiList] = useState([]);
  const [resepList, setResepList] = useState([]);

  // State Form Dasbor Utama
  const [platform, setPlatform] = useState("ShopeeFood");
  const [menu, setMenu] = useState("");
  const [hargaKotor, setHargaKotor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState(null);

  // State Form Stok Bahan Baku
  const [namaBahan, setNamaBahan] = useState("");
  const [jumlahStok, setJumlahStok] = useState("");
  const [submittingStok, setSubmittingStok] = useState(false);
  const [notifStok, setNotifStok] = useState(null);

  const navItems = [
    { name: "Dasbor Utama", icon: LayoutDashboard },
    { name: "Catat Pesanan", icon: Receipt },
    { name: "Rekonsiliasi", icon: Scale },
    { name: "Stok Bahan", icon: Package },
    { name: "Pengaturan", icon: Settings },
  ];

  // Ambil seluruh data dari FastAPI secara paralel
  const fetchAllData = async () => {
    try {
      const [
        resLaporan,
        resStok,
        resMenu,
        resRiwayat,
        resKomisi,
        resResep,
      ] = await Promise.all([
        fetch(`${API_URL}/laporan-keuangan/`),
        fetch(`${API_URL}/bahan-baku/`),
        fetch(`${API_URL}/daftar-menu/`),
        fetch(`${API_URL}/riwayat-pesanan/`),
        fetch(`${API_URL}/komisi/`),
        fetch(`${API_URL}/daftar-resep/`),
      ]);

      if (!resLaporan.ok) throw new Error("API error");

      setLaporan(await resLaporan.json());

      if (resStok.ok) {
        const d = await resStok.json();
        setStokList(d.data_bahan_baku || []);
      }

      if (resMenu.ok) {
        const d = await resMenu.json();
        const menus = d.daftar_menu || [];
        setDaftarMenu(menus);
        setMenuDetail(d.menu_detail || []);
        if (menus.length > 0 && !menus.includes(menu)) {
          setMenu(menus[0]);
        }
      }

      if (resRiwayat.ok) {
        const d = await resRiwayat.json();
        setRiwayat(d.riwayat || []);
      }

      if (resKomisi.ok) {
        const d = await resKomisi.json();
        setKomisiList(d.komisi || []);
      }

      if (resResep.ok) {
        const d = await resResep.json();
        setResepList(d.resep || []);
      }

      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmitTransaksi = async (e) => {
    e.preventDefault();
    if (!menu) {
      setNotif({ type: "error", text: "Pilih menu terlebih dahulu." });
      return;
    }
    if (!hargaKotor || Number(hargaKotor) <= 0) {
      setNotif({ type: "error", text: "Masukkan nominal harga kotor yang valid." });
      return;
    }

    setSubmitting(true);
    setNotif(null);

    try {
      const res = await fetch(`${API_URL}/tambah-pesanan/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          menu,
          harga_kotor: Number(hargaKotor),
        }),
      });

      if (res.ok) {
        setNotif({
          type: "success",
          text: `Transaksi '${menu}' tercatat & stok bahan otomatis terpotong!`,
        });
        setHargaKotor("");
        fetchAllData();
      } else {
        const errData = await res.json().catch(() => ({}));
        const pesanError =
          typeof errData.detail === "string"
            ? errData.detail
            : `Gagal menyimpan transaksi (Error ${res.status}).`;
        setNotif({ type: "error", text: pesanError });
      }
    } catch {
      setNotif({ type: "error", text: "Koneksi ke Backend API terputus." });
      setApiStatus("offline");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitStok = async (e) => {
    e.preventDefault();
    if (!namaBahan.trim() || !jumlahStok || Number(jumlahStok) <= 0) {
      setNotifStok({
        type: "error",
        text: "Isi nama bahan dan jumlah tambahan stok yang valid.",
      });
      return;
    }

    setSubmittingStok(true);
    setNotifStok(null);

    try {
      const res = await fetch(`${API_URL}/tambah-bahan-baku/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaBahan.trim(),
          stok: Number(jumlahStok),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotifStok({
          type: "success",
          text: data.pesan || "Stok berhasil diperbarui!",
        });
        setNamaBahan("");
        setJumlahStok("");
        fetchAllData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotifStok({
          type: "error",
          text: errData.detail || "Gagal memperbarui stok.",
        });
      }
    } catch {
      setNotifStok({ type: "error", text: "Koneksi ke Backend API terputus." });
    } finally {
      setSubmittingStok(false);
    }
  };

  const total = laporan?.total || { kotor: 0, potongan: 0, bersih: 0 };
  const ringkasan = laporan?.ringkasan || [];

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-slate-900 font-sans antialiased">
      {/* SIDEBAR NAVIGASI */}
      <aside className="w-68 bg-white border-r border-slate-200/80 flex flex-col px-5 py-7 shrink-0">
        <div className="px-3 mb-8">
          <span className="text-2xl font-black tracking-tight text-slate-900">
            MAMABITES
          </span>
          <p className="text-xs font-semibold text-orange-600 tracking-wide mt-0.5">
            by Nolan AI POS
          </p>
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveMenu(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 p-8 lg:p-10 overflow-y-auto">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-7 mb-8 border-b border-slate-200/80">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              MAMABITES MALANG
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              by Nolan AI POS • Sawojajar, Malang, Jawa Timur
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {apiStatus === "online" ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                API OFFLINE
              </span>
            )}
          </div>
        </header>

        {/* HALAMAN 1: DASBOR UTAMA */}
        {activeMenu === "Dasbor Utama" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <section className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-6">
                <PlusCircle className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-slate-900">Transaksi Cepat</h2>
              </div>

              <form onSubmit={handleSubmitTransaksi} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Platform Penjualan
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ShopeeFood">ShopeeFood</option>
                    <option value="GoFood">GoFood</option>
                    <option value="GrabFood">GrabFood</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Pilihan Menu
                  </label>
                  <select
                    value={menu}
                    onChange={(e) => setMenu(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {daftarMenu.length === 0 ? (
                      <option value="">Memuat daftar menu...</option>
                    ) : (
                      daftarMenu.map((itemMenu) => (
                        <option key={itemMenu} value={itemMenu}>
                          {itemMenu}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Harga Kotor (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Contoh: 35000"
                    value={hargaKotor}
                    onChange={(e) => setHargaKotor(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-[15px] transition shadow-sm cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Transaksi"}
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
              </form>
            </section>

            <section className="xl:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-2">
                    <span>Omset Kotor</span>
                    <Wallet className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {formatRp(total.kotor)}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Akumulasi aktif
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-2">
                    <span>Potongan Komisi</span>
                    <Percent className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-rose-600">
                    {formatRp(total.potongan)}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Biaya platform
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-2">
                    <span>Penerimaan Bersih</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {formatRp(total.bersih)}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Net diterima kasir
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">
                    Detail Pendapatan Real-Time
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {ringkasan.length} channel aktif
                  </span>
                </div>

                {apiStatus === "offline" ? (
                  <div className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">
                      Backend FastAPI belum merespons
                    </p>
                  </div>
                ) : ringkasan.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium">
                    Belum ada transaksi tercatat hari ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/80">
                          <th className="py-3.5 px-6 font-bold">Platform</th>
                          <th className="py-3.5 px-6 font-bold">Jumlah</th>
                          <th className="py-3.5 px-6 font-bold">Omset Kotor</th>
                          <th className="py-3.5 px-6 font-bold">Potongan</th>
                          <th className="py-3.5 px-6 font-bold text-right">Bersih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[15px]">
                        {ringkasan.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-4 px-6 font-bold text-slate-900">
                              {row.platform}
                            </td>
                            <td className="py-4 px-6 text-slate-600">
                              {row.jumlah} pesanan
                            </td>
                            <td className="py-4 px-6 font-medium text-slate-800">
                              {formatRp(row.omset_kotor)}
                            </td>
                            <td className="py-4 px-6 font-semibold text-rose-600">
                              -{formatRp(row.potongan)}
                            </td>
                            <td className="py-4 px-6 font-bold text-emerald-700 text-right">
                              {formatRp(row.omset_bersih)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-bold">
                          <td colSpan="2" className="py-4 px-6 text-sm uppercase tracking-wider">
                            Total Keseluruhan
                          </td>
                          <td className="py-4 px-6">{formatRp(total.kotor)}</td>
                          <td className="py-4 px-6 text-rose-300">
                            -{formatRp(total.potongan)}
                          </td>
                          <td className="py-4 px-6 text-right text-emerald-300 text-lg">
                            {formatRp(total.bersih)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* HALAMAN 2: CATAT PESANAN (POS CART) */}
        {activeMenu === "Catat Pesanan" && (
          <CatatPesanan
            apiUrl={API_URL}
            menuDetail={menuDetail}
            formatRp={formatRp}
            onSuccess={fetchAllData}
          />
        )}

        {/* HALAMAN 3: REKONSILIASI */}
        {activeMenu === "Rekonsiliasi" && (
          <Rekonsiliasi
            apiUrl={API_URL}
            riwayat={riwayat}
            formatRp={formatRp}
            onSuccess={fetchAllData}
          />
        )}

        {/* HALAMAN 4: STOK BAHAN BAKU */}
        {activeMenu === "Stok Bahan" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <section className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Boxes className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Restock / Bahan Baru
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Klik baris di sebelah kanan untuk restock, atau ketik nama baru.
              </p>

              <form onSubmit={handleSubmitStok} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Bahan Baku
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tepung Terigu"
                    value={namaBahan}
                    onChange={(e) => setNamaBahan(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Jumlah Tambahan Stok (Porsi/Unit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 50"
                    value={jumlahStok}
                    onChange={(e) => setJumlahStok(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingStok}
                  className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-[15px] transition shadow-sm cursor-pointer"
                >
                  {submittingStok ? "Memperbarui..." : "Simpan Stok Bahan"}
                </button>

                {notifStok && (
                  <div
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-semibold ${
                      notifStok.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {notifStok.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <span>{notifStok.text}</span>
                  </div>
                )}
              </form>
            </section>

            <section className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Inventaris Bahan Baku Real-Time
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {stokList.length} item terdaftar
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/80">
                      <th className="py-3.5 px-6 font-bold">Nama Bahan</th>
                      <th className="py-3.5 px-6 font-bold">Sisa Stok</th>
                      <th className="py-3.5 px-6 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[15px]">
                    {stokList.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setNamaBahan(item.nama)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {item.nama}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          {item.stok} unit
                        </td>
                        <td className="py-4 px-6 text-right">
                          {item.stok <= 0 ? (
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              HABIS
                            </span>
                          ) : item.stok <= 10 ? (
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              MENIPIS
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              AMAN
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* HALAMAN 5: PENGATURAN */}
        {activeMenu === "Pengaturan" && (
          <Pengaturan
            apiUrl={API_URL}
            komisiList={komisiList}
            resepList={resepList}
            stokList={stokList}
            formatRp={formatRp}
            onSuccess={fetchAllData}
          />
        )}
      </main>
    </div>
  );
}
