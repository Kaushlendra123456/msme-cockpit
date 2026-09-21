import { useEffect, useState, FormEvent } from "react";
import { DatabaseBackup } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const Settings = () => {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const [form, setForm] = useState({
    name: "",
    industryType: "",
    location: "",
    gstNumber: "",
    currency: "INR",
  });
  const [saved, setSaved] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState("");

  useEffect(() => {
    api.get("/business").then((res) =>
      setForm({
        name: res.data.name || "",
        industryType: res.data.industryType || "",
        location: res.data.location || "",
        gstNumber: res.data.gstNumber || "",
        currency: res.data.currency || "INR",
      })
    );
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.put("/business", form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupError("");
    try {
      const res = await api.get("/export/backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `msme-backup-${Date.now()}.dump`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setBackupError(
        err.response?.data?.message ||
          "Backup failed. Make sure the backend has pg_dump available (it's included in the production Docker image)."
      );
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Business Settings</h2>

      {isOwner ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          {[
            { key: "name", label: "Business Name" },
            { key: "industryType", label: "Industry Type" },
            { key: "location", label: "Location" },
            { key: "gstNumber", label: "GST Number" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium text-gray-700">{field.label}</label>
              <input
                value={(form as any)[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          <button
            type="submit"
            className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700"
          >
            Save Changes
          </button>
          {saved && <p className="text-sm text-emerald-600">Saved successfully.</p>}
        </form>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-500">Only the business Owner can edit business settings.</p>
        </div>
      )}

      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <DatabaseBackup size={18} className="text-brand-600" />
            <h3 className="font-semibold text-gray-800">Database Backup</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Download a full backup of your business database. Store it somewhere safe - this
            file can restore all your data if something goes wrong.
          </p>
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
          >
            {backingUp ? "Creating backup..." : "Download Backup"}
          </button>
          {backupError && <p className="text-sm text-red-600 mt-3">{backupError}</p>}
        </div>
      )}
    </div>
  );
};