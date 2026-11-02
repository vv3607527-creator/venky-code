const UPSTREAM_URL = 'https://github.com/aicodeking/pandacode';
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, character => ENTITIES[character]);
}

export function licenseTextToHtml(text) {
  if (typeof text !== 'string') throw new TypeError('License text must be a string.');
  const escaped = escapeHtml(text);
  const urlCount = escaped.split(UPSTREAM_URL).length - 1;
  if (urlCount !== 1) throw new Error('Expected one upstream URL in the repository license text.');
  return escaped.replace(
    UPSTREAM_URL,
    `<a href="${UPSTREAM_URL}" target="_blank" rel="noopener noreferrer">${UPSTREAM_URL}</a>`,
  );
}
