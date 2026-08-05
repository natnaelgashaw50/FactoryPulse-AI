import React from "react";

export default function HealthGauge({ value, label }: { value: number; label: string }) {
  const color = value > 70 ? "#46D7C7" : value > 40 ? "#F2A93B" : "#E5484D";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - value / 100);
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="#232B35" strokeWidth="8" fill="none" />
        <circle
          cx="50" cy="50" r="40" stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fill="white" fontWeight="bold">
          {value.toFixed(0)}
        </text>
      </svg>
      <div className="text-[11px] text-muted mt-1">{label}</div>
    </div>
  );
}
