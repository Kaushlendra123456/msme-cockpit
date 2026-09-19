import { ReactNode } from "react";

interface CardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "blue" | "green" | "red" | "amber";
}

const accentMap = {
  blue: "text-brand-600 bg-brand-50",
  green: "text-emerald-600 bg-emerald-50",
  red: "text-red-600 bg-red-50",
  amber: "text-amber-600 bg-amber-50",
};

export const Card = ({ title, value, icon, accent = "blue" }: CardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
    {icon && <div className={`p-3 rounded-lg ${accentMap[accent]}`}>{icon}</div>}
  </div>
);
