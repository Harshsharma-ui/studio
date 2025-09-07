
import 'server-only';
import { createHash } from 'crypto';

// This declaration is to extend the NodeJS.Global interface
declare global {
  var checkedInMembers: Set<string>; // Stores memberIds of checked-in users
}

let checkedInMembers: Set<string>;


function initializeStore() {
  if (global.checkedInMembers) {
    checkedInMembers = global.checkedInMembers;
  } else {
    console.log('Initializing check-in store...');
    checkedInMembers = new Set();
    global.checkedInMembers = checkedInMembers;
    console.log('Check-in store initialized.');
  }
}

initializeStore();

function generateDeterministicQRCode(memberId: string): string {
    // Create a SHA-256 hash of the memberId, take the first 8 chars, and make it uppercase.
    // This creates a unique, deterministic, non-sequential-looking alphanumeric code.
    const hash = createHash('sha256');
    hash.update(memberId);
    return hash.digest('hex').substring(0, 8).toUpperCase();
}

function getMemberIdFromCode(code: string, memberIds: string[]): string | null {
    // In a real-world scenario, you'd have a reverse lookup.
    // Here we find the memberId that generates the given code.
    return memberIds.find(id => generateDeterministicQRCode(id) === code) || null;
}

export async function resetAllData(): Promise<{ success: boolean; message: string }> {
    console.log('Resetting all check-in data...');
    checkedInMembers.clear();
    console.log('All check-in data has been reset.');
    return { success: true, message: 'All check-in data have been reset.' };
}

export async function generateMemberQRCode(memberId: string): Promise<string> {
    const code = generateDeterministicQRCode(memberId);
    console.log(`Generated permanent QR code for ${memberId}.`);
    return code;
}

export async function verifyAndInvalidateQRCode(code: string): Promise<{ success: boolean; message: string }> {
  // To validate, we need to know the possible memberIds. We'll generate them on the fly.
  const maxMembers = 5000;
  // This also includes any ad-hoc members created via the admin panel.
  const adHocMembers = Array.from(checkedInMembers);
  const allPossibleMemberIds = Array.from(new Set(
      Array.from({ length: maxMembers }, (_, i) => `member-${i + 1}`).concat(adHocMembers)
  ));
  
  const memberId = getMemberIdFromCode(code, allPossibleMemberIds);

  if (memberId) {
    if (checkedInMembers.has(memberId)) {
      return { success: false, message: `Member ${memberId} has already been checked in.` };
    }

    checkedInMembers.add(memberId);
    
    return { success: true, message: `Check-in for ${memberId} successful. Welcome!` };
  }

  // Also check if the code is a memberId itself for manual check-in
  if (allPossibleMemberIds.includes(code)) {
     if (checkedInMembers.has(code)) {
      return { success: false, message: `Member ${code} has already been checked in.` };
    }
    checkedInMembers.add(code);
    return { success: true, message: `Check-in for ${code} successful. Welcome!` };
  }


  return { success: false, message: 'Invalid QR code. Please try another.' };
}

export async function checkInMemberById(memberId: string): Promise<{ success: boolean; message: string }> {
  if (!memberId) {
    return { success: false, message: 'Member ID cannot be empty.' };
  }
  if (checkedInMembers.has(memberId)) {
    return { success: false, message: `Member ${memberId} has already been checked in.` };
  }
  
  // This is a simplified check. A real app would verify against a member database.
  const maxMembers = 5000;
  const preGeneratedMemberIds = Array.from({ length: maxMembers }, (_, i) => `member-${i + 1}`);
  if (!preGeneratedMemberIds.includes(memberId)) {
    console.log(`Ad-hoc member ${memberId} checked in. Not in pre-generated list.`)
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
