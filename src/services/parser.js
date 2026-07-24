const cheerio = require('cheerio');

function parseHtml(html, responseTimeMs) {
  const $ = cheerio.load(html);
  const pageSizeBytes = Buffer.byteLength(html, 'utf8');

  const title = $('title').text().trim() || null;

  const metaDescription = $('meta[name="description"]').attr('content') || null;
  const metaViewport = $('meta[name="viewport"]').attr('content') || null;
  const metaRobots = $('meta[name="robots"]').attr('content') || null;

  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;

  const openGraph = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property').replace('og:', '');
    openGraph[property] = $(el).attr('content') || '';
  });
  const hasOpenGraph = Object.keys(openGraph).length > 0 ? openGraph : null;

  const twitterCard = {};
  $('meta[name^="twitter:"], meta[name^="twitter-card"]').each((_, el) => {
    const name = $(el).attr('name').replace('twitter:', '').replace('twitter-card:', 'twitter:card');
    twitterCard[name] = $(el).attr('content') || '';
  });
  const hasTwitterCard = Object.keys(twitterCard).length > 0 ? twitterCard : null;

  const headings = { h1: [], h2: [], h3: [] };
  $('h1').each((_, el) => headings.h1.push($(el).text().trim()));
  $('h2').each((_, el) => headings.h2.push($(el).text().trim()));
  $('h3').each((_, el) => headings.h3.push($(el).text().trim()));

  const linkCount = $('a[href]').length;

  const imageCount = $('img').length;
  const imageAltMissing = $('img').filter((_, el) => $(el).attr('alt') === undefined).length;

  const scripts = [];
  $('script[src]').each((_, el) => scripts.push($(el).attr('src')));

  const stylesheets = [];
  $('link[rel="stylesheet"]').each((_, el) => stylesheets.push($(el).attr('href')));

  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;

  return {
    title,
    metaDescription,
    metaViewport,
    metaRobots,
    canonicalUrl,
    openGraph: hasOpenGraph,
    twitterCard: hasTwitterCard,
    headings,
    linkCount,
    imageCount,
    imageAltMissing,
    scripts,
    stylesheets,
    hasFavicon,
    pageSizeBytes: pageSizeBytes,
    responseTimeMs,
  };
}

module.exports = { parseHtml };
