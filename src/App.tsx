import { useState, useEffect, ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  Car,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  Info,
  LayoutDashboard,
  RefreshCw,
  Settings,
  ShieldAlert,
  Wind,
  Wrench,
  XCircle,
  Sliders,
  Bell,
  Shield,
  LogOut,
  AlertOctagon
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

import { CityState, District, Incident } from "./types";
import CityDigitalTwin from "./components/CityDigitalTwin";
import MetricCard from "./components/MetricCard";
import IncidentForm from "./components/IncidentForm";
import CopilotChat from "./components/CopilotChat";

// New modular components
import UserAuth from "./components/UserAuth";
import IoTStreamSimulator from "./components/IoTStreamSimulator";
import AlertingHub from "./components/AlertingHub";

export default function App() {
  const [cityState, setCityState] = useState<CityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<{ uid: string; email: string; role: "admin" | "analyst" | "viewer"; createdAt: string } | null>(() => {
    const saved = localStorage.getItem("metropolis_active_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<"overview" | "traffic" | "pollution" | "operations" | "copilot" | "reports" | "simulator" | "alerts">("overview");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Operations Report States
  const [isCompilingReport, setIsCompilingReport] = useState(false);
  const [compiledReport, setCompiledReport] = useState<string | null>(null);
  const [reportError, setReportReportError] = useState<string | null>(null);

  // Fetch Live Telemetry Data
  const fetchCityState = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/city/state");
      if (!res.ok) throw new Error("Failed to fetch smart city telemetry state.");
      const data: CityState = await res.json();
      setCityState(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while contacting the telemetry server.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCityState();

    // Auto-poll city state every 5 seconds to show simulation in action!
    const interval = setInterval(() => {
      fetchCityState(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Action to resolve an incident in real-time
  const handleResolveIncident = async (id: string) => {
    try {
      const res = await fetch("/api/city/incident/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Resolved" }),
      });
      if (!res.ok) throw new Error("Failed to resolve incident");
      fetchCityState(true);
    } catch (err) {
      console.error("Error resolving incident:", err);
    }
  };

  // Action to mark as dispatching responders
  const handleDispatchResponders = async (id: string) => {
    try {
      const res = await fetch("/api/city/incident/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Responding" }),
      });
      if (!res.ok) throw new Error("Failed to dispatch responders");
      fetchCityState(true);
    } catch (err) {
      console.error("Error dispatching responders:", err);
    }
  };

  // Compile Executive Advisory Report using server-side Gemini
  const generateOperationsReport = async () => {
    setIsCompilingReport(true);
    setReportReportError(null);
    setCompiledReport(null);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Generate a highly formal and professional Executive Urban Management Report of Metropolis Prime. Structure it as follows:\n1. EXECUTIVE SUMMARY\n2. DISTRICT PERFORMANCE & TELEMETRY BREAKDOWN (cite actual live metrics of downtown, port, etc.)\n3. ACTIVE CONGESTION & HAZARD ASSESSMENTS\n4. GREEN URBAN ADVISORY RECOMMENDATIONS. Format beautifully with bullet points, numbered lists, and bold headers.",
          chatHistory: []
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate report.");
      }

      const data = await res.json();
      setCompiledReport(data.reply);
    } catch (err: any) {
      console.error(err);
      setReportReportError(err.message || "An unexpected error occurred while compiling the report.");
    } finally {
      setIsCompilingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-3 font-mono">
        <LoaderSpinner className="h-8 w-8 text-sky-400 animate-spin" />
        <span className="text-xs uppercase tracking-widest text-slate-500">Initializing UrbanMind OS...</span>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <UserAuth
          user={null}
          onLogin={(u) => {
            setActiveUser(u);
            localStorage.setItem("metropolis_active_user", JSON.stringify(u));
          }}
          onLogout={() => {}}
        />
      </div>
    );
  }

  const { districts = [], incidents = [] } = cityState || {};

  // Compute live KPIs
  const activeIncidents = incidents.filter((i) => i.status !== "Resolved");
  const criticalIncidentsCount = activeIncidents.filter((i) => i.severity === "Critical" || i.severity === "High").length;
  
  const avgCongestion = districts.length
    ? Math.round(districts.reduce((sum, d) => sum + d.trafficCongestion, 0) / districts.length)
    : 0;

  const peakCongestionDistrict = districts.length
    ? districts.reduce((prev, current) => (prev.trafficCongestion > current.trafficCongestion ? prev : current))
    : null;

  const worstAqiDistrict = districts.length
    ? districts.reduce((prev, current) => (prev.aqi > current.aqi ? prev : current))
    : null;

  const totalSensors = districts.reduce((sum, d) => sum + d.totalSensors, 0);
  const activeSensors = districts.reduce((sum, d) => sum + d.activeSensors, 0);
  const sensorHealthRatio = totalSensors ? Math.round((activeSensors / totalSensors) * 100) : 0;

  // Find selected district info if clicked on the map or list
  const selectedDistrict = selectedDistrictId
    ? districts.find((d) => d.districtId === selectedDistrictId)
    : null;

  // Pollutants distribution for charts
  const chartDataDistricts = districts.map((d) => ({
    name: d.name.split(" ")[0],
    congestion: d.trafficCongestion,
    speed: d.averageSpeed,
    aqi: d.aqi,
    co2: d.co2,
    pm25: d.pm25,
    no2: d.no2,
  }));

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 p-6 flex flex-col gap-4 overflow-hidden font-sans select-none antialiased selection:bg-sky-500/20 selection:text-sky-300">
      
      {/* Critical Emergency Banner */}
      <AnimatePresence>
        {criticalIncidentsCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-950/60 border border-rose-500/30 rounded-2xl text-rose-300 px-4 py-2 text-xs font-mono flex items-center justify-between gap-4 shrink-0"
          >
            <div className="flex items-center gap-2 animate-pulse">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <span>
                <strong>SYSTEM ALERT:</strong> {criticalIncidentsCount} High/Critical priority incidents are active. Urban flows affected.
              </span>
            </div>
            <button
              onClick={() => setActiveTab("operations")}
              className="underline hover:text-white font-bold transition-all text-[11px] uppercase tracking-wider"
            >
              Open Operations Console
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className="bg-slate-900/50 border border-slate-800/80 rounded-2xl px-6 py-4 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-lg shadow-lg shadow-sky-950/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-2">
              Smart City AI
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold font-mono tracking-widest border border-slate-700/50">
                v2.1-Twin
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight">
              Metropolis Prime Operational Telemetry Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User profile capsule */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400 font-medium truncate max-w-[140px]">{activeUser.email}</span>
            <span className={`text-[8.5px] px-1 py-0.2 rounded font-bold uppercase ${
              activeUser.role === "admin"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                : activeUser.role === "analyst"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}>
              {activeUser.role}
            </span>
            <button
              onClick={() => {
                setActiveUser(null);
                localStorage.removeItem("metropolis_active_user");
              }}
              className="ml-1 p-1 hover:text-rose-400 transition-colors cursor-pointer"
              title="Revoke Credentials / Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {isRefreshing ? (
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Syncing Datastore...</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-600 font-mono">
              Last Telemetry Ping: {new Date().toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={() => fetchCityState()}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-50 cursor-pointer"
            title="Force Poll Telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Content Container */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-64 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between shrink-0 font-mono shadow-lg backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-600 uppercase tracking-widest px-3 font-bold block mb-2">
                Operational Modules
              </span>
              <TabButton
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="System Overview"
              />
              <TabButton
                active={activeTab === "traffic"}
                onClick={() => setActiveTab("traffic")}
                icon={<Car className="h-4 w-4" />}
                label="Traffic Analytics"
              />
              <TabButton
                active={activeTab === "pollution"}
                onClick={() => setActiveTab("pollution")}
                icon={<Wind className="h-4 w-4" />}
                label="Pollution Forecast"
              />
              <TabButton
                active={activeTab === "operations"}
                onClick={() => setActiveTab("operations")}
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Decision Support"
                badge={activeIncidents.length > 0 ? activeIncidents.length : undefined}
              />
              <TabButton
                active={activeTab === "simulator"}
                onClick={() => setActiveTab("simulator")}
                icon={<Sliders className="h-4 w-4 text-emerald-400" />}
                label="IoT Simulator"
              />
              <TabButton
                active={activeTab === "alerts"}
                onClick={() => setActiveTab("alerts")}
                icon={<Bell className="h-4 w-4 text-rose-400" />}
                label="Alerting Hub"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-600 uppercase tracking-widest px-3 font-bold block mb-2">
                Generative AI Suite
              </span>
              <TabButton
                active={activeTab === "copilot"}
                onClick={() => setActiveTab("copilot")}
                icon={<Bot className="h-4 w-4 text-sky-400" />}
                label="Gemini Copilot"
              />
              <TabButton
                active={activeTab === "reports"}
                onClick={() => setActiveTab("reports")}
                icon={<FileText className="h-4 w-4 text-indigo-400" />}
                label="AI Advisory Reports"
              />
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="h-3.5 w-3.5 stroke-slate-500" />
              <span className="font-bold">System Status: OK</span>
            </div>
            <div className="text-slate-500 leading-normal">
              Integrated with @google/genai. Telemetry streams powered by simulated neural controllers.
            </div>
          </div>
        </nav>

        {/* Main Panel Viewport */}
        <main className="flex-1 overflow-y-auto pr-1">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 mb-6 flex items-start gap-3 font-mono text-xs shadow-xl">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold uppercase tracking-wider text-rose-300">Telemetry Server Offline</div>
                <div className="mt-1">{error}</div>
              </div>
            </div>
          )}

          {/* VIEW CONTROLLER */}
          <div className="space-y-6">
            
            {/* OVERVIEW MODULE */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Dashboard Key Metric Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <MetricCard
                    title="Average Traffic Congestion"
                    value={`${avgCongestion}%`}
                    subtitle={`Peak: ${peakCongestionDistrict?.name.split(" ")[0]} (${peakCongestionDistrict?.trafficCongestion}%)`}
                    icon={<Car className="h-4 w-4" />}
                    color="sky"
                    trend={{ value: `${avgCongestion > 50 ? "Heavy Load" : "Stable Flow"}`, isPositive: avgCongestion < 50 }}
                  />
                  <MetricCard
                    title="Average City AQI"
                    value={worstAqiDistrict ? worstAqiDistrict.aqi : 0}
                    subtitle={`Worst: ${worstAqiDistrict?.name.split(" ")[0]} (${worstAqiDistrict?.aqi} AQI)`}
                    icon={<Wind className="h-4 w-4" />}
                    color={worstAqiDistrict && worstAqiDistrict.aqi > 100 ? "amber" : "emerald"}
                    trend={worstAqiDistrict ? { value: worstAqiDistrict.aqi > 150 ? "Unhealthy" : worstAqiDistrict.aqi > 100 ? "Sensitive" : "Good", isPositive: worstAqiDistrict.aqi < 100 } : undefined}
                  />
                  <MetricCard
                    title="Active Alerts"
                    value={activeIncidents.length}
                    subtitle={`${incidents.filter(i => i.status === "Responding").length} dispatch vehicles responding`}
                    icon={<ShieldAlert className="h-4 w-4" />}
                    color={activeIncidents.length > 0 ? "rose" : "sky"}
                    trend={activeIncidents.length > 0 ? { value: "Action Required", isPositive: false } : { value: "All Clear", isPositive: true }}
                  />
                  <MetricCard
                    title="IoT Sensor Health"
                    value={`${sensorHealthRatio}%`}
                    subtitle={`${activeSensors} of ${totalSensors} monitors online`}
                    icon={<Activity className="h-4 w-4" />}
                    color="indigo"
                    trend={{ value: "Calibration OK", isPositive: true }}
                  />
                </div>

                {/* Digital Twin Map + Specific District Inspector split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Digital Twin Map View */}
                  <div className="lg:col-span-2">
                    <CityDigitalTwin
                      districts={districts}
                      selectedDistrictId={selectedDistrictId}
                      onSelectDistrict={setSelectedDistrictId}
                      hoveredDistrictId={hoveredDistrictId}
                      onHoverDistrict={setHoveredDistrictId}
                    />
                  </div>

                  {/* Right Column: District Details Inspector / Active Incidents */}
                  <div className="space-y-6">
                    {/* District Inspector Box */}
                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-sky-400" />
                          <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider">
                            Zone Inspector
                          </h3>
                        </div>
                        {selectedDistrictId && (
                          <button
                            onClick={() => setSelectedDistrictId(null)}
                            className="text-[10px] font-mono text-slate-500 hover:text-sky-400"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {selectedDistrict ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-100">{selectedDistrict.name}</span>
                            <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                              Zone: {selectedDistrict.districtId.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg">
                              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">CONGESTION</span>
                              <span className={`text-base font-bold ${selectedDistrict.trafficCongestion > 70 ? "text-red-400" : selectedDistrict.trafficCongestion > 45 ? "text-amber-400" : "text-emerald-400"}`}>
                                {selectedDistrict.trafficCongestion}%
                              </span>
                            </div>
                            <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg">
                              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">AQI INDEX</span>
                              <span className={`text-base font-bold ${selectedDistrict.aqi > 150 ? "text-red-400" : selectedDistrict.aqi > 100 ? "text-amber-400" : "text-emerald-400"}`}>
                                {selectedDistrict.aqi}
                              </span>
                            </div>
                            <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg">
                              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">FLOW VELOCITY</span>
                              <span className="text-base font-bold text-slate-200">
                                {selectedDistrict.averageSpeed} <span className="text-[10px] text-slate-500">km/h</span>
                              </span>
                            </div>
                            <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg">
                              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">CO2 LEVEL</span>
                              <span className="text-base font-bold text-slate-200">
                                {selectedDistrict.co2} <span className="text-[10px] text-slate-500">ppm</span>
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs border-t border-slate-900 pt-3">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Active Vehicles:</span>
                              <span className="font-mono font-bold text-slate-200">{selectedDistrict.vehicleCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Heavy Truck Ratio:</span>
                              <span className="font-mono font-bold text-slate-200">{selectedDistrict.heavyVehicleRatio}%</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Acoustic Profile:</span>
                              <span className="font-mono font-bold text-slate-200">{selectedDistrict.noiseLevel} dBA</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Telemetry Grid Status:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {selectedDistrict.activeSensors}/{selectedDistrict.totalSensors} Online
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-600 font-mono">
                          <Info className="h-5 w-5 mx-auto mb-2 opacity-50" />
                          Click a zone on the twin map or district matrix above to inspect live telemetries.
                        </div>
                      )}
                    </div>

                    {/* Quick Incident Log List */}
                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-rose-500" />
                          <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider">
                            Active Incidents ({activeIncidents.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab("operations")}
                          className="text-[10px] font-mono text-sky-400 hover:underline"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {activeIncidents.length > 0 ? (
                          activeIncidents.map((inc) => (
                            <div
                              key={inc.id}
                              className="p-2.5 bg-slate-900/60 border border-slate-900 hover:border-slate-800 transition-colors rounded-lg flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    inc.severity === "Critical" ? "bg-red-500 animate-ping" : inc.severity === "High" ? "bg-amber-500" : "bg-blue-500"
                                  }`} />
                                  <span className="font-bold text-slate-200 truncate">{inc.type}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{inc.location}</div>
                              </div>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                inc.severity === "Critical" ? "bg-red-950/80 border border-red-500/20 text-red-400" : "bg-slate-950 border border-slate-800 text-slate-500"
                              }`}>
                                {inc.severity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-600 font-mono">
                            <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-emerald-500 opacity-60" />
                            No active incident blockages.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRAFFIC MODULE */}
            {activeTab === "traffic" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Traffic Volume Comparison Chart */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                    <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-4">
                      District Congestion Level (%)
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataDistricts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.1)" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
                            labelStyle={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          />
                          <Bar dataKey="congestion" name="Congestion Level (%)" fill="url(#barColor)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Flow Speed Analysis Chart */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                    <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-4">
                      Average Speed Velocity (km/h) vs Vehicle Density
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartDataDistricts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.1)" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
                            labelStyle={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          />
                          <Area type="monotone" dataKey="speed" name="Avg Velocity (km/h)" stroke="#818cf8" strokeWidth={2} fill="url(#areaColor)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Vehicle Class Distribution Info */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300 md:col-span-2 flex flex-col justify-between">
                    <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-2">
                      Heavy vs Light Vehicle Flow Analysis
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mb-4">
                      Analyzing diesel emissions ratio by calculating the total heavy commercial cargo trucks against light passenger commuter fleets.
                    </p>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                      {districts.map((d) => (
                        <div key={d.id} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{d.name}</span>
                            <span className="text-slate-500">Heavy Trucks: {d.heavyVehicleRatio}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${d.heavyVehicleRatio}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Recommendations Box */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4.5 w-4.5 text-sky-400" />
                        <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider">
                          Traffic Dispatch Advices
                        </h3>
                      </div>
                      <div className="space-y-3 text-xs text-slate-400 leading-relaxed font-sans">
                        <div className="flex gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                          <p>
                            <strong>Downtown bottleneck:</strong> Commute gridlock detected at Grand Avenue. Recommend utilizing residential bypass arteries.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                          <p>
                            <strong>Heavy Freight:</strong> Truck emissions are rising at South Dock. Dynamic signal adjustment requested.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("copilot")}
                      className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded py-2 font-mono text-[11px] font-bold transition-all text-center cursor-pointer"
                    >
                      Ask Copilot to optimize signals
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* POLLUTION MODULE */}
            {activeTab === "pollution" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PM2.5 particulate matters graph */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                    <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-4">
                      PM2.5 Micro-Particulate Dust Concentration (µg/m³)
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataDistricts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="pmColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.1)" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
                            labelStyle={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          />
                          <Bar dataKey="pm25" name="PM2.5 (ug/m3)" fill="url(#pmColor)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CO2 Emissions trends */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                    <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-4">
                      Carbon Dioxide Levels Trend Profile (ppm)
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataDistricts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.1)" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[300, 800]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
                            labelStyle={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          />
                          <Line type="monotone" dataKey="co2" name="CO2 Concentration (ppm)" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* EPA AQI Category Index */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                  <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-3">
                    EPA Air Quality Index (AQI) Standard Legend
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-400">
                      <div className="font-bold">Good (0-50)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Satisfactory. Safe.</div>
                    </div>
                    <div className="p-2.5 rounded bg-yellow-950/20 border border-yellow-500/20 text-yellow-400">
                      <div className="font-bold">Moderate (51-100)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Acceptable. Minor risk.</div>
                    </div>
                    <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-amber-400">
                      <div className="font-bold">Sensitive (101-150)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Unhealthy for sensitive.</div>
                    </div>
                    <div className="p-2.5 rounded bg-orange-950/20 border border-orange-500/20 text-orange-400">
                      <div className="font-bold">Unhealthy (151-200)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Widespread effects.</div>
                    </div>
                    <div className="p-2.5 rounded bg-red-950/20 border border-red-500/20 text-red-400">
                      <div className="font-bold">V. Unhealthy (201-300)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Emergency conditions.</div>
                    </div>
                    <div className="p-2.5 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300">
                      <div className="font-bold">Hazardous (301+)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Severe health alert.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DECISION SUPPORT / OPERATIONS CONSOLE */}
            {activeTab === "operations" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Interactive Form to Simulate New Incident */}
                  <div>
                    {activeUser.role === "admin" ? (
                      <IncidentForm districts={districts} onSuccess={() => fetchCityState(true)} />
                    ) : (
                      <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm text-xs font-mono text-slate-400 space-y-3">
                        <div className="text-amber-500 font-bold uppercase flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          Dispatcher Access Restricted
                        </div>
                        <p className="leading-relaxed">
                          Only registered <strong>System Administrators</strong> are authorized to trigger manual emergency incident dispatches.
                        </p>
                        <p className="leading-relaxed text-[11px] text-slate-500">
                          Your current active role is: <strong className="uppercase text-sky-400">{activeUser.role}</strong>. Elevate privileges to run dispatch stress tests.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Active Incidents Dispatch board */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                      <h3 className="font-mono text-xs uppercase text-slate-300 tracking-wider mb-4">
                        Active Emergency Dispatch logs ({activeIncidents.length})
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-400 font-mono">
                          <thead className="bg-slate-900/60 text-slate-300 border-b border-slate-900">
                            <tr>
                              <th className="p-3">Type</th>
                              <th className="p-3">Severity</th>
                              <th className="p-3">District</th>
                              <th className="p-3">Location</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {activeIncidents.length > 0 ? (
                              activeIncidents.map((inc) => (
                                <tr key={inc.id} className="hover:bg-slate-900/10">
                                  <td className="p-3 font-bold text-slate-200">{inc.type}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                      inc.severity === "Critical"
                                        ? "bg-red-950/80 border border-red-500/20 text-red-400"
                                        : inc.severity === "High"
                                        ? "bg-amber-950/80 border border-amber-500/20 text-amber-400"
                                        : "bg-slate-900 border border-slate-800 text-slate-400"
                                    }`}>
                                      {inc.severity}
                                    </span>
                                  </td>
                                  <td className="p-3 truncate max-w-[120px]">
                                    {districts.find(d => d.districtId === inc.districtId)?.name.split(" ")[0]}
                                  </td>
                                  <td className="p-3 truncate max-w-[150px]">{inc.location}</td>
                                  <td className="p-3">
                                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                                      inc.status === "Responding" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse"
                                    }`}>
                                      {inc.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right space-x-1.5">
                                    {activeUser.role === "admin" ? (
                                      <>
                                        {inc.status === "Active" && (
                                          <button
                                            onClick={() => handleDispatchResponders(inc.id)}
                                            className="bg-sky-950 hover:bg-sky-900 text-sky-400 border border-sky-500/20 text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                                          >
                                            Dispatch
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleResolveIncident(inc.id)}
                                          className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                                        >
                                          Resolve
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-slate-600 italic">No Dispatch Auth</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-600">
                                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-50" />
                                  All municipal operations are functioning smoothly. No active incidents.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI COPILOT MODULE */}
            {activeTab === "copilot" && (
              <div className="space-y-6">
                <CopilotChat districts={districts} incidents={incidents} />
              </div>
            )}

            {/* EXECUTIVE REPORTS MODULE */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                {activeUser.role === "viewer" ? (
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-3 backdrop-blur-sm text-center py-20 font-mono text-xs text-slate-500">
                    <AlertOctagon className="h-8 w-8 text-amber-500 mx-auto mb-1 opacity-70" />
                    <div className="font-bold text-slate-300 uppercase tracking-wider">Advisory Access Denied</div>
                    <p className="max-w-md mx-auto leading-relaxed">
                      Your current Public Viewer credential tier does not have authorization to compile AI executive advisory insights. Please log out and authenticate as an <strong>Analyst</strong> or <strong>Admin</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-400" />
                        <div>
                          <h2 className="font-mono text-xs uppercase text-slate-100 tracking-widest font-bold">
                            Generative Operations & Advisory Report
                          </h2>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Analyze the entire city datastore dynamically and draft an expert executive report.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={generateOperationsReport}
                        disabled={isCompilingReport}
                        className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 border border-indigo-500 rounded px-4 py-2 font-mono text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-950/25"
                      >
                        {isCompilingReport ? (
                          <>
                            <LoaderSpinner className="h-3.5 w-3.5 animate-spin" />
                            Analyzing Telemetry...
                          </>
                        ) : (
                          <>
                            <Bot className="h-4 w-4" />
                            Compile AI Advisory Report
                          </>
                        )}
                      </button>
                    </div>

                    {/* Render Compiled Report Block */}
                    {isCompilingReport && (
                      <div className="py-16 text-center space-y-3 font-mono">
                        <LoaderSpinner className="h-8 w-8 text-indigo-400 mx-auto animate-spin" />
                        <div className="text-xs text-slate-400 uppercase tracking-widest">
                          Interrogating Sensor Repositories...
                        </div>
                        <p className="text-[10px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                          The AI Copilot is collecting district congestion parameters, particulate indices, active incident dispatches, and generating policy directives. Please wait, this takes approximately 10 seconds.
                        </p>
                      </div>
                    )}

                    {reportError && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Report Compilation Failed</div>
                          <div className="mt-1">{reportError}</div>
                        </div>
                      </div>
                    )}

                    {compiledReport && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 bg-slate-900/30 border border-slate-900 rounded-xl text-xs leading-relaxed font-sans max-h-[450px] overflow-y-auto"
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-slate-900 pb-3 mb-4">
                          <span>METROPOLIS PRIME OPERATIONS REPORT</span>
                          <span>COMPILED: {new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="prose prose-invert max-w-none text-slate-300 font-sans space-y-4 whitespace-pre-wrap">
                          {compiledReport}
                        </div>
                      </motion.div>
                    )}

                    {!isCompilingReport && !compiledReport && !reportError && (
                      <div className="py-16 text-center text-xs text-slate-600 font-mono">
                        <FileText className="h-8 w-8 mx-auto mb-3 opacity-30 text-indigo-400" />
                        Ready to compile. Click "Compile AI Advisory Report" above to trigger.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* IOT SIMULATION MODULE */}
            {activeTab === "simulator" && (
              <div className="space-y-6">
                <IoTStreamSimulator
                  userRole={activeUser.role}
                  districts={districts}
                  onTriggerRefresh={() => fetchCityState(true)}
                />
              </div>
            )}

            {/* ALERTING HUB MODULE */}
            {activeTab === "alerts" && (
              <div className="space-y-6">
                <AlertingHub
                  userRole={activeUser.role}
                  onTriggerRefresh={() => fetchCityState(true)}
                />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-Component UI Builders
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: number;
}

function TabButton({ active, onClick, icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all text-left cursor-pointer ${
        active
          ? "bg-slate-900 border border-slate-800 text-slate-100 font-bold shadow-lg"
          : "text-slate-500 hover:bg-slate-900/40 hover:text-slate-300"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={active ? "text-sky-400" : "text-slate-500"}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className="h-4.5 min-w-4.5 px-1 bg-rose-600 text-slate-100 text-[9px] font-bold rounded-full flex items-center justify-center border border-rose-500">
          {badge}
        </span>
      )}
    </button>
  );
}

// Local helper to draw a modern loading indicator
function LoaderSpinner({ className, ...props }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
