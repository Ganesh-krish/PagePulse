const fs = require('fs');
const path = require('path');
const { parseHtml } = require('../../src/services/parser');

const sampleHtml = fs.readFileSync(path.join(__dirname, '../fixtures/sample-html.html'), 'utf8');
const malformedHtml = fs.readFileSync(path.join(__dirname, '../fixtures/malformed.html'), 'utf8');

describe('Parser', () => {
  it('extracts title', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.title).toBe('Sample Page');
  });

  it('extracts meta tags', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.metaDescription).toBe('Sample page description');
    expect(result.metaViewport).toBe('width=device-width, initial-scale=1');
    expect(result.metaRobots).toBe('index, follow');
  });

  it('extracts canonical URL', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.canonicalUrl).toBe('https://example.com/canonical');
  });

  it('extracts Open Graph tags', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.openGraph).toEqual({
      title: 'Open Graph Title',
      description: 'Open Graph Description',
      image: 'https://example.com/og.jpg',
      url: 'https://example.com',
    });
  });

  it('extracts Twitter Card tags', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.twitterCard).toEqual({
      card: 'summary',
      title: 'Twitter Title',
      description: 'Twitter Description',
      image: 'https://example.com/twitter.jpg',
    });
  });

  it('collects headings', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.headings.h1).toEqual(['Main Heading']);
    expect(result.headings.h2).toEqual(['Subheading 1', 'Subheading 2']);
    expect(result.headings.h3).toEqual(['Sub-subheading']);
  });

  it('counts links and images', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.linkCount).toBe(2);
    expect(result.imageCount).toBe(3);
  });

  it('counts images missing alt', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.imageAltMissing).toBe(1);
  });

  it('extracts scripts and stylesheets', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.scripts).toEqual(['/script1.js', '/script2.js']);
    expect(result.stylesheets).toEqual(['/styles.css']);
  });

  it('detects favicon presence', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(result.hasFavicon).toBe(true);
  });

  it('returns nulls and empty arrays for missing tags', () => {
    const result = parseHtml('<html><head><title>Only Title</title></head><body></body></html>', 50);
    expect(result.metaDescription).toBeNull();
    expect(result.openGraph).toBeNull();
    expect(result.headings.h1).toEqual([]);
    expect(result.imageCount).toBe(0);
  });

  it('handles malformed HTML without crashing', () => {
    expect(() => parseHtml(malformedHtml, 50)).not.toThrow();
    const result = parseHtml(malformedHtml, 50);
    expect(result.title).toBe('Malformed');
  });

  it('returns correct pageSizeBytes', () => {
    const result = parseHtml(sampleHtml, 100);
    expect(typeof result.pageSizeBytes).toBe('number');
    expect(result.pageSizeBytes).toBeGreaterThan(0);
  });
});
