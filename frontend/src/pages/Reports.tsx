import React, { useEffect, useState } from "react";
import client from "../api/client";
import { Download, FileText } from "lucide-react";
type ReportT = { id: number; period: string; format: string; file_path: string; generated_at: string };

export default function Reports() {
  const [reports, setReports] = useState<ReportT[]>([]);
  const [period, setPeriod] = useState("daily");
  const [format, setFormat] = useState("pdf");
  const [busy, setBusy] = useState(false);

  function load() {
    client.get("/reports").then((r) => setReports(r.data));
  }
  useEffect(load, []);

  async function generate() {
    setBusy(true);
    try {
      await client.post("/reports/generate", { period, format });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="bg-panel border border-border rounded p-4 mb-6 flex items-end gap-4">
        <div>
          <label className="text-xs text-muted block mb-1">Period</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-panelAlt border border-border rounded px-3 py-2 text-sm">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-panelAlt border border-border rounded px-3 py-2 text-sm">
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>
        <button onClick={generate} disabled={busy} className="bg-cyan text-bg font-semibold rounded px-4 py-2 text-sm">
          {busy ? "Generating…" : "Generate report"}
        </button>
      </div>

      <div className="bg-panel border border-border rounded divide-y divide-border">
        {reports.map((r) => (
          <div key={r.id} className="p-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-cyan" />
              <div>
                <div className="font-medium">{r.period.toUpperCase()} report ({r.format.toUpperCase()})</div>
                <div className="text-[11px] text-muted">{new Date(r.generated_at).toLocaleString()}</div>
              </div>
            </div>
            <a href={`/api/reports/${r.id}/download`} className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:border-cyan hover:text-cyan">
              <Download size={12} /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
