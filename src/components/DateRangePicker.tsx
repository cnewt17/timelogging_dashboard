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
}

export function DateRangePicker({
  value,
  onChange,
  sprintStartDate,
  sprintLengthDays,
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
        disabled={!isValidRange}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        Apply
      </button>

      {/* Display current range */}
      <span className="text-sm text-gray-600">
        {formatDateForApi(value.startDate)} to {formatDateForApi(value.endDate)}
      </span>
    </div>
  );
}
