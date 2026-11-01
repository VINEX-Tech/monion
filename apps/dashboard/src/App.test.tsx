import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { mockMetrics } from './mock-data';

describe('dashboard', () => {
  const html = renderToStaticMarkup(<App />);

  it('labels the figures as mock data', () => {
    expect(html).toContain('MOCK DATA');
    expect(html).toContain('not read from the API');
  });

  it('marks every metric note as a sample', () => {
    for (const metric of mockMetrics) expect(metric.note).toMatch(/\(sample\)$/);
  });

  it('does not claim live data', () => {
    expect(html).not.toMatch(/\bLIVE\b/);
  });

  it('keeps the unbuilt export disabled', () => {
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Export report \(not built yet\)<\/button>/);
  });
});
