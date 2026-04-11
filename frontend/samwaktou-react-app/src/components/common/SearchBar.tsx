/**
 * @file SearchBar.tsx
 * @description Debounced search input for filtering lists.
 *
 * Wraps Mantine's `<TextInput>` with a built-in debounce so the parent
 * only receives `onChange` after the user stops typing (300ms default).
 */

import { useEffect, useRef, useState } from 'react';
import { TextInput, type TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface SearchBarProps extends Omit<TextInputProps, 'onChange'> {
  /** Called with the debounced search value. */
  onChange: (value: string) => void;
  /** Debounce delay in milliseconds (default: 300). */
  debounceMs?: number;
}

export function SearchBar({
  onChange,
  debounceMs = 300,
  placeholder = 'Rechercher…',
  ...rest
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onChange(value), debounceMs);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [value, debounceMs, onChange]);

  return (
    <TextInput
      leftSection={<IconSearch size={16} stroke={1.5} />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      {...rest}
    />
  );
}
