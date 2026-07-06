import { useState, FormEvent } from "react";
import { AlertCircle, PlusCircle, ShieldAlert } from "lucide-react";
import { District } from "../types";

interface IncidentFormProps {
  districts: District[];
  onSuccess: () => void;
}

export default function IncidentForm({ districts, onSuccess }: IncidentFormProps) {
  const [type, setType] = useState<"Accident" | "Congestion" | "Roadworks" | "Sensor Failure" | "Hazardous Leak">("Accident");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [location, setLocation] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Set default districtId once loaded
  if (!districtId && districts.length > 0) {
    setDistrictId(districts[0].districtId);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      setError("Please fill in all description and location fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/city/incident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type,
          severity,
          location,
          districtId,
          description
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to trigger incident");
      }

      setSuccessMsg("Incident deployed successfully! City telemetry recalculated in real-time.");
      setLocation("");
      setDescription("");
      onSuccess();

      // Clear success after 4s
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-5 w-5 text-rose-500" />
        <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider">
          Incident Dispatch & Simulation Console
        </h3>
      </div>
      <p className="text-[11px] text-slate-400 mb-4 font-mono">
        Manually dispatch alerts or simulate critical urban events. Telemetry models will instantly recalculate average speeds, traffic flow, and AQI indices based on your parameters.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Incident Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:border-rose-500 focus:outline-none font-mono"
            >
              <option value="Accident">Accident</option>
              <option value="Congestion">Congestion</option>
              <option value="Roadworks">Roadworks</option>
              <option value="Sensor Failure">Sensor Failure</option>
              <option value="Hazardous Leak">Hazardous Leak</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:border-rose-500 focus:outline-none font-mono"
            >
              <option value="Low">Low (Green-Code)</option>
              <option value="Medium">Medium (Yellow-Code)</option>
              <option value="High">High (Amber-Code)</option>
              <option value="Critical">Critical (Red-Code)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Target District</label>
            <select
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:border-rose-500 focus:outline-none font-mono"
            >
              {districts.map((d) => (
                <option key={d.districtId} value={d.districtId}>
                  {d.name.split(" ")[0]} ({d.name.split(" ").slice(1).join(" ")})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Specific Location</label>
            <input
              type="text"
              placeholder="e.g. Exit 12, Grand Highway"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:border-rose-500 focus:outline-none font-mono placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Description & Operations Note</label>
          <textarea
            rows={2}
            placeholder="Describe the nature of the blockage, hazard, or malfunction..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:border-rose-500 focus:outline-none font-mono placeholder:text-slate-600 resize-none"
          />
        </div>

        {error && (
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[11px] flex items-start gap-1.5 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px] flex items-start gap-1.5 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rose-600 hover:bg-rose-500 text-slate-100 rounded py-2 font-mono font-bold transition-all flex items-center justify-center gap-1.5 border border-rose-500 shadow-lg shadow-rose-950/20 disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          {isSubmitting ? "Recalculating City Matrices..." : "Dispatch Alert & Inject Simulation"}
        </button>
      </form>
    </div>
  );
}
