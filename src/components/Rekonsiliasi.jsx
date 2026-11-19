import { useState } from "react";
import {
  Trash2,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function Rekonsiliasi({
  apiUrl,
  riwayat,
  formatRp,
  onSuccess,
}) {
  const [filterPlatform, setFilterPlatform] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [notif, setNotif] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filteredData = riwayat.filter((row) => {
    const matchPlatform =
      filterPlatform === "Semua" || row.platform === filterPlatform;
    const matchTanggal =
      !filterTanggal || (row.waktu && row.waktu.startsWith(filterTanggal));
    return matchPlatform && matchTanggal;
  });

  const totKotor = filteredData.reduce((s, r) => s + r.harga_kotor, 0);
  const totPotongan = filteredData.reduce((s, r) => s + r.potongan, 0);
  const totBersih = filteredData.reduce((s, r) => s + r.omset_bersih, 0);

  const handleHapus = async (row) => {
    const ok = window.confirm(
      `Hapus transaksi #${row.id} (${row.menu} - ${formatRp(
        row.harga_kotor
      )})?\nStok bahan baku akan otomatis dikembalikan.`
    );
    if (!ok) return;

    setDeletingId(row.id);
    setNotif(null);

    try {
      const res = await fetch(`${apiUrl}/hapus-pesanan/${row.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotif({
          type: "success",
          text: data.pesan || "Transaksi dihapus & stok dikembalikan.",
        });
        onSuccess();
      } else {
        setNotif({
          type: "error",
          text: data.detail || "Gagal menghapus transaksi.",
        });
      }
    } catch {
      setNotif({ type: "error", text: "Koneksi ke Backend API terputus." });
    } finally {
      setDeletingId(null);
    }
  };

  const uniquePlatforms = [
    "Semua",
    ...Array.from(new Set(riwayat.map((r) => r.platform))),
  ];

  return (
    <div className="space-y-6">
      {/* FILTER & RINGKASAN */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Rekonsiliasi & Audit Transaksi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cocokkan pencairan dana platform atau batalkan transaksi yang salah input.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              >
                {uniquePlatforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              />
              {filterTanggal && (
                <button
                  onClick={() => setFilterTanggal("")}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RINGKASAN HASIL FILTER */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-semibold text-slate-500">Jumlah Order</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {filteredData.length} pesanan
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-semibold text-slate-500">Omset Kotor</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {formatRp(totKotor)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/60">
            <p className="text-xs font-semibold text-rose-600">Total Potongan</p>
            <p className="text-xl font-extrabold text-rose-700 mt-1">
              -{formatRp(totPotongan)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <p className="text-xs font-semibold text-emerald-700">
              Estimasi Cair (Bersih)
            </p>
            <p className="text-xl font-extrabold text-emerald-800 mt-1">
              {formatRp(totBersih)}
            </p>
          </div>
        </div>

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

      {/* TABEL RIWAYAT PESANAN */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm font-medium">
            Tidak ada transaksi yang cocok dengan filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3.5 px-5 font-bold">ID & Waktu</th>
                  <th className="py-3.5 px-5 font-bold">Platform</th>
                  <th className="py-3.5 px-5 font-bold">Menu</th>
                  <th className="py-3.5 px-5 font-bold">Kotor</th>
                  <th className="py-3.5 px-5 font-bold">Potongan</th>
                  <th className="py-3.5 px-5 font-bold">Bersih</th>
                  <th className="py-3.5 px-5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900">#{row.id}</span>
                      <p className="text-xs text-slate-500">{row.waktu}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                        {row.platform}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {row.menu}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-700">
                      {formatRp(row.harga_kotor)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-rose-600">
                      -{formatRp(row.potongan)}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-emerald-700">
                      {formatRp(row.omset_bersih)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleHapus(row)}
                        disabled={deletingId === row.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === row.id ? "..." : "Hapus"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
