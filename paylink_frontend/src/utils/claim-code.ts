export function generateClaimCode(length = 12) {
  const array = new Uint8Array(Math.ceil(length / 2));
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}