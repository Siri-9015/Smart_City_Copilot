import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Sliders, Settings, Radio, AlertOctagon, Terminal, Send, CheckCircle, Database } from "lucide-react";

interface District {
  id: string;
  name: string;
}

interface IoTStreamSimulatorProps {
  userRole: "admin" | "analyst" | "viewer";
  districts: District[];
  onTriggerRefresh: () => void;
}

export default function IoTStreamSimulator({ userRole, districts, onTriggerRefresh }: IoTStreamSimulatorProps) {
  const [active, setActive] = useState(true);
  const [intervalVal, setIntervalVal] = useState(3000);
  const [drift, setDrift] = useState(0.5);
  const [scenario, setScenario] = useState("normal");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom ingestion fields
  const [ingestDistrict, setIngestDistrict] = useState(districts[0]?.id || "downtown");
  const [ingestMetric, setIngestMetric] = useState("trafficCongestion");
  const [ingestValue, setIngestValue] = useState("85");
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);

  // General operations status
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch current simulator state
  const fetchSimulatorStatus = async () => {
    try {
      const res = await fetch("/api/simulator/status");
      if (!res.ok) throw new Error("Could not fetch simulator state");
      const data = await res.json();
      setActive(data.simulationActive);
      setIntervalVal(data.simulationInterval);
      setDrift(data.simulationDrift);
      setScenario(data.simulationScenario);
      setLogs(data.simulationLogs || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSimulatorStatus();
    // Poll logs and status frequently
    const interval = setInterval(() => {
      fetchSimulatorStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Handle configuration changes
  const handleUpdateConfig = async (newActive?: boolean, newInterval?: number, newDrift?: number, newScenario?: string) => {
    if (userRole !== "admin") return;
    
    const payload = {
      active: newActive !== undefined ? newActive : active,
      interval: newInterval !== undefined ? newInterval : intervalVal,
      drift: newDrift !== undefined ? newDrift : drift,
      scenario: newScenario !== undefined ? newScenario : scenario
    };

    try {
      const res = await fetch("/api/simulator/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save simulation profile");
      const data = await res.json();
      setActive(data.config.simulationActive);
      setIntervalVal(data.config.simulationInterval);
      setDrift(data.config.simulationDrift);
      setScenario(data.config.simulationScenario);
      onTriggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Force trigger an anomaly
  const handleInjectAnomaly = async (type: string) => {
    if (userRole !== "admin") return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/simulator/anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to inject anomaly");
      const data = await res.json();
      setActionSuccess(data.message);
      onTriggerRefresh();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit manual ingestion packet (simulating ingestion endpoint / Kafka)
  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== "admin") return;
    setIngestLoading(true);
    setIngestSuccess(null);
    setIngestError(null);

    try {
      const res = await fetch("/api/simulator/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: ingestDistrict,
          metricType: ingestMetric,
          value: ingestValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ingestion pipeline failure");
      }

      const data = await res.json();
      setIngestSuccess(data.message);
      onTriggerRefresh();
      setTimeout(() => setIngestSuccess(null), 4000);
    } catch (err: any) {
      setIngestError(err.message || "Network ingestion pipeline timeout.");
    } finally {
      setIngestLoading(false);
    }
  };

  const isAdmin = userRole === "admin";

  return (
    <div className="space-y-6">
      {/* ReadOnly Warn Indicator */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl p-4 text-xs font-mono flex items-start gap-3 shadow-lg">
          <AlertOctagon className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold uppercase">Authorized Access Required</div>
            <div className="mt-1 opacity-80 leading-relaxed">
              Your active credential role <strong>({userRole.toUpperCase()})</strong> is mapped to read-only views. Simulator toggles, parameters configuration, custom data ingestion, and forced anomaly injections are locked to system administrators only.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Stream Configuration */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
              Simulator Config Profile
            </h3>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Play/Pause control */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pipeline Stream Status</span>
              <button
                disabled={!isAdmin}
                onClick={() => handleUpdateConfig(!active)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 font-bold cursor-pointer transition-all ${
                  active
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                } disabled:opacity-50`}
              >
                {active ? (
                  <>
                    <Play className="h-3.5 w-3.5 fill-emerald-400" /> ACTIVE
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-slate-500" /> PAUSED
                  </>
                )}
              </button>
            </div>

            {/* Ingestion Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Ingestion Frequency</span>
                <span className="text-sky-400 font-bold">{(intervalVal / 1000).toFixed(1)}s</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1000, 3000, 5000, 10000].map((ms) => (
                  <button
                    key={ms}
                    disabled={!isAdmin}
                    onClick={() => handleUpdateConfig(undefined, ms)}
                    className={`py-1 rounded-lg border text-[10px] text-center font-bold cursor-pointer transition-all ${
                      intervalVal === ms
                        ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                        : "bg-slate-950 border-slate-800/80 text-slate-500 hover:text-slate-300"
                    } disabled:opacity-50`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>

            {/* Signal Volatility */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Signal Volatility (Drift)</span>
                <span className="text-sky-400 font-bold">{Math.round(drift * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                disabled={!isAdmin}
                value={drift}
                onChange={(e) => handleUpdateConfig(undefined, undefined, parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>Stable</span>
                <span>Highly Volatile</span>
              </div>
            </div>

            {/* Environment Scenario Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-400">Urban Activity Profile</label>
              <select
                disabled={!isAdmin}
                value={scenario}
                onChange={(e) => handleUpdateConfig(undefined, undefined, undefined, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-sky-500/30 font-bold text-xs"
              >
                <option value="normal">Normal Baseline Flow</option>
                <option value="rush-hour">Downtown Rush Hour Jam</option>
                <option value="industrial-peak">Industrial Heavy Smog</option>
                <option value="hazard-leak">Silicon Valley Toxic Spill</option>
                <option value="sensor-storm">Telemetry Storm (Sensor Outages)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-Time Ingestion Logs Terminal */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
                IoT Ingestion Pipeline Stream Logs
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                Live Pipe Ingress
              </span>
            </div>
          </div>

          <div className="bg-black/80 border border-slate-950 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-[10.5px] text-emerald-400/90 space-y-1.5 scrollbar-thin">
            {logs.length > 0 ? (
              logs.map((log, index) => {
                let colorClass = "text-emerald-400/80";
                if (log.includes("[WARN]")) colorClass = "text-amber-400/95";
                if (log.includes("[ALERT]")) colorClass = "text-rose-400 font-bold";
                if (log.includes("[SYSTEM]")) colorClass = "text-sky-400 font-bold";
                if (log.includes("[INGEST-PIPELINE]")) colorClass = "text-indigo-400 font-medium";
                return (
                  <div key={index} className={colorClass}>
                    {log}
                  </div>
                );
              })
            ) : (
              <div className="text-slate-600 text-center py-24">
                No pipeline traffic monitored. Ensure the simulator is active.
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Custom Telemetry Packet Ingestion Form */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Database className="h-4 w-4 text-indigo-400" />
            <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
              Manual Ingestion Pipeline Tester
            </h3>
          </div>

          <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
            Test the system's real-time analytics by directly feeding custom metrics into the ingestion pipeline. Select the district node, specify the metric key, and dispatch the telemetry packet payload.
          </p>

          {ingestSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{ingestSuccess}</span>
            </div>
          )}

          {ingestError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
              {ingestError}
            </div>
          )}

          <form onSubmit={handleManualIngest} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Target District Node</label>
                <select
                  disabled={!isAdmin}
                  value={ingestDistrict}
                  onChange={(e) => setIngestDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name.split(" ")[0]} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Metric Schema Key</label>
                <select
                  disabled={!isAdmin}
                  value={ingestMetric}
                  onChange={(e) => setIngestMetric(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none"
                >
                  <option value="trafficCongestion">Traffic Congestion (%)</option>
                  <option value="vehicleCount">Vehicle Count (Count)</option>
                  <option value="averageSpeed">Average Speed (km/h)</option>
                  <option value="aqi">Air Quality Index (AQI)</option>
                  <option value="co2">Carbon Dioxide (ppm)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Ingress Payload Value</label>
              <div className="relative">
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={ingestValue}
                  onChange={(e) => setIngestValue(e.target.value)}
                  placeholder="e.g. 195"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!isAdmin || ingestLoading}
                  className="absolute right-1 top-1 bottom-1 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-[10px] font-bold tracking-wider hover:from-sky-400 hover:to-blue-500 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  INGEST
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Forced Anomaly Spikes */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900 mb-3">
              <Radio className="h-4 w-4 text-rose-500" />
              <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
                Telemetry Anomaly Stress Test
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-4">
              Simulate extreme, severe city events on the fly to pressure-test downstream alerting thresholds and rule triggers. Injected anomalies trigger urgent system toasts and push dispatches immediately.
            </p>

            {actionSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <button
              disabled={!isAdmin || actionLoading}
              onClick={() => handleInjectAnomaly("congestion_downtown")}
              className="w-full py-2.5 px-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-left rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Downtown Traffic gridlock Anomaly</span>
              <span className="text-[9px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">Congest 96%</span>
            </button>

            <button
              disabled={!isAdmin || actionLoading}
              onClick={() => handleInjectAnomaly("aqi_industrial")}
              className="w-full py-2.5 px-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-left rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Industrial Toxic Smog Emission Anomaly</span>
              <span className="text-[9px] bg-orange-500/20 px-1.5 py-0.5 rounded text-orange-300">AQI 210</span>
            </button>

            <button
              disabled={!isAdmin || actionLoading}
              onClick={() => handleInjectAnomaly("sensor_outage")}
              className="w-full py-2.5 px-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-left rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Severe Network Mesh Dropped Nodes</span>
              <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">Outage Spike</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
