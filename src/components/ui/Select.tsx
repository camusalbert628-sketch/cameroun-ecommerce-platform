"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  align?: "left" | "right";
  ariaLabel?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  size = "md",
  className = "",
  buttonClassName = "",
  disabled = false,
  align = "left",
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(1, options.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + options.length) % Math.max(1, options.length));
      } else if (e.key === "Enter" && activeIndex >= 0 && options[activeIndex] && !options[activeIndex].disabled) {
        e.preventDefault();
        onChange(options[activeIndex].value);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, activeIndex, options, onChange]);

  const sizeStyles =
    size === "xs"
      ? "px-2.5 py-1 text-[11px] rounded-lg"
      : size === "sm"
      ? "px-3 py-2 text-xs rounded-xl"
      : "px-3.5 py-2.5 text-sm rounded-xl";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next) {
              const idx = options.findIndex((opt) => opt.value === value);
              setActiveIndex(idx >= 0 ? idx : 0);
            }
            return next;
          });
        }}
        className={`flex w-full items-center justify-between gap-2 border border-slate-200 bg-white text-left font-medium text-[#0B192C] shadow-2xs transition-all duration-150 hover:border-slate-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${sizeStyles} ${
          open ? "border-orange-500 ring-2 ring-orange-500/20" : ""
        } ${buttonClassName}`}
      >
        <span className={`truncate ${selectedOption ? "text-[#0B192C]" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-orange-500" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 min-w-full w-max max-w-[min(92vw,340px)] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5">
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isFocused = idx === activeIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    size === "xs" ? "text-[11px]" : "text-xs"
                  } ${
                    isSelected
                      ? "bg-orange-50 text-orange-700 font-bold"
                      : isFocused
                      ? "bg-slate-100 text-[#0B192C]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{opt.label}</div>
                    {opt.hint && (
                      <div className="text-[10px] text-slate-400 truncate font-normal">{opt.hint}</div>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
