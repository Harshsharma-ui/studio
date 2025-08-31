import 'server-only';
import { randomUUID } from 'crypto';

// This declaration is to extend the NodeJS.Global interface
declare global {
  var validQRCodes: Set<string>;
}

let validQRCodes: Set<string>;

const TOTAL_CODES = 3000;

function initializeQRCodes() {
  // Use a global variable to persist the Set across hot reloads in development.
  if (global.validQRCodes) {
    validQRCodes = global.validQRCodes;
  } else {
    console.log('Initializing QR code store...');
    validQRCodes = new Set();
    for (let i = 0; i < TOTAL_CODES; i++) {
      validQRCodes.add(randomUUID());
    }
    global.validQRCodes = validQRCodes;
    console.log(`${validQRCodes.size} QR codes initialized.`);
  }
}

initializeQRCodes();

export function getSampleValidCode(): string | null {
  if (validQRCodes.size === 0) {
    return null;
  }
  // Return a sample code for simulation purposes without removing it yet.
  return validQRCodes.values().next().value;
}

export async function verifyAndInvalidateQRCode(code: string): Promise<{ success: boolean; message: string }> {
  if (validQRCodes.has(code)) {
    validQRCodes.delete(code);
    return { success: true, message: `Check-in successful. Welcome! Remaining tickets: ${validQRCodes.size}` };
  }
  return { success: false, message: 'Invalid or already used QR code. Please try another.' };
}
