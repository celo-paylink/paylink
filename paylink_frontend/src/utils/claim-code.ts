export function generateClaimCode() {
    return window.crypto.randomUUID().replace(/-/g, '');
}
