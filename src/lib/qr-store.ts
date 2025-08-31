import 'server-only';
import { randomUUID } from 'crypto';

// This declaration is to extend the NodeJS.Global interface
declare global {
  var memberQRCodes: Map<string, string>; // Maps memberId to qrCode
  var validQRCodes: Map<string, string>;  // Maps qrCode to memberId
}

let memberQRCodes: Map<string, string>;
let validQRCodes: Map<string, string>;

function initializeQRCodes() {
  if (global.validQRCodes && global.memberQRCodes) {
    validQRCodes = global.validQRCodes;
    memberQRCodes = global.memberQRCodes;
  } else {
    console.log('Initializing QR code store...');
    validQRCodes = new Map();
    memberQRCodes = new Map();
    global.validQRCodes = validQRCodes;
    global.memberQRCodes = memberQRCodes;
    console.log('QR code store initialized.');
  }
}

initializeQRCodes();

export async function generateMemberQRCode(memberId: string): Promise<string> {
  // If user already has a code, return it
  if (memberQRCodes.has(memberId)) {
    return memberQRCodes.get(memberId)!;
  }
  
  const newCode = randomUUID();
  memberQRCodes.set(memberId, newCode);
  validQRCodes.set(newCode, memberId);
  
  console.log(`Generated QR code for ${memberId}. Total codes: ${validQRCodes.size}`);
  return newCode;
}

export async function verifyAndInvalidateQRCode(code: string): Promise<{ success: boolean; message: string }> {
  if (validQRCodes.has(code)) {
    const memberId = validQRCodes.get(code)!;
    validQRCodes.delete(code);
    memberQRCodes.delete(memberId); // Invalidate the code for the member
    
    return { success: true, message: `Check-in for ${memberId} successful. Welcome! Remaining tickets: ${validQRCodes.size}` };
  }
  return { success: false, message: 'Invalid or already used QR code. Please try another.' };
}
