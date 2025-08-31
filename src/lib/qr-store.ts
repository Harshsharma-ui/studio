
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

export async function resetAllData(): Promise<{ success: boolean; message: string }> {
    console.log('Resetting all QR code data...');
    validQRCodes.clear();
    memberQRCodes.clear();
    checkedInMembers.clear();
    console.log('All data has been reset.');
    return { success: true, message: 'All QR codes and check-in data have been reset.' };
}

export async function generateMemberQRCode(memberId: string): Promise<string> {
  // If user already has a code, return it to ensure persistence.
  if (memberQRCodes.has(memberId)) {
    return memberQRCodes.get(memberId)!;
  }
  
  const newCode = randomUUID();
  memberQRCodes.set(memberId, newCode);
  validQRCodes.set(newCode, memberId);
  checkedInMembers.delete(memberId); // Ensure member is not checked-in if a new code is somehow generated
  
  console.log(`Generated QR code for ${memberId}. Total valid codes: ${validQRCodes.size}`);
  return newCode;
}

export async function verifyAndInvalidateQRCode(code: string): Promise<{ success: boolean; message: string }> {
  if (validQRCodes.has(code)) {
    const memberId = validQRCodes.get(code)!;
    
    if (checkedInMembers.has(memberId)) {
        return { success: false, message: `Member ${memberId} has already been checked in.` };
    }

    // A code is single-use. We don't delete from validQRCodes, but we do add to checkedInMembers
    checkedInMembers.add(memberId);
    
    return { success: true, message: `Check-in for ${memberId} successful. Welcome!` };
  }
  return { success: false, message: 'Invalid or already used QR code. Please try another.' };
}

export async function checkInMemberById(memberId: string): Promise<{ success: boolean; message: string }> {
  if (!memberId) {
    return { success: false, message: 'Member ID cannot be empty.' };
  }
  if (checkedInMembers.has(memberId)) {
    return { success: false, message: `Member ${memberId} has already been checked in.` };
  }
  
  checkedInMembers.add(memberId);
  
  return { success: true, message: `Successfully checked in ${memberId}.` };
}

export async function getCheckedInMembers(): Promise<string[]> {
    return Array.from(checkedInMembers);
}

export async function getPreGeneratedCodes(memberIds: string[]): Promise<Array<{memberId: string, qrCode: string}>> {
    const codes = await Promise.all(memberIds.map(async (id) => {
        const qrCode = await generateMemberQRCode(id);
        return { memberId: id, qrCode };
    }));
    return codes;
}

// Clear checkedInMembers at startup if desired for a clean event start, but not QR codes.
// For this case, we want checked in members to persist across reloads for the demo.
// To clear checked-in members for a new event, use the "Reset All Data" button in the Admin panel.
