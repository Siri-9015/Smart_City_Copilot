export interface District {
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
  districtId: string;
}

export interface Incident {
  id: string;
  type: "Accident" | "Congestion" | "Roadworks" | "Sensor Failure" | "Hazardous Leak";
  severity: "Low" | "Medium" | "High" | "Critical";
  location: string;
  districtId: string;
  timestamp: string;
  description: string;
  status: "Active" | "Responding" | "Resolved";
}

export interface CityState {
  timestamp: string;
  districts: District[];
  incidents: Incident[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  sources?: { title: string; url: string }[];
}
