import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndNormalizeUrl,
  generateSixDigitCode,
  extractShortCode,
  buildShortenPayload,
  parseShortenResponse,
  filterLinks,
  formatCopyConfirmation,
  buildVercelConfig,
  buildVercelDeployUrl,
  ShortenedLinkItem,
} from './urlShortenerLogic';

test('validateAndNormalizeUrl rejects empty and invalid URLs and normalizes valid ones', () => {
  const emptyRes = validateAndNormalizeUrl('   ');
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.error);

  const spaceRes = validateAndNormalizeUrl('https://example.com/with space');
  assert.equal(spaceRes.valid, false);

  const badDomain = validateAndNormalizeUrl('justaword');
  assert.equal(badDomain.valid, false);

  const validFull = validateAndNormalizeUrl('https://fastapi.tiangolo.com/tutorial/');
  assert.equal(validFull.valid, true);
  assert.equal(validFull.normalizedUrl, 'https://fastapi.tiangolo.com/tutorial/');

  const bareDomain = validateAndNormalizeUrl('github.com/tiangolo/fastapi');
  assert.equal(bareDomain.valid, true);
  assert.equal(bareDomain.normalizedUrl, 'https://github.com/tiangolo/fastapi');
});

test('generateSixDigitCode produces a 6-digit string matching string.digits', () => {
  const code = generateSixDigitCode();
  assert.match(code, /^\d{6}$/);

  let counter = 1;
  const deterministic = generateSixDigitCode(() => counter++);
  assert.equal(deterministic, '123456');
});

test('extractShortCode extracts 6-digit code from raw code or FastAPI short_url', () => {
  const fromRaw = extractShortCode('482910');
  assert.equal(fromRaw.valid, true);
  assert.equal(fromRaw.shortCode, '482910');

  const fromUrl = extractShortCode('http://localhost:8000/904128');
  assert.equal(fromUrl.valid, true);
  assert.equal(fromUrl.shortCode, '904128');

  const invalid = extractShortCode('abc123');
  assert.equal(invalid.valid, false);
});

test('buildShortenPayload and parseShortenResponse match FastAPI contract', () => {
  const payload = buildShortenPayload('https://example.com/docs');
  assert.deepEqual(payload, { url: 'https://example.com/docs' });

  const item = parseShortenResponse(
    { short_url: 'http://localhost:8000/582019' },
    'https://example.com/docs',
    '2026-11-02T01:00:00.000Z'
  );
  assert.equal(item.shortCode, '582019');
  assert.equal(item.shortUrl, 'http://localhost:8000/582019');
  assert.equal(item.originalUrl, 'https://example.com/docs');
});

test('filterLinks filters by shortCode, shortUrl, or originalUrl', () => {
  const sample: ShortenedLinkItem[] = [
    {
      shortCode: '482910',
      shortUrl: 'http://localhost:8000/482910',
      originalUrl: 'https://fastapi.tiangolo.com/tutorial/first-steps/',
      createdAt: '2026-11-02T01:00:00.000Z',
    },
    {
      shortCode: '739104',
      shortUrl: 'http://localhost:8000/739104',
      originalUrl: 'https://docs.pydantic.dev/latest/concepts/models/',
      createdAt: '2026-11-02T01:05:00.000Z',
    },
  ];

  assert.equal(filterLinks(sample, '482910').length, 1);
  assert.equal(filterLinks(sample, 'pydantic').length, 1);
  assert.equal(filterLinks(sample, 'nonexistent').length, 0);
  assert.equal(filterLinks(sample, '').length, 2);
});

test('formatCopyConfirmation returns clear clipboard confirmation message', () => {
  assert.equal(
    formatCopyConfirmation('http://localhost:8000/482910'),
    'Copied http://localhost:8000/482910 to clipboard'
  );
});

test('buildVercelConfig and buildVercelDeployUrl generate valid Vercel deployment definitions', () => {
  const nodeCfg = buildVercelConfig('node');
  assert.equal(nodeCfg.framework, 'vite');
  assert.equal(nodeCfg.outputDirectory, 'dist');
  assert.equal(nodeCfg.rewrites[0].destination, '/api/index');

  const pyCfg = buildVercelConfig('python');
  assert.equal(pyCfg.rewrites[0].destination, '/main.py');

  const deployUrl = buildVercelDeployUrl('https://github.com/Raunaq12/SixDigit');
  assert.ok(deployUrl.includes('https://vercel.com/new/import?s='));
  assert.ok(deployUrl.includes(encodeURIComponent('https://github.com/Raunaq12/SixDigit')));
});
