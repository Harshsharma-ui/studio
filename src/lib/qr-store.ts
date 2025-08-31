import 'server-only';
import { randomUUID } from 'crypto';

// This declaration is to extend the NodeJS.Global interface
declare global {
  var memberQRCodes: Map<string, string>; // Maps memberId to qrCode
  var validQRCodes: Map<string, string>;  // Maps qrCode to memberId
  var checkedInMembers: Set<string>; // Stores memberIds of checked-in users
}

let memberQRCodes: Map<string, string>;
let validQRCodes: Map<string, string>;
let checkedInMembers: Set<string>;


function initializeQRCodes() {
  if (global.validQRCodes && global.memberQRCodes && global.checkedInMembers) {
    validQRCodes = global.validQRCodes;
    memberQRCodes = global.memberQRCodes;
    checkedInMembers = global.checkedInMembers;
  } else {
    console.log('Initializing QR code store...');
    validQRCodes = new Map();
    memberQRCodes = new Map();
    checkedInMembers = new Set();
    global.validQRCodes = validQRCodes;
    global.memberQRCodes = memberQRCodes;
    global.checkedInMembers = checkedInMembers;
    console.log('QR code store initialized.');
  }
}

initializeQRCodes();

export async function generateMemberQRCode(memberId: string): Promise<string> {
  // If user already has a code, return it
  if (memberQRCodes.has(memberId)) {
    // To allow re-generation for demo purposes, we don't return old code.
    // Instead we invalidate old and create new.
    const oldCode = memberQRCodes.get(memberId)!;
    validQRCodes.delete(oldCode);
  }
  
  const newCode = randomUUID();
  memberQRCodes.set(memberId, newCode);
  validQRCodes.set(newCode, memberId);
  checkedInMembers.delete(memberId); // Remove from checked-in if generating a new code
  
  console.log(`Generated QR code for ${memberId}. Total valid codes: ${validQRCodes.size}`);
  return newCode;
}

export async function verifyAndInvalidateQRCode(code: string): Promise<{ success: boolean; message: string }> {
  if (validQRCodes.has(code)) {
    const memberId = validQRCodes.get(code)!;
    
    if (checkedInMembers.has(memberId)) {
        return { success: false, message: `Member ${memberId} has already been checked in.` };
    }

    validQRCodes.delete(code);
    memberQRCodes.delete(memberId); // A code is single-use.
    checkedInMembers.add(memberId);
    
    return { success: true, message: `Check-in for ${memberId} successful. Welcome!` };
  }
  return { success: false, message: 'Invalid or already used QR code. Please try another.' };
}

export async function getCheckedInMembers(): Promise<string[]> {
    return Array.from(checkedInMembers);
}
