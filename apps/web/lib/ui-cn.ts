export type ClassValue = string | false | null | undefined;

/**
 * Dependency-free className joiner for Acongm UI primitives.
 * Keep variant composition explicit so shared UI does not force runtime helpers.
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
