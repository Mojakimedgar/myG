/**
 * Normalize a phone number for tel: and sms: links.
 * Keeps only + and digits (strips spaces, dashes, parentheses).
 */
export function normalizePhoneNumber(number: string): string {
  const trimmed = (number || "").trim();
  return trimmed.replace(/[\s\-\(\)\.]/g, "").replace(/^0+/, "");
}

/**
 * Open the device's phone dialer (or default call app) with the given number.
 * Works on mobile (native dialer) and desktop (if an app handles tel:).
 */
export function openCall(phoneNumber: string): boolean {
  const number = normalizePhoneNumber(phoneNumber);
  if (!number) return false;
  const telUrl = `tel:${encodeURIComponent(number)}`;
  try {
    const link = document.createElement("a");
    link.href = telUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    window.location.href = telUrl;
    return true;
  }
}

/**
 * Open the device's SMS/messaging app with the given number and optional message body.
 * Works on mobile (native Messages/SMS) and some desktop environments.
 */
export function openMessage(phoneNumber: string, body?: string): boolean {
  const number = normalizePhoneNumber(phoneNumber);
  if (!number) return false;
  let smsUrl = `sms:${encodeURIComponent(number)}`;
  if (body != null && body.trim() !== "") {
    smsUrl += `?body=${encodeURIComponent(body.trim())}`;
  }
  try {
    const link = document.createElement("a");
    link.href = smsUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    window.location.href = smsUrl;
    return true;
  }
}
