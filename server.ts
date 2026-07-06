import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    let apiKey = process.env.GEMINI_API_KEY;
    // Fall back to the user's provided key if not set in environment or equals template placeholder
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      apiKey = "AIzaSyBTGSiuLGD4NI6ECYNmftxIhfyZa_hpVbk";
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-memory Smart City Simulation State
interface District {
  id: string;
  name: string;
  trafficCongestion: number; // 0 to 100
  vehicleCount: number;
  averageSpeed: number; // km/h
  heavyVehicleRatio: number; // %
  aqi: number; // Air Quality Index
  co2: number; // ppm
  pm25: number; // µg/m³
  no2: number; // ppb
  noiseLevel: number; // dBA
  activeSensors: number;
  totalSensors: number;
}

interface Incident {
  id: string;
  type: "Accident" | "Congestion" | "Roadworks" | "Sensor Failure" | "Hazardous Leak";
  severity: "Low" | "Medium" | "High" | "Critical";
  location: string;
  districtId: string;
  timestamp: string;
  description: string;
  status: "Active" | "Responding" | "Resolved";
}

let districts: District[] = [
  {
    id: "downtown",
    name: "Downtown Commercial Core",
    trafficCongestion: 78,
    vehicleCount: 1420,
    averageSpeed: 22,
    heavyVehicleRatio: 8,
    aqi: 142, // Unhealthy for Sensitive Groups
    co2: 520,
    pm25: 45.5,
    no2: 82,
    noiseLevel: 72,
    activeSensors: 14,
    totalSensors: 15
  },
  {
    id: "industrial",
    name: "Industrial District (East End)",
    trafficCongestion: 45,
    vehicleCount: 650,
    averageSpeed: 45,
    heavyVehicleRatio: 35,
    aqi: 168, // Unhealthy
    co2: 680,
    pm25: 72.3,
    no2: 95,
    noiseLevel: 78,
    activeSensors: 11,
    totalSensors: 12
  },
  {
    id: "residential",
    name: "Residential District (West Side)",
    trafficCongestion: 32,
    vehicleCount: 410,
    averageSpeed: 38,
    heavyVehicleRatio: 3,
    aqi: 48, // Good
    co2: 390,
    pm25: 11.2,
    no2: 24,
    noiseLevel: 52,
    activeSensors: 18,
    totalSensors: 18
  },
  {
    id: "techpark",
    name: "Silicon Valley Tech Park",
    trafficCongestion: 55,
    vehicleCount: 920,
    averageSpeed: 32,
    heavyVehicleRatio: 5,
    aqi: 65, // Moderate
    co2: 415,
    pm25: 18.5,
    no2: 36,
    noiseLevel: 58,
    activeSensors: 24,
    totalSensors: 25
  },
  {
    id: "port",
    name: "Port & Logistics Hub",
    trafficCongestion: 68,
    vehicleCount: 880,
    averageSpeed: 18,
    heavyVehicleRatio: 55, // Heavy trucks
    aqi: 135, // Moderate/Unhealthy for Sensitive
    co2: 590,
    pm25: 38.9,
    no2: 74,
    noiseLevel: 81,
    activeSensors: 9,
    totalSensors: 10
  }
];

let incidents: Incident[] = [
  {
    id: "inc-001",
    type: "Accident",
    severity: "High",
    location: "Grand Avenue intersection, Downtown",
    districtId: "downtown",
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min ago
    description: "Two-vehicle minor collision blocking the center and right lanes.",
    status: "Responding"
  },
  {
    id: "inc-002",
    type: "Congestion",
    severity: "Medium",
    location: "Expressway Exit 14, Port & Logistics Hub",
    districtId: "port",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    description: "Heavy truck bottleneck forming near main customs gate.",
    status: "Active"
  },
  {
    id: "inc-003",
    type: "Sensor Failure",
    severity: "Low",
    location: "Station 42 AQI Monitor, Residential",
    districtId: "residential",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2h ago
    description: "Laser particulate chamber error code 0x4F. Requires field maintenance.",
    status: "Active"
  }
];

// Helper to update district stats when incident list changes
function updateCityFormulas() {
  // Reset offsets
  districts.forEach(d => {
    // Basic natural decay / updates
    d.vehicleCount = Math.max(100, Math.floor(d.vehicleCount * (0.95 + Math.random() * 0.1)));
    if (d.vehicleCount > 1500) d.trafficCongestion = Math.min(99, 75 + Math.floor(Math.random() * 20));
    else if (d.vehicleCount > 800) d.trafficCongestion = Math.min(85, 50 + Math.floor(Math.random() * 25));
    else d.trafficCongestion = Math.min(60, 20 + Math.floor(Math.random() * 30));
  });

  // Apply incident multipliers
  incidents.forEach(inc => {
    if (inc.status !== "Resolved") {
      const d = districts.find(dist => dist.id === inc.districtId);
      if (d) {
        if (inc.type === "Accident") {
          d.trafficCongestion = Math.min(100, d.trafficCongestion + 25);
          d.averageSpeed = Math.max(5, Math.floor(d.averageSpeed * 0.5));
          d.co2 = Math.min(1000, d.co2 + 40); // Idling cars
        } else if (inc.type === "Congestion") {
          d.trafficCongestion = Math.min(100, d.trafficCongestion + 15);
          d.averageSpeed = Math.max(5, Math.floor(d.averageSpeed * 0.7));
          d.co2 = Math.min(1000, d.co2 + 25);
        } else if (inc.type === "Hazardous Leak") {
          d.aqi = Math.min(500, d.aqi + 120);
          d.pm25 = Math.min(500, d.pm25 + 60);
        } else if (inc.type === "Sensor Failure") {
          d.activeSensors = Math.max(0, d.activeSensors - 1);
        }
      }
    }
  });
}

// Call initially
updateCityFormulas();

// IoT Simulator & Alerting Engine State
let simulationActive = true;
let simulationInterval = 3000; // ms
let simulationDrift = 0.5;
let simulationScenario = "normal"; // "normal" | "rush-hour" | "industrial-peak" | "hazard-leak" | "sensor-storm"
let simulationLogs: string[] = [
  `[${new Date().toLocaleTimeString()}] [SYSTEM] IoT Real-Time Ingestion pipeline initialized.`,
  `[${new Date().toLocaleTimeString()}] [CAM-01] Downtown Core optical traffic counter online.`
];

function addSimLog(msg: string) {
  const timestamp = new Date().toLocaleTimeString();
  simulationLogs.unshift(`[${timestamp}] ${msg}`);
  if (simulationLogs.length > 50) {
    simulationLogs.pop();
  }
}

interface SystemAlert {
  id: string;
  type: "pollution" | "congestion" | "incident";
  districtId: string;
  districtName: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
  timestamp: string;
  metricValue: number;
  resolved: boolean;
}

let systemAlerts: SystemAlert[] = [
  {
    id: "alert-101",
    type: "pollution",
    districtId: "industrial",
    districtName: "Industrial District (East End)",
    severity: "High",
    message: "Critical air toxicity detected! Industrial AQI has breached the severe threshold at 168 AQI.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    metricValue: 168,
    resolved: false
  }
];

interface AlertSubscriber {
  email: string;
  phone?: string;
  pollution: boolean;
  congestion: boolean;
  incident: boolean;
}

let subscribers: AlertSubscriber[] = [
  {
    email: "operator@metropolis.gov",
    phone: "+1 (555) 019-2834",
    pollution: true,
    congestion: true,
    incident: true
  }
];

// User Profiles Database
interface UserProfile {
  uid: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  createdAt: string;
}

let usersDb: Record<string, { profile: UserProfile; passwordHash: string }> = {
  "admin@metropolis.gov": {
    profile: {
      uid: "user-admin-999",
      email: "admin@metropolis.gov",
      role: "admin",
      createdAt: new Date().toISOString()
    },
    passwordHash: "admin123"
  },
  "analyst@metropolis.gov": {
    profile: {
      uid: "user-analyst-888",
      email: "analyst@metropolis.gov",
      role: "analyst",
      createdAt: new Date().toISOString()
    },
    passwordHash: "analyst123"
  },
  "viewer@metropolis.gov": {
    profile: {
      uid: "user-viewer-777",
      email: "viewer@metropolis.gov",
      role: "viewer",
      createdAt: new Date().toISOString()
    },
    passwordHash: "viewer123"
  }
};

// Simulation Loop Engine
let simTimer: NodeJS.Timeout | null = null;

function runSimulationTick() {
  // 1. Loop through districts and apply drift based on scenario
  districts.forEach(d => {
    const factor = simulationDrift * 6;
    const shift = (Math.random() - 0.5) * factor;

    // Apply specific scenario factors
    if (simulationScenario === "rush-hour") {
      if (d.id === "downtown" || d.id === "residential") {
        d.vehicleCount = Math.min(2500, Math.floor(d.vehicleCount + 15 + Math.random() * 25));
        d.co2 = Math.min(900, d.co2 + Math.floor(Math.random() * 8));
        d.pm25 = Math.min(150, parseFloat((d.pm25 + 0.8 + Math.random() * 1.5).toFixed(1)));
        d.aqi = Math.max(10, Math.min(500, Math.round(d.pm25 * 3.2 + 10)));
        // Spike Congestion
        d.trafficCongestion = Math.min(100, Math.floor(d.trafficCongestion + 3 + Math.random() * 3));
        d.averageSpeed = Math.max(5, Math.floor(d.averageSpeed * 0.96));
      } else {
        // Normal drift
        d.vehicleCount = Math.max(50, Math.floor(d.vehicleCount + shift * 2));
      }
    } else if (simulationScenario === "industrial-peak") {
      if (d.id === "industrial" || d.id === "port") {
        d.pm25 = Math.min(400, parseFloat((d.pm25 + 3 + Math.random() * 5).toFixed(1)));
        d.co2 = Math.min(1100, d.co2 + Math.floor(Math.random() * 15));
        d.aqi = Math.max(10, Math.min(500, Math.round(d.pm25 * 3.8 + 15)));
        d.trafficCongestion = Math.min(95, Math.floor(d.trafficCongestion + 1 + Math.random() * 2));
      } else {
        d.vehicleCount = Math.max(50, Math.floor(d.vehicleCount + shift * 1.5));
      }
    } else if (simulationScenario === "hazard-leak") {
      if (d.id === "techpark") {
        d.pm25 = Math.min(480, parseFloat((d.pm25 + 8 + Math.random() * 15).toFixed(1)));
        d.co2 = Math.min(1300, d.co2 + Math.floor(Math.random() * 30));
        d.aqi = Math.max(10, Math.min(500, Math.round(d.pm25 * 4.2)));
      } else {
        d.vehicleCount = Math.max(50, Math.floor(d.vehicleCount + shift * 1.5));
      }
    } else if (simulationScenario === "sensor-storm") {
      if (Math.random() > 0.7) {
        d.activeSensors = Math.max(0, d.activeSensors - 1);
        addSimLog(`[WARN] Optical sensor drop-out on Node ID: SEN-${d.id.slice(0, 3).toUpperCase()}-42`);
      }
    } else {
      // Normal Brownian drift
      d.vehicleCount = Math.max(50, Math.floor(d.vehicleCount + shift * 10));
      d.co2 = Math.max(350, Math.floor(d.co2 + shift * 4));
      d.pm25 = Math.max(2, parseFloat((d.pm25 + shift * 0.5).toFixed(1)));
      d.aqi = Math.max(10, Math.min(500, Math.round(d.pm25 * 3.8 + (Math.random() * 4 - 2))));
    }

    // Dynamic Speed mapping from traffic congestion
    if (d.trafficCongestion > 85) {
      d.averageSpeed = Math.max(4, Math.floor(d.averageSpeed * 0.92));
    } else if (d.trafficCongestion < 40) {
      d.averageSpeed = Math.min(65, Math.floor(d.averageSpeed * 1.04));
    }
  });

  // Re-evaluate incidents impact
  updateCityFormulas();

  // 2. Generate random camera or telemetry stream log lines
  const randDistrict = districts[Math.floor(Math.random() * districts.length)];
  const logPool = [
    `[CAM-${randDistrict.id.slice(0, 3).toUpperCase()}] Visual flow index counted ${randDistrict.vehicleCount} cars on primary axis.`,
    `[AQI-${randDistrict.id.slice(0, 3).toUpperCase()}] Air monitor reports particulate PM2.5 = ${randDistrict.pm25} ug/m³, CO2 = ${randDistrict.co2} ppm.`,
    `[MIC-${randDistrict.id.slice(0, 3).toUpperCase()}] Acoustic sound array measures decibel background at ${randDistrict.noiseLevel} dBA.`,
    `[CAM-HEV] Port logistics camera analyzed flow stream: ${randDistrict.heavyVehicleRatio}% heavy logistics trucks.`
  ];
  addSimLog(logPool[Math.floor(Math.random() * logPool.length)]);

  // 3. Evaluate Alerts
  districts.forEach(d => {
    // Air Quality Alerts
    if (d.aqi > 150) {
      const existingAlert = systemAlerts.find(a => a.districtId === d.id && a.type === "pollution" && !a.resolved);
      if (!existingAlert) {
        const newAlert: SystemAlert = {
          id: `alert-aqi-${d.id}-${Date.now().toString().slice(-4)}`,
          type: "pollution",
          districtId: d.id,
          districtName: d.name,
          severity: d.aqi > 250 ? "Critical" : "High",
          message: `Toxic air pollution levels in ${d.name}! AQI has spiked to ${d.aqi} (${d.aqi > 250 ? "Very Unhealthy" : "Unhealthy"}).`,
          timestamp: new Date().toISOString(),
          metricValue: d.aqi,
          resolved: false
        };
        systemAlerts.unshift(newAlert);
        addSimLog(`[ALERT] HIGH POLLUTION triggered for ${d.name} (${d.aqi} AQI)`);
        triggerSubscriptions(newAlert);
      }
    } else {
      // Auto-resolve if AQI falls below 110
      systemAlerts.forEach(a => {
        if (a.districtId === d.id && a.type === "pollution" && !a.resolved && d.aqi < 110) {
          a.resolved = true;
          addSimLog(`[RESOLVE] Air pollution alert cleared for ${d.name}.`);
        }
      });
    }

    // Traffic Congestion Alerts
    if (d.trafficCongestion > 85) {
      const existingAlert = systemAlerts.find(a => a.districtId === d.id && a.type === "congestion" && !a.resolved);
      if (!existingAlert) {
        const newAlert: SystemAlert = {
          id: `alert-traffic-${d.id}-${Date.now().toString().slice(-4)}`,
          type: "congestion",
          districtId: d.id,
          districtName: d.name,
          severity: "High",
          message: `Severe traffic gridlock detected in ${d.name}. Congestion index: ${d.trafficCongestion}%, Average flow speed: ${d.averageSpeed} km/h.`,
          timestamp: new Date().toISOString(),
          metricValue: d.trafficCongestion,
          resolved: false
        };
        systemAlerts.unshift(newAlert);
        addSimLog(`[ALERT] SEVERE TRAFFIC gridlock in ${d.name} (${d.trafficCongestion}%)`);
        triggerSubscriptions(newAlert);
      }
    } else {
      // Auto-resolve if traffic falls below 65
      systemAlerts.forEach(a => {
        if (a.districtId === d.id && a.type === "congestion" && !a.resolved && d.trafficCongestion < 65) {
          a.resolved = true;
          addSimLog(`[RESOLVE] Traffic congestion alert cleared for ${d.name}.`);
        }
      });
    }
  });

  // Evaluate Active Incident Alerts
  incidents.forEach(inc => {
    if (inc.status === "Active") {
      const existingAlert = systemAlerts.find(a => a.id === `alert-inc-${inc.id}`);
      if (!existingAlert) {
        const newAlert: SystemAlert = {
          id: `alert-inc-${inc.id}`,
          type: "incident",
          districtId: inc.districtId,
          districtName: districts.find(d => d.id === inc.districtId)?.name || inc.districtId,
          severity: inc.severity,
          message: `URGENT INCIDENT [${inc.type}]: ${inc.description} detected at ${inc.location}. Severity: ${inc.severity}.`,
          timestamp: inc.timestamp,
          metricValue: 1,
          resolved: false
        };
        systemAlerts.unshift(newAlert);
        addSimLog(`[ALERT] EMERGENCY DISPATCH: ${inc.type} reported in ${newAlert.districtName}`);
        triggerSubscriptions(newAlert);
      }
    } else if (inc.status === "Resolved") {
      const existingAlert = systemAlerts.find(a => a.id === `alert-inc-${inc.id}` && !a.resolved);
      if (existingAlert) {
        existingAlert.resolved = true;
        addSimLog(`[RESOLVE] Incident alert ${inc.id} resolved by dispatcher.`);
      }
    }
  });
}

function triggerSubscriptions(alert: SystemAlert) {
  subscribers.forEach(sub => {
    let matches = false;
    if (alert.type === "pollution" && sub.pollution) matches = true;
    if (alert.type === "congestion" && sub.congestion) matches = true;
    if (alert.type === "incident" && sub.incident) matches = true;

    if (matches) {
      console.log(`[SUBSCRIPTION-DISPATCH] Sent Email Notification to ${sub.email} and FCM Push notification of system event: "${alert.message}"`);
    }
  });
}

function startSimLoop() {
  if (simTimer) {
    clearInterval(simTimer);
  }
  simTimer = setInterval(() => {
    if (!simulationActive) return;
    runSimulationTick();
  }, simulationInterval);
}

// Start simulation loop immediately
startSimLoop();


// API Endpoints

// Auth Endpoints
app.post("/api/auth/register", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields (email, password, role)." });
  }

  if (usersDb[email]) {
    return res.status(409).json({ error: "A user with this email address already exists." });
  }

  const profile: UserProfile = {
    uid: `user-${Math.floor(100000 + Math.random() * 900000)}`,
    email,
    role: role as any,
    createdAt: new Date().toISOString()
  };

  usersDb[email] = {
    profile,
    passwordHash: password // plain text for local sandbox mock
  };

  res.status(201).json({
    message: "Registration successful. Welcome to Metropolis Prime Control Hub.",
    user: profile
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = usersDb[email];
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid email credentials or password." });
  }

  res.json({
    message: "Authentication successful.",
    user: user.profile
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  if (!usersDb[email]) {
    return res.status(404).json({ error: "Email address not found in system directory." });
  }

  res.json({
    message: `Password reset link successfully dispatched to ${email}.`
  });
});


// IoT Simulator Endpoints
app.get("/api/simulator/status", (req, res) => {
  res.json({
    simulationActive,
    simulationInterval,
    simulationDrift,
    simulationScenario,
    simulationLogs,
    systemAlerts
  });
});

app.post("/api/simulator/config", (req, res) => {
  const { active, interval, drift, scenario } = req.body;
  
  if (active !== undefined) simulationActive = !!active;
  if (drift !== undefined) simulationDrift = parseFloat(drift);
  if (scenario !== undefined) simulationScenario = scenario;
  
  if (interval !== undefined) {
    simulationInterval = Math.max(1000, Math.min(30000, parseInt(interval)));
    startSimLoop(); // restart timer with new speed
  }

  addSimLog(`[SYSTEM] Configuration updated. Scenario: ${simulationScenario.toUpperCase()}, Speed: ${simulationInterval}ms, Active: ${simulationActive}`);

  res.json({
    message: "Simulation profile configured successfully.",
    config: {
      simulationActive,
      simulationInterval,
      simulationDrift,
      simulationScenario
    }
  });
});

app.post("/api/simulator/anomaly", (req, res) => {
  const { type } = req.body;
  if (!type) {
    return res.status(400).json({ error: "Anomaly type is required." });
  }

  if (type === "congestion_downtown") {
    const d = districts.find(dist => dist.id === "downtown");
    if (d) {
      d.trafficCongestion = 96;
      d.vehicleCount = 2380;
      d.averageSpeed = 5;
    }
    addSimLog("[ANOMALY] Forced severe congestion trigger in Downtown Commercial Core.");
  } else if (type === "aqi_industrial") {
    const d = districts.find(dist => dist.id === "industrial");
    if (d) {
      d.pm25 = 145.2;
      d.aqi = 210;
      d.co2 = 890;
    }
    addSimLog("[ANOMALY] Forced heavy toxic emission envelope in Industrial District.");
  } else if (type === "sensor_outage") {
    districts.forEach(d => {
      d.activeSensors = Math.max(0, d.activeSensors - Math.floor(Math.random() * 3 + 1));
    });
    addSimLog("[ANOMALY] Forced wide-scale sensor node dropout on telemetry mesh network.");
  } else {
    return res.status(400).json({ error: "Unknown anomaly profile." });
  }

  runSimulationTick();

  res.json({
    message: `Forced anomaly '${type}' successfully injected into Live Telemetry Ingestion stream.`,
    districts
  });
});

app.post("/api/simulator/ingest", (req, res) => {
  const { districtId, metricType, value } = req.body;
  if (!districtId || !metricType || value === undefined) {
    return res.status(400).json({ error: "Missing pipeline payload keys (districtId, metricType, value)" });
  }

  const d = districts.find(dist => dist.id === districtId);
  if (!d) {
    return res.status(404).json({ error: `Target district '${districtId}' not found.` });
  }

  const parsedVal = parseFloat(value);
  if (metricType === "trafficCongestion") d.trafficCongestion = Math.max(0, Math.min(100, parsedVal));
  else if (metricType === "vehicleCount") d.vehicleCount = Math.max(0, Math.floor(parsedVal));
  else if (metricType === "averageSpeed") d.averageSpeed = Math.max(0, Math.floor(parsedVal));
  else if (metricType === "aqi") {
    d.aqi = Math.max(0, Math.min(500, Math.round(parsedVal)));
    d.pm25 = Math.max(0, parseFloat((d.aqi / 3.8).toFixed(1)));
  }
  else if (metricType === "co2") d.co2 = Math.max(0, Math.floor(parsedVal));
  else {
    return res.status(400).json({ error: `Ingestion unsupported for metric key '${metricType}'` });
  }

  addSimLog(`[INGEST-PIPELINE] Ext. telemetry ingested for ${d.name}. Metric ${metricType} = ${value}.`);
  runSimulationTick();

  res.json({
    message: "Data stream successfully ingested into live city models.",
    district: d
  });
});

// Alerting & Notification Endpoints
app.get("/api/alerts", (req, res) => {
  res.json({
    alerts: systemAlerts,
    subscribersCount: subscribers.length
  });
});

app.post("/api/alerts/subscribe", (req, res) => {
  const { email, phone, pollution, congestion, incident } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required to subscribe." });
  }

  // Remove existing if any
  subscribers = subscribers.filter(s => s.email !== email);

  const newSub: AlertSubscriber = {
    email,
    phone,
    pollution: !!pollution,
    congestion: !!congestion,
    incident: !!incident
  };

  subscribers.push(newSub);
  addSimLog(`[ALERT-ENGINE] New notification subscriber enrolled: ${email}`);

  res.json({
    message: "Alert notification profile saved and activated.",
    subscriber: newSub
  });
});

app.post("/api/alerts/clear", (req, res) => {
  const { id } = req.body;
  if (id) {
    const alert = systemAlerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      addSimLog(`[ALERT-ENGINE] Alert ID: ${id} manually resolved by system operator.`);
    }
  } else {
    systemAlerts.forEach(a => a.resolved = true);
    addSimLog("[ALERT-ENGINE] All active alerts flushed/marked resolved.");
  }

  res.json({
    message: "Alert records updated successfully.",
    alerts: systemAlerts
  });
});


// 1. Get Live City State
app.get("/api/city/state", (req, res) => {
  // Simulate small random changes to make it feel alive!
  districts.forEach(d => {
    const shift = (Math.random() - 0.5) * 4;
    d.vehicleCount = Math.max(50, Math.floor(d.vehicleCount + (Math.random() - 0.5) * 15));
    d.co2 = Math.max(350, Math.floor(d.co2 + shift * 2));
    d.pm25 = Math.max(2, parseFloat((d.pm25 + (Math.random() - 0.5) * 0.8).toFixed(1)));
    
    // Recompute AQI slightly from PM2.5
    // Simple EPA formula approximation
    d.aqi = Math.max(10, Math.min(500, Math.round(d.pm25 * 3.8 + (Math.random() * 4 - 2))));
  });

  res.json({
    timestamp: new Date().toISOString(),
    districts: districtsData(),
    incidents: incidentsList(),
  });
});

// Helper functions for mock data format
function districtsData() {
  return [
    { id: "d1", name: "Downtown Core", districtId: "downtown", ...districts.find(d => d.id === "downtown") },
    { id: "d2", name: "Industrial District", districtId: "industrial", ...districts.find(d => d.id === "industrial") },
    { id: "d3", name: "Residential West", districtId: "residential", ...districts.find(d => d.id === "residential") },
    { id: "d4", name: "Tech Innovation Park", districtId: "techpark", ...districts.find(d => d.id === "techpark") },
    { id: "d5", name: "Port & Heavy Logistics", districtId: "port", ...districts.find(d => d.id === "port") },
  ];
}

function districtsDataRaw() {
  return districts;
}

function districtsDataRawMap() {
  return districts.reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {} as Record<string, District>);
}

// Re-map actual objects to include simulation values dynamically
const districtsDataMapped = () => districts;

// 2. Report New Incident
app.post("/api/city/incident", (req, res) => {
  const { type, severity, location, districtId, description } = req.body;
  if (!type || !severity || !location || !districtId || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newInc: Incident = {
    id: `inc-${Math.floor(100 + Math.random() * 900)}`,
    type,
    severity,
    location,
    districtId,
    timestamp: new Date().toISOString(),
    description,
    status: "Active"
  };

  incidents.unshift(newInc);
  updateCityFormulas();

  res.status(201).json({
    message: "Incident reported successfully and urban safety protocols triggered.",
    incident: newInc,
    state: {
      districts: districts,
      incidents
    }
  });
});

// 3. Update Incident Status
app.post("/api/city/incident/status", (req, res) => {
  const { id, status } = req.body;
  const inc = incidents.find(i => i.id === id);
  if (!inc) {
    return res.status(404).json({ error: "Incident not found" });
  }

  inc.status = status;
  // If resolved, repair sensor status if applicable
  if (status === "Resolved" && inc.type === "Sensor Failure") {
    const d = districts.find(dist => dist.id === inc.districtId);
    if (d) d.activeSensors = Math.min(d.totalSensors, d.activeSensors + 1);
  }

  updateCityFormulas();

  res.json({
    message: `Incident ${id} updated to ${status}.`,
    incident: inc,
    state: {
      districts: districts,
      incidents
    }
  });
});

// 4. Copilot Chat Endpoint using Server-Side Gemini API
app.post("/api/copilot/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const ai = getGeminiClient();

    // Contextualize Gemini with live city simulation data!
    const cityContext = districts.map(d => (
      `- ${d.name}: Traffic Congestion ${d.trafficCongestion}%, Vehicle count: ${d.vehicleCount}, Average speed: ${d.averageSpeed} km/h, AQI: ${d.aqi}, CO2: ${d.co2} ppm, PM2.5: ${d.pm25} ug/m3, Active sensors: ${d.activeSensors}/${d.totalSensors}`
    )).join("\n");

    const activeIncidents = incidents.filter(i => i.status !== "Resolved").map(i => (
      `- [ID: ${i.id} - ${i.severity} Severity] ${i.type} at ${i.location}: ${i.description} (Status: ${i.status})`
    )).join("\n") || "No active incidents.";

    const systemInstruction = `You are the Smart City AI Copilot (UrbanMind OS Core), an advanced generative AI assistant integrated into the control center of Metropolis Prime.
You have live, direct read access to the city telemetry database.

LIVE TELEMETRY DATA:
${cityContext}

ACTIVE INCIDENTS:
${activeIncidents}

Your role:
1. Assist city operators, planners, and emergency dispatchers with decision support.
2. Answer telemetry queries (e.g. "What is the AQI in the West Side?", "Show traffic congestion") using the exact numbers from the LIVE TELEMETRY context.
3. Suggest smart urban planning suggestions, traffic re-routing recommendations, and pollution reduction advisories.
4. Draft actionable city reports when asked ("Generate a report on pollution"). Format reports beautifully with markdown headings, structured bullet points, and analytical conclusions.
5. Be concise, highly professional, analytical, and objective. Avoid overly dramatic terminology.
6. Provide specific recommendations to resolve active incidents if asked.

Make sure to ALWAYS state facts and statistics using the LIVE TELEMETRY DATA provided above. If the user asks about districts or data not in the list, state what is available.`;

    // Package the history for chat structure
    const formattedContents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((item: any) => {
        formattedContents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }]
        });
      });
    }
    // Add current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }], // Enable search grounding for broader contexts!
      }
    });

    const responseText = response.text || "No response received from Smart City AI Core.";

    // Get any grounding metadata if available (e.g. search sources)
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = searchChunks ? searchChunks.map((chunk: any) => ({
      title: chunk.web?.title || "Web Source",
      url: chunk.web?.uri || ""
    })).filter(s => s.url !== "") : [];

    res.json({
      reply: responseText,
      sources
    });

  } catch (error: any) {
    console.error("Gemini Copilot Error:", error);
    res.status(500).json({
      error: "Failed to communicate with AI Core. Please verify your GEMINI_API_KEY inside Settings > Secrets.",
      details: error.message
    });
  }
});

// Helper formatters
function incidentsList() {
  return incidents;
}

// Vite Server Setup for Development vs. Production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart City AI Server running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Error starting server:", err);
});
