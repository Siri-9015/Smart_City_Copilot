import { ReactNode } from "react";
import { motion } from "motion/react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "sky" | "emerald" | "amber" | "rose" | "indigo";
}

export default function MetricCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "sky",
}: MetricCardProps) {
  const colorStyles = {
    sky: {
      border: "border-sky-500/20",
      glow: "shadow-[0_0_15px_rgba(14,165,233,0.03)]",
      iconBg: "bg-sky-500/10 text-sky-400",
      text: "text-sky-400",
    },
    emerald: {
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.03)]",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      text: "text-emerald-400",
    },
    amber: {
      border: "border-amber-500/20",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.03)]",
      iconBg: "bg-amber-500/10 text-amber-400",
      text: "text-amber-400",
    },
    rose: {
      border: "border-rose-500/20",
      glow: "shadow-[0_0_15px_rgba(244,63,94,0.03)]",
      iconBg: "bg-rose-500/10 text-rose-400",
      text: "text-rose-400",
    },
    indigo: {
      border: "border-indigo-500/20",
      glow: "shadow-[0_0_15px_rgba(99,102,241,0.03)]",
      iconBg: "bg-indigo-500/10 text-indigo-400",
      text: "text-indigo-400",
    },
  };

  const style = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-slate-900/50 border ${style.border} ${style.glow} rounded-3xl p-5 backdrop-blur-sm hover:border-slate-700/50 hover:bg-slate-900/70 transition-all duration-300 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-2xl font-bold text-slate-100 tracking-tight block">
            {value}
          </span>
        </div>
        <div className={`p-2 rounded-lg ${style.iconBg} shadow-inner`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 border-t border-slate-900 pt-2 text-xs">
        <span className="text-slate-400 font-medium truncate">{subtitle}</span>
        {trend && (
          <span
            className={`font-mono font-bold ${
              trend.isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}
