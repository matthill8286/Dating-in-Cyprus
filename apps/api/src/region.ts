export const EU_AZURE_REGIONS = [
  'westeurope',
  'northeurope',
  'swedencentral',
  'germanywestcentral',
  'francecentral',
  'italynorth',
  'polandcentral',
  'spaincentral',
] as const;

export type EuAzureRegion = (typeof EU_AZURE_REGIONS)[number];

export function isEuAzureRegion(value: string): value is EuAzureRegion {
  return (EU_AZURE_REGIONS as readonly string[]).includes(value);
}
