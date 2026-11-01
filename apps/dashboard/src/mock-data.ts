/**
 * Sample figures for the dashboard layout. None of these values come from the
 * API or from real buses. The dashboard does not read live data yet.
 */
export const MOCK_DATA_NOTICE =
  'Mock data. Every figure on this page is a sample value for layout review. It is not read from the API or from any bus.';

export interface Metric {
  label: string;
  value: string;
  note: string;
  warn?: boolean;
}

export const mockMetrics: Metric[] = [
  { label: 'Active buses', value: '18', note: 'of 24 qualified (sample)' },
  { label: 'Passengers aboard', value: '642', note: 'Across active trips (sample)' },
  { label: 'Open alerts', value: '3', note: '1 needs acknowledgement (sample)', warn: true },
  { label: 'GPS freshness', value: '96%', note: 'Last 60 seconds (sample)' },
];

export interface MockAlert {
  bus: string;
  issue: string;
  age: string;
}

export const mockAlerts: MockAlert[] = [
  { bus: 'Bus 12', issue: 'Stale GPS', age: '2m 14s' },
  { bus: 'Bus 08', issue: 'Camera SD-only', age: '18m' },
  { bus: 'Bus 21', issue: 'Route deviation', age: 'Now' },
];

export const plannedSections = ['Trips', 'Attendance', 'Routes', 'Fleet', 'Devices', 'Roster sync', 'Audit'];
