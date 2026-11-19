import { useState, useEffect } from "react";
import {
  Sliders,
  ChefHat,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function Pengaturan({
  apiUrl,
  komisiList,
  resepList,
  stokList,
  formatRp,
  onSuccess,
}) {
  // State Komisi
  const [komisiDraft, setKomisiDraft] = useState({});
  const [notifKomisi, setNotifKomisi] = useState(null);

  // State Resep & Harga Menu
  const [namaMenu, setNamaMenu] = useState("");
  const [hargaMenu, setHargaMenu] = useState("");
  const [komposisi, setKomposisi] = useState([{ nama_bahan: "", jumlah: 1 }]);
  const [savingResep, setSavingResep] = useState(false);
  const [notifResep, setNotifResep] = useState(null);

  useEffect(() => {
    const draft = {};
    komisiList.forEach((k) => {
      draft[k.platform] = k.persen;
    });
    setKomisiDraft(draft);
  }, [komisiList]);

  useEffect(() => {
    if (stokList.length > 0 && komposisi.length === 1 && !komposisi[0].nama_bahan) {
      setKomposisi([{ nama_bahan: stokList[0].nama, jumlah: 1 }]);
    }
  }, [stokList]);

  const handleSimpanKomisi = async (platform) => {
    setNotifKomisi(null);
    try {
      const res = await fetch(`${apiUrl}/komisi/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          persen: Number(komisiDraft[platform] ?? 0),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotifKomisi({ type: "success", text: data.pesan || "Komisi disimpan!" });
        onSuccess();
      } else {
        setNotifKomisi({ type: "error", text: data.detail || "Gagal menyimpan." });
      }
    } catch {
      setNotifKomisi({ type: "error", text: "Koneksi ke Backend API terputus." });
    }
  };

  const tambahBarisBahan = () => {
    setKomposisi([
      ...komposisi,
      { nama_bahan: stokList[0]?.nama || "", jumlah: 1 },
    ]);
  };

  const hapusBarisBahan = (index) => {
    setKomposisi(komposisi.filter((_, i) => i !== index));
  };

  const updateBarisBahan = (index, field, value) => {
    setKomposisi(
      komposisi.map((row, i) =>
        i === index
          ? { ...row, [field]: field === "jumlah" ? Number(value) : value }
          : row
      )
    );
  };

  const pilihUntukEdit = (item) => {
    setNamaMenu(item.menu);
    setHargaMenu(String(item.harga));
    setKomposisi(
      item.komposisi.map((k) => ({
        nama_bahan: k.nama_bahan,
        jumlah: k.jumlah,
      }))
    );
    setNotifResep(null);
  };

  const handleSimpanResep = async (e) => {
    e.preventDefault();
    const validKomposisi = komposisi.filter(
      (k) => k.nama_bahan && Number(k.jumlah) > 0
    );

    if (!namaMenu.trim() || !hargaMenu || validKomposisi.length === 0) {
      setNotifResep({
        type: "error",
        text: "Lengkapi nama menu, harga jual, dan minimal 1 bahan baku.",
      });
      return;
    }

    setSavingResep(true);
    setNotifResep(null);

    try {
      const resResep = await fetch(`${apiUrl}/tambah-resep/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu: namaMenu.trim(),
          komposisi: validKomposisi,
        }),
      });
      if (!resResep.ok) {
        const err = await resResep.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal menyimpan resep.");
      }

      const resHarga = await fetch(`${apiUrl}/atur-harga-menu/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu: namaMenu.trim(),
          harga: Number(hargaMenu),
        }),
      });
      if (!resHarga.ok) {
        const err = await resHarga.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal menyimpan harga menu.");
      }

      setNotifResep({
        type: "success",
        text: `Menu & Resep '${namaMenu.trim()}' berhasil disimpan!`,
      });
      setNamaMenu("");
      setHargaMenu("");
      setKomposisi([{ nama_bahan: stokList[0]?.nama || "", jumlah: 1 }]);
      onSuccess();
    } catch (err) {
      setNotifResep({ type: "error", text: err.message });
    } finally {
      setSavingResep(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* BAGIAN 1: PENGATURAN KOMISI PLATFORM */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-2">
          <Sliders className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Pengaturan Komisi Platform (%)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Perubahan persentase komisi otomatis memperbarui perhitungan di Dasbor Utama & Rekonsiliasi.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {komisiList.map((item) => (
            <div
              key={item.platform}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
            >
              <p className="font-bold text-slate-900 text-sm">{item.platform}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={komisiDraft[item.platform] ?? ""}
                  onChange={(e) =>
                    setKomisiDraft({
                      ...komisiDraft,
                      [item.platform]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
              <button
                onClick={() => handleSimpanKomisi(item.platform)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          ))}
        </div>

        {notifKomisi && (
          <div
            className={`mt-4 flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-semibold ${
              notifKomisi.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {notifKomisi.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{notifKomisi.text}</span>
          </div>
        )}
      </section>

      {/* BAGIAN 2: KELOLA MENU & RESEP BOM */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* FORM TAMBAH / EDIT RESEP */}
        <section className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-2">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Tambah / Edit Menu & Resep
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Klik menu di sebelah kanan untuk mengedit, atau ketik nama baru untuk menambah menu.
          </p>

          <form onSubmit={handleSimpanResep} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Menu
              </label>
              <input
                type="text"
                placeholder="Contoh: Martabak Keju Spesial"
                value={namaMenu}
                onChange={(e) => setNamaMenu(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Harga Jual Default (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Contoh: 40000"
                value={hargaMenu}
                onChange={(e) => setHargaMenu(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">
                  Komposisi Bahan (BOM)
                </label>
                <button
                  type="button"
                  onClick={tambahBarisBahan}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Bahan
                </button>
              </div>

              <div className="space-y-2.5">
                {komposisi.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={row.nama_bahan}
                      onChange={(e) =>
                        updateBarisBahan(idx, "nama_bahan", e.target.value)
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {stokList.map((s) => (
                        <option key={s.id} value={s.nama}>
                          {s.nama}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={row.jumlah}
                      onChange={(e) =>
                        updateBarisBahan(idx, "jumlah", e.target.value)
                      }
                      className="w-20 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {komposisi.length > 1 && (
                      <button
                        type="button"
                        onClick={() => hapusBarisBahan(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingResep}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm transition cursor-pointer"
            >
              {savingResep ? "Menyimpan..." : "Simpan Menu & Resep"}
            </button>

            {notifResep && (
              <div
                className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-semibold ${
                  notifResep.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {notifResep.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span>{notifResep.text}</span>
              </div>
            )}
          </form>
        </section>

        {/* DAFTAR MENU & RESEP TERDAFTAR */}
        <section className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Menu & Resep Aktif
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {resepList.length} menu
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {resepList.map((item) => (
              <div
                key={item.menu}
                onClick={() => pilihUntukEdit(item)}
                className="p-5 hover:bg-slate-50 transition cursor-pointer"
                title="Klik untuk mengedit menu ini"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-900 text-base">
                    {item.menu}
                  </span>
                  <span className="font-extrabold text-emerald-700 text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    {formatRp(item.harga)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.komposisi.map((k, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md"
                    >
                      {k.nama_bahan} ({k.jumlah})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
