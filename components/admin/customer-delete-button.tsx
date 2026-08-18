"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

export function CustomerDeleteButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remove = async () => {
    if (!window.confirm(`${customerName} tam silinsin? Docker sistemi, lokal enerji bazası, giriş tokenləri və portal məlumatları geri qaytarılmayacaq.`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/provisioning/customers/${encodeURIComponent(customerId)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Silinmə başladılmadı.");
      window.location.reload();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Silinmə başladılmadı.");
      setBusy(false);
    }
  };
  return <div className="customer-delete-wrap">
    <button className="customer-delete-button" type="button" onClick={remove} disabled={busy}>
      {busy ? <Loader2 className="spin" size={13} /> : <Trash2 size={13} />} Sil
    </button>
    {error && <small>{error}</small>}
  </div>;
}
