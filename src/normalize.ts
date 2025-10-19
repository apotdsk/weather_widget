import countries from 'i18n-iso-countries';

export function normalizeInput(input: string): [string, string?] {
  const parts = input.split(/[,;]+/);
  const city = capitalize(parts[0]!);
  let countryCode: string | undefined;
  for (const part of parts.slice(1)) {
    countryCode =
      countries.getAlpha2Code(part, 'en') ||
      countries.getAlpha2Code(part, 'uk') ||
      (/^[A-Z]{2}$/i.test(part) ? part.toUpperCase() : undefined);
    if (countryCode) break;
  }
  return countryCode ? [city, countryCode] : [city];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
