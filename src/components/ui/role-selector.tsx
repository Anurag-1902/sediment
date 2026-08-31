"use client";

import { useState, useRef, useEffect } from "react";

const PRESET_ROLES = [
  "Developer",
  "HR",
  "Finance",
  "Accountant",
  "Data Analyst",
  "Business Analyst",
  "Designer",
  "QA",
  "Product Manager",
  "Engineering Manager",
  "CEO",
  "CTO",
  "Founder",
  "Co-Founder",
  "Intern",
  "Employee",
];

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  onCommit?: (role: string) => void;
  className?: string;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, onCommit, className, disabled }: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Commit on blur
        const trimmed = inputValue.trim();
        if (trimmed && trimmed !== value && onCommit) {
          onCommit(trimmed);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, value, onCommit]);

  const filtered = PRESET_ROLES.filter((r) =>
    r.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        disabled={disabled}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setIsOpen(false);
            const trimmed = inputValue.trim();
            if (trimmed && onCommit) onCommit(trimmed);
            inputRef.current?.blur();
          }
          if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Select or type a role"
        className="w-full rounded-lg border border-border-custom bg-charcoal px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border-custom bg-surface shadow-lg">
          {filtered.map((role) => (
            <button
              key={role}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInputValue(role);
                onChange(role);
                if (onCommit) onCommit(role);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-amber/10 transition-colors ${
                inputValue === role ? "text-amber font-medium" : "text-text"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
