import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PRESET_OPTIONS,
  areDateRangesEqual,
  formatDateForApi,
} from "@/utils/datePresets";
import type { DateRange, PresetId } from "@/utils/datePresets";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  sprintStartDate: string;
  sprintLengthDays: number;
  isLoading?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  sprintStartDate,
  sprintLengthDays,
  isLoading = false,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date>(value.startDate);
  const [endDate, setEndDate] = useState<Date>(value.endDate);
  const [activePreset, setActivePreset] = useState<PresetId | null>("last-30");

  // Sync internal state when external value changes
  useEffect(() => {
    setStartDate(value.startDate);
    setEndDate(value.endDate);

    // Determine if value matches a preset
    const matchingPreset = PRESET_OPTIONS.find((preset) => {
      const presetRange = preset.getRange(sprintStartDate, sprintLengthDays);
      return areDateRangesEqual(presetRange, value);
    });
    setActivePreset(matchingPreset?.id ?? null);
  }, [value, sprintStartDate, sprintLengthDays]);

  const isValidRange = endDate >= startDate;
  const isApplyDisabled = !isValidRange || isLoading;

  const handlePresetClick = (presetId: PresetId) => {
    const preset = PRESET_OPTIONS.find((p) => p.id === presetId);
    if (!preset) return;

    const range = preset.getRange(sprintStartDate, sprintLengthDays);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setActivePreset(presetId);
  };

  const handleApply = () => {
    if (!isValidRange) return;
    onChange({ startDate, endDate });
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      setActivePreset(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDate(date);
      setActivePreset(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Preset dropdown */}
      <select
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={activePreset ?? ""}
        onChange={(e) => {
          if (e.target.value) {
            handlePresetClick(e.target.value as PresetId);
          }
        }}
      >
        <option value="" disabled>
          Select preset...
        </option>
        {PRESET_OPTIONS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>

      {/* Date inputs */}
      <div className="flex items-center gap-2">
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          dateFormat="yyyy-MM-dd"
          className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          maxDate={endDate}
        />
        <span className="text-gray-500">-</span>
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          dateFormat="yyyy-MM-dd"
          className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          minDate={startDate}
        />
      </div>

      {/* Validation error */}
      {!isValidRange && (
        <span className="text-sm text-red-600">
          End date must be after start
        </span>
      )}

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={isApplyDisabled}
        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoading ? "Loading..." : "Apply"}
      </button>

      {/* Display current range */}
      <span className="text-sm text-gray-600">
        {formatDateForApi(value.startDate)} to {formatDateForApi(value.endDate)}
      </span>
    </div>
  );
}
