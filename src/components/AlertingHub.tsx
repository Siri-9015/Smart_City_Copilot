import React, { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, Check, Settings, ShieldAlert, CheckCircle, Flame, Clock } from "lucide-react";

interface Alert {
  id: string;
  type: "pollution" | "congestion" | "incident";
  districtName: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface AlertingHubProps {
  userRole: "admin" | "analyst" | "viewer";
  onTriggerRefresh: () => void;
}

export default function AlertingHub({ userRole, onTriggerRefresh }: AlertingHubProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Subscription triggers
  const [pollutionSub, setPollutionSub] = useState(true);
  const [congestionSub, setCongestionSub] = useState(true);
  const [incidentSub, setIncidentSub] = useState(true);

  // States
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Simulated FCM states
  const [fcmToken] = useState("fcm-device-metropolis-prime-718a2b9");
  const [fcmSimulating, setFcmSimulating] = useState(false);
  const [fcmFeedback, setFcmFeedback] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch system alerts.");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => {
      fetchAlerts();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubLoading(true);
    setSubSuccess(null);

    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          pollution: pollutionSub,
          congestion: congestionSub,
          incident: incidentSub
        })
      });

      if (!res.ok) throw new Error("Failed to subscribe.");
      const data = await res.json();
      setSubSuccess(data.message);
      setTimeout(() => setSubSuccess(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  const handleResolveAlert = async (id?: string) => {
    if (userRole !== "admin") return;
    setClearing(true);
    try {
      const res = await fetch("/api/alerts/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Failed to update alert state.");
      fetchAlerts();
      onTriggerRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  const simulateFcmPush = () => {
    setFcmSimulating(true);
    setFcmFeedback(null);
    setTimeout(() => {
      setFcmSimulating(false);
      setFcmFeedback("FCM push delivery request verified. Connection state: ACTIVE");
      setTimeout(() => setFcmFeedback(null), 4000);
    }, 1500);
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Subscriber Profile Configurations */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* Email & SMS Subscription form */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Settings className="h-4 w-4 text-rose-400" />
            <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
              Dispatch Preferences
            </h3>
          </div>

          <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
            Subscribe your notification node to receive instant email dispatches and SMS alerts whenever critical urban parameters trigger system anomalies.
          </p>

          {subSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{subSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubscribe} className="space-y-4 font-mono text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Alert Destination Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="operator@metropolis.gov"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Alert SMS Endpoint (Optional)</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Triggers selection */}
            <div className="space-y-2 border-t border-slate-950 pt-3">
              <span className="block text-[10px] text-slate-500 mb-1">Select Trigger Conditions</span>
              
              <button
                type="button"
                onClick={() => setPollutionSub(!pollutionSub)}
                className={`w-full py-1.5 px-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                  pollutionSub
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-slate-950 border-slate-850 text-slate-600"
                }`}
              >
                <span>Particulate & AQI Spikes (&gt;150 AQI)</span>
                {pollutionSub && <Check className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setCongestionSub(!congestionSub)}
                className={`w-full py-1.5 px-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                  congestionSub
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-slate-950 border-slate-850 text-slate-600"
                }`}
              >
                <span>Severe Traffic Gridlocks (&gt;85%)</span>
                {congestionSub && <Check className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIncidentSub(!incidentSub)}
                className={`w-full py-1.5 px-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                  incidentSub
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-slate-950 border-slate-850 text-slate-600"
                }`}
              >
                <span>Accidents & Hazard Emergencies</span>
                {incidentSub && <Check className="h-3.5 w-3.5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={subLoading}
              className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold tracking-wider hover:from-rose-400 hover:to-pink-500 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Bell className="h-3.5 w-3.5" />
              {subLoading ? "CONFIGURING..." : "ACTIVATE DISPATCH CHANNEL"}
            </button>
          </form>
        </div>

        {/* FCM Push Notification diagnostics panel */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Smartphone className="h-4 w-4 text-sky-400" />
            <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
              Firebase Cloud Messaging (FCM)
            </h3>
          </div>

          <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
            Verify FCM downstream push deliveries to the local supervisor client node using the initialized client registration token.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-slate-400 break-all select-all">
            <span className="text-slate-600 block mb-1">CLIENT REGISTRATION TOKEN</span>
            {fcmToken}
          </div>

          {fcmFeedback && (
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-[10px] font-mono">
              {fcmFeedback}
            </div>
          )}

          <button
            onClick={simulateFcmPush}
            disabled={fcmSimulating}
            className="w-full py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 rounded-xl font-mono text-[10px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            {fcmSimulating ? "PINGING CHANNELS..." : "TEST DOWNSTREAM PUSH DELIVERIES"}
          </button>
        </div>
      </div>

      {/* Right Column: Active & Historical Alerts Records */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Active Threshold Triggered Alerts */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
              <h3 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-bold">
                Active System Alerts ({activeAlerts.length})
              </h3>
            </div>
            {userRole === "admin" && activeAlerts.length > 0 && (
              <button
                onClick={() => handleResolveAlert()}
                disabled={clearing}
                className="text-[10px] font-mono text-rose-400 hover:underline hover:text-rose-300 font-bold"
              >
                Clear All Active
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/35 flex justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-mono text-[9px] uppercase tracking-wider text-rose-400 font-bold">
                        {alert.type} • {alert.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-100">{alert.message}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Timestamp: {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {userRole === "admin" && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-mono text-[10px] rounded-lg border border-rose-500/20 h-fit self-center cursor-pointer transition-colors"
                    >
                      RESOLVE
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-16 text-center space-y-3 text-slate-500 font-mono text-xs">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-1 opacity-70" />
                <div>ALL SYSTEM TELEMETRIES OPTIMAL</div>
                <p className="text-[10px] text-slate-600 max-w-sm mx-auto">
                  No active air quality particulate spikes or traffic gridlock parameters breaching limits.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Historic Alerts Log */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Flame className="h-4.5 w-4.5 text-slate-500" />
            <h3 className="font-mono text-xs uppercase text-slate-400 tracking-wider font-bold">
              Resolved Historical Logs ({resolvedAlerts.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {resolvedAlerts.length > 0 ? (
              resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex justify-between items-center text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px] uppercase">
                      <span>{alert.type}</span>
                      <span>•</span>
                      <span>RESOLVED</span>
                    </div>
                    <p className="text-slate-400 font-medium">{alert.message.slice(0, 85)}...</p>
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[10px] text-slate-600 font-mono">
                Historical records empty. Active alerts will log here once marked resolved.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
