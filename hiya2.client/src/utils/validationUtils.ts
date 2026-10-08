import React from 'react';

/**
 * KeyDown event handler to allow ONLY digits (0-9) and control keys (Backspace, Delete, Tab, Arrow keys, Enter).
 * Attach to <input onKeyDown={allowOnlyDigits} />
 */
export const allowOnlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedControlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  // Allow shortcut commands like Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (e.ctrlKey || e.metaKey || allowedControlKeys.includes(e.key)) {
    return;
  }

  // If the pressed key is not a digit 0-9, prevent typing
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * KeyDown event handler to allow digits (0-9) and a SINGLE decimal point (.).
 * Attach to <input onKeyDown={allowOnlyDecimal} />
 */
export const allowOnlyDecimal = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedControlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (e.ctrlKey || e.metaKey || allowedControlKeys.includes(e.key)) {
    return;
  }

  const currentValue = e.currentTarget.value;

  // Allow decimal point only if not already present
  if (e.key === '.' && !currentValue.includes('.')) {
    return;
  }

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * KeyDown event handler to allow ONLY alphabets (a-z, A-Z) and spaces.
 * Blocks numbers, digits, and special characters.
 * Attach to <input onKeyDown={allowOnlyLetters} />
 */
export const allowOnlyLetters = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedControlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    ' ',
  ];

  if (e.ctrlKey || e.metaKey || allowedControlKeys.includes(e.key)) {
    return;
  }

  // Allow only alphabets (a-z, A-Z)
  if (!/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * KeyDown event handler to allow ONLY alphabets (a-z, A-Z) WITHOUT spaces.
 * Attach to <input onKeyDown={allowOnlyLettersNoSpace} />
 */
export const allowOnlyLettersNoSpace = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedControlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (e.ctrlKey || e.metaKey || allowedControlKeys.includes(e.key)) {
    return;
  }

  if (!/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Removes all non-digit characters from a string. Ideal for cleaning pasted text in onChange.
 * Example: "abc123xyz" -> "123"
 */
export const sanitizeDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Removes characters that are not digits or a decimal point.
 */
export const sanitizeDecimal = (value: string): string => {
  const parts = value.replace(/[^0-9.]/g, '').split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return parts.join('.');
};

/**
 * Removes numbers, digits, and special characters from a string, allowing only alphabets (a-z, A-Z) and spaces.
 * Example: "John123 Doe!" -> "John Doe"
 */
export const sanitizeLetters = (value: string): string => {
  return value.replace(/[^a-zA-Z\s]/g, '');
};

/**
 * Removes numbers, spaces, and special characters, keeping only letters (a-z, A-Z).
 * Example: "John 123" -> "John"
 */
export const sanitizeLettersNoSpace = (value: string): string => {
  return value.replace(/[^a-zA-Z]/g, '');
};

/**
 * Validates if a string contains ONLY digits.
 */
export const isDigitsOnly = (value: string): boolean => {
  return /^\d+$/.test(value);
};

/**
 * Validates if a string contains ONLY alphabets (and optional spaces).
 */
export const isLettersOnly = (value: string, allowSpace: boolean = true): boolean => {
  const pattern = allowSpace ? /^[a-zA-Z\s]+$/ : /^[a-zA-Z]+$/;
  return pattern.test(value);
};

/**
 * Validates if a string or number is a valid positive integer > 0.
 */
export const isPositiveInteger = (value: string | number): boolean => {
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num) && num > 0;
};
