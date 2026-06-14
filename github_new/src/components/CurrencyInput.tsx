import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/simulatorCalc";

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  // Keep local track of the input value to preserve cursor context and smooth typing
  const [inputValue, setInputValue] = React.useState("");

  // Sync state with parent value
  React.useEffect(() => {
    // Only update if the numerical value differs from the parsed current input
    const parsedCurrent = parseLocaleNumber(inputValue);
    if (parsedCurrent !== value || inputValue === "") {
      setInputValue(formatCurrency(value));
    }
  }, [value]);

  // Helper to parse localized currency string to a float number
  function parseLocaleNumber(stringNumber: string): number {
    // Strip everything except figures/digits
    const digits = stringNumber.replace(/\D/g, "");
    if (!digits) return 0;
    return parseFloat(digits) / 100;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Get digits only
    const digits = rawVal.replace(/\D/g, "");
    
    if (digits === "") {
      setInputValue(formatCurrency(0));
      onChange(0);
      return;
    }

    const numericValue = parseFloat(digits) / 100;
    
    // Format the text and store
    const formatted = formatCurrency(numericValue);
    setInputValue(formatted);
    
    // Trigger parent change callback
    onChange(numericValue);
  };

  // Prevent cursor from jumping or being in a weird position
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Move cursor to the end of the input text on focus
    const tempValue = e.target.value;
    e.target.value = "";
    e.target.value = tempValue;
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      className={className}
      {...props}
    />
  );
}
