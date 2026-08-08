"use client";

type TableFilterProps = {
  value: number | "all";
  onChange: (value: number | "all") => void;
  tables: number[];
};

export function TableFilter({ value, onChange, tables }: TableFilterProps) {
  return (
    <label className="flex items-center gap-3 text-sm text-[#f4ead7]/70">
      <span className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">
        Mesa
      </span>
      <select
        value={value === "all" ? "all" : String(value)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "all" ? "all" : Number(v));
        }}
        className="min-w-32 border border-[#D4AF37]/30 bg-[#0c0b0a] px-3 py-2 text-[#f4ead7] outline-none focus:border-[#D4AF37]"
      >
        <option value="all">Todas</option>
        {tables.map((n) => (
          <option key={n} value={n}>
            Mesa {n}
          </option>
        ))}
      </select>
    </label>
  );
}
