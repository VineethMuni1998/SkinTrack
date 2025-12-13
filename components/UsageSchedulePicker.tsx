"use client";

export type UsageMode = "DAILY" | "SKIP_DAYS" | "SPECIFIC_DAYS";

interface UsageSchedulePickerProps {
  usageMode: UsageMode;
  skipDays: string[];
  specificDays: string[];
  onUsageModeChange: (mode: UsageMode) => void;
  onToggleDay: (day: string, type: "skip" | "specific") => void;
  className?: string;
  title?: string;
  helperText?: string;
}

const WEEK_DAYS = [
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
  { label: "Sun", value: "SUNDAY" },
];

export function getWeekdayValues() {
  return WEEK_DAYS.map((d) => d.value);
}

export default function UsageSchedulePicker({
  usageMode,
  skipDays,
  specificDays,
  onUsageModeChange,
  onToggleDay,
  className = "",
  title = "Usage schedule",
  helperText = "Choose if this is daily, skips certain days, or only on specific days.",
}: UsageSchedulePickerProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{helperText}</p>
        </div>
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
          {[
            { label: "Daily", value: "DAILY" as UsageMode },
            { label: "Skip days", value: "SKIP_DAYS" as UsageMode },
            { label: "Specific days", value: "SPECIFIC_DAYS" as UsageMode },
          ].map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onUsageModeChange(mode.value)}
              className={`px-3 py-1 rounded-full transition ${
                usageMode === mode.value
                  ? "bg-white text-amber-700 shadow"
                  : "text-gray-500"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {(usageMode === "SKIP_DAYS" || usageMode === "SPECIFIC_DAYS") && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => {
              const active =
                usageMode === "SKIP_DAYS"
                  ? skipDays.includes(day.value)
                  : specificDays.includes(day.value);
              return (
                <button
                  type="button"
                  key={day.value}
                  onClick={() =>
                    onToggleDay(day.value, usageMode === "SKIP_DAYS" ? "skip" : "specific")
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    active
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {usageMode === "SKIP_DAYS"
              ? "Use every day except the days you select."
              : "Use only on the days you select."}
          </p>
        </div>
      )}
    </div>
  );
}
