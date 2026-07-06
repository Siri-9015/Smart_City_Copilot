import { motion } from "motion/react";
import { Activity, Car, Eye, ShieldAlert, Wind } from "lucide-react";
import { District } from "../types";

interface CityDigitalTwinProps {
  districts: District[];
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string | null) => void;
  hoveredDistrictId: string | null;
  onHoverDistrict: (id: string | null) => void;
}

export default function CityDigitalTwin({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  hoveredDistrictId,
  onHoverDistrict,
}: CityDigitalTwinProps) {
  // Safe helper to find stats
  const getStats = (id: string): District => {
    return districts.find((d) => d.districtId === id) || {
      id,
      name: id,
      trafficCongestion: 50,
      vehicleCount: 500,
      averageSpeed: 30,
      heavyVehicleRatio: 10,
      aqi: 75,
      co2: 400,
      pm25: 15,
      no2: 25,
      noiseLevel: 60,
      activeSensors: 10,
      totalSensors: 10,
      districtId: id,
    };
  };

  const downtown = getStats("downtown");
  const industrial = getStats("industrial");
  const residential = getStats("residential");
  const techpark = getStats("techpark");
  const port = getStats("port");

  // Congestion Color Helper
  const getCongestionColor = (level: number) => {
    if (level > 75) return "stroke-red-500 shadow-red-500/50";
    if (level > 45) return "stroke-amber-500 shadow-amber-500/50";
    return "stroke-emerald-500 shadow-emerald-500/50";
  };

  const getDistrictFill = (districtId: string, baseColor: string) => {
    const isSelected = selectedDistrictId === districtId;
    const isHovered = hoveredDistrictId === districtId;
    
    if (isSelected) return "fill-slate-800/80 stroke-sky-400 stroke-[2px]";
    if (isHovered) return "fill-slate-800/60 stroke-slate-500 stroke-[1.5px]";
    return `fill-slate-900/40 stroke-slate-800 stroke-[1px]`;
  };

  // Duration speed calculation for vehicle flow animation
  const getFlowDuration = (avgSpeed: number) => {
    // Slower speed (e.g. 15km/h) -> longer animation duration (slow moving dots)
    // Faster speed (e.g. 50km/h) -> shorter duration (fast moving dots)
    return Math.max(1.5, Math.min(10, 60 / avgSpeed));
  };

  return (
    <div className="relative bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl p-5 flex flex-col h-full select-none backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs uppercase text-slate-400 tracking-wider">
            Telemetry Digital Twin: Live Flow Map
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Smooth
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Congested
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Gridlock
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-[350px] w-full flex items-center justify-center p-2">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full max-h-[450px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grids Background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.05)" strokeWidth="1" />
            </pattern>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Central Glow representing the city hub */}
          <circle cx="400" cy="250" r="300" fill="url(#glow)" />

          {/* DISTRICTS POLYGONS */}
          {/* Residential West: Left zone */}
          <path
            d="M 50 150 L 300 100 L 280 320 L 80 420 Z"
            className={`transition-all duration-300 cursor-pointer ${getDistrictFill("residential", "emerald")}`}
            onClick={() => onSelectDistrict(selectedDistrictId === "residential" ? null : "residential")}
            onMouseEnter={() => onHoverDistrict("residential")}
            onMouseLeave={() => onHoverDistrict(null)}
          />

          {/* Downtown: Center zone */}
          <path
            d="M 300 100 L 520 80 L 480 300 L 280 320 Z"
            className={`transition-all duration-300 cursor-pointer ${getDistrictFill("downtown", "sky")}`}
            onClick={() => onSelectDistrict(selectedDistrictId === "downtown" ? null : "downtown")}
            onMouseEnter={() => onHoverDistrict("downtown")}
            onMouseLeave={() => onHoverDistrict(null)}
          />

          {/* Tech Park: Top Right zone */}
          <path
            d="M 520 80 L 740 120 L 680 280 L 480 300 Z"
            className={`transition-all duration-300 cursor-pointer ${getDistrictFill("techpark", "indigo")}`}
            onClick={() => onSelectDistrict(selectedDistrictId === "techpark" ? null : "techpark")}
            onMouseEnter={() => onHoverDistrict("techpark")}
            onMouseLeave={() => onHoverDistrict(null)}
          />

          {/* Port Logistics: Bottom Left/Center */}
          <path
            d="M 280 320 L 480 300 L 420 480 L 220 460 Z"
            className={`transition-all duration-300 cursor-pointer ${getDistrictFill("port", "rose")}`}
            onClick={() => onSelectDistrict(selectedDistrictId === "port" ? null : "port")}
            onMouseEnter={() => onHoverDistrict("port")}
            onMouseLeave={() => onHoverDistrict(null)}
          />

          {/* Industrial East: Bottom Right */}
          <path
            d="M 480 300 L 680 280 L 750 440 L 420 480 Z"
            className={`transition-all duration-300 cursor-pointer ${getDistrictFill("industrial", "amber")}`}
            onClick={() => onSelectDistrict(selectedDistrictId === "industrial" ? null : "industrial")}
            onMouseEnter={() => onHoverDistrict("industrial")}
            onMouseLeave={() => onHoverDistrict(null)}
          />

          {/* HIGHWAY CONNECTORS / FLOW ROAD LINKS */}
          {/* Main Ring Road East-West */}
          <g className="opacity-80">
            <path
              id="hwy-west-east"
              d="M 100 280 Q 400 200 700 200"
              fill="none"
              className={`stroke-[4px] transition-colors duration-500 ${getCongestionColor((downtown.trafficCongestion + residential.trafficCongestion) / 2)}`}
              strokeDasharray="8 6"
            />
            {/* Animated vehicles on highway */}
            <circle r="4" fill="#38bdf8" className="filter drop-shadow-[0_0_4px_#38bdf8]">
              <animateMotion
                dur={`${getFlowDuration(downtown.averageSpeed)}s`}
                repeatCount="indefinite"
                path="M 100 280 Q 400 200 700 200"
              />
            </circle>
            <circle r="4" fill="#38bdf8" className="filter drop-shadow-[0_0_4px_#38bdf8]">
              <animateMotion
                dur={`${getFlowDuration(downtown.averageSpeed)}s`}
                begin={`${getFlowDuration(downtown.averageSpeed) / 3}s`}
                repeatCount="indefinite"
                path="M 100 280 Q 400 200 700 200"
              />
            </circle>
          </g>

          {/* Industrial Port Connector */}
          <g className="opacity-80">
            <path
              id="hwy-port-ind"
              d="M 350 410 C 450 360, 480 420, 580 380"
              fill="none"
              className={`stroke-[4px] transition-colors duration-500 ${getCongestionColor((port.trafficCongestion + industrial.trafficCongestion) / 2)}`}
              strokeDasharray="6 4"
            />
            <circle r="4" fill="#fbbf24" className="filter drop-shadow-[0_0_4px_#fbbf24]">
              <animateMotion
                dur={`${getFlowDuration(industrial.averageSpeed)}s`}
                repeatCount="indefinite"
                path="M 350 410 C 450 360, 480 420, 580 380"
              />
            </circle>
          </g>

          {/* Tech Park Downtown Connector */}
          <g className="opacity-80">
            <path
              id="hwy-tech-down"
              d="M 610 180 Q 450 140, 390 190"
              fill="none"
              className={`stroke-[4px] transition-colors duration-500 ${getCongestionColor((techpark.trafficCongestion + downtown.trafficCongestion) / 2)}`}
              strokeDasharray="6 4"
            />
            <circle r="4" fill="#38bdf8" className="filter drop-shadow-[0_0_4px_#38bdf8]">
              <animateMotion
                dur={`${getFlowDuration(techpark.averageSpeed)}s`}
                repeatCount="indefinite"
                path="M 610 180 Q 450 140, 390 190"
              />
            </circle>
          </g>

          {/* SENSOR NODES (Visual representations) */}
          {/* Downtown Sensor */}
          <g transform="translate(390, 190)" className="cursor-pointer">
            <circle r="12" fill="rgba(14, 165, 233, 0.15)" />
            <circle r="5" fill="#0ea5e9" className={downtown.trafficCongestion > 70 ? "fill-red-500" : "fill-sky-400"} />
            <circle r="8" fill="none" stroke="#0ea5e9" strokeWidth="1" className="animate-ping" style={{ animationDuration: "3s" }} />
          </g>

          {/* Industrial Sensor */}
          <g transform="translate(580, 380)" className="cursor-pointer">
            <circle r="12" fill="rgba(245, 158, 11, 0.15)" />
            <circle r="5" fill="#f59e0b" className={industrial.aqi > 150 ? "fill-red-500" : "fill-amber-500"} />
            <circle r="8" fill="none" stroke="#f59e0b" strokeWidth="1" className="animate-ping" style={{ animationDuration: "2s" }} />
          </g>

          {/* Residential Sensor */}
          <g transform="translate(180, 260)" className="cursor-pointer">
            <circle r="12" fill="rgba(16, 185, 129, 0.15)" />
            <circle r="5" fill="#10b981" />
            <circle r="8" fill="none" stroke="#10b981" strokeWidth="1" className="animate-ping" style={{ animationDuration: "4s" }} />
          </g>

          {/* DISTRICT LABELS */}
          <g transform="translate(180, 210)" className="pointer-events-none">
            <rect x="-65" y="-12" width="130" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
            <text fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle" y="4" fontWeight="bold">
              WEST RESIDENTIAL
            </text>
            <text fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="middle" y="24">
              AQI: {residential.aqi} | Speed: {residential.averageSpeed}k
            </text>
          </g>

          <g transform="translate(410, 140)" className="pointer-events-none">
            <rect x="-55" y="-12" width="110" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="1" />
            <text fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle" y="4" fontWeight="bold">
              DOWNTOWN
            </text>
            <text fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" y="24">
              Flow: {100 - downtown.trafficCongestion}% | AQI: {downtown.aqi}
            </text>
          </g>

          <g transform="translate(610, 140)" className="pointer-events-none">
            <rect x="-55" y="-12" width="110" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1" />
            <text fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle" y="4" fontWeight="bold">
              TECH PARK
            </text>
            <text fill="#818cf8" fontSize="9" fontFamily="monospace" textAnchor="middle" y="24">
              AQI: {techpark.aqi} | Flow: {100 - techpark.trafficCongestion}%
            </text>
          </g>

          <g transform="translate(350, 380)" className="pointer-events-none">
            <rect x="-55" y="-12" width="110" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="1" />
            <text fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle" y="4" fontWeight="bold">
              PORT DISTRICT
            </text>
            <text fill="#fb7185" fontSize="9" fontFamily="monospace" textAnchor="middle" y="24">
              Truck Ratio: {port.heavyVehicleRatio}% | AQI: {port.aqi}
            </text>
          </g>

          <g transform="translate(580, 340)" className="pointer-events-none">
            <rect x="-60" y="-12" width="120" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1" />
            <text fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle" y="4" fontWeight="bold">
              INDUSTRIAL SECTOR
            </text>
            <text fill="#fbbf24" fontSize="9" fontFamily="monospace" textAnchor="middle" y="24">
              AQI: {industrial.aqi} (Unhealthy)
            </text>
          </g>
        </svg>
      </div>

      {/* District quick info tray */}
      <div className="mt-4 grid grid-cols-5 gap-2 border-t border-slate-800/60 pt-3">
        {districts.map((d) => {
          const isSelected = selectedDistrictId === d.districtId;
          const isHighAqi = d.aqi > 100;
          const isHighCongestion = d.trafficCongestion > 70;

          return (
            <div
              key={d.id}
              className={`p-3 rounded-2xl cursor-pointer transition-all ${
                isSelected
                  ? "bg-slate-900/90 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                  : "bg-slate-950/40 hover:bg-slate-900/60 border border-slate-800/80"
              }`}
              onClick={() => onSelectDistrict(isSelected ? null : d.districtId)}
            >
              <div className="text-[10px] font-mono text-slate-400 truncate font-semibold">
                {d.name.split(" ")[0]}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs">
                <div className="flex items-center gap-0.5 text-slate-300">
                  <Car className="h-3 w-3 stroke-slate-500" />
                  <span className={isHighCongestion ? "text-red-400 font-bold" : ""}>
                    {d.trafficCongestion}%
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-slate-300">
                  <Wind className="h-3 w-3 stroke-slate-500" />
                  <span className={isHighAqi ? "text-amber-400 font-bold" : "text-emerald-400"}>
                    {d.aqi}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
