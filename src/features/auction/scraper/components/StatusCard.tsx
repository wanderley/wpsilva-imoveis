"use client";

export default function StatusCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-4 bg-card rounded-lg shadow-sm flex flex-col">
      <p className={`text-lg font-medium ${color} truncate`}>{title}</p>
      <p className={`text-4xl font-bold ${color} mt-2`}>{value}</p>
    </div>
  );
}
