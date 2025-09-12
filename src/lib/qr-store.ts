
import 'server-only';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

// Path to the file that will store our data
const dataFilePath = path.join(process.cwd(), 'checked-in-data.json');

// This declaration is to extend the NodeJS.Global interface
declare global {
  var checkedInMembers: Set<string>; // Stores memberIds of checked-in users
}

let checkedInMembers: Set<string>;

// Function to read data from the file
function loadStore(): Set<string> {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf-8');
            const parsedData = JSON.parse(data);
            return new Set<string>(parsedData.checkedInMembers || []);
        }
    } catch (error) {
        console.error('Error loading check-in store:', error);
    }
    // If file doesn't exist or is invalid, start with an empty set
    return new Set<string>();
}

// Function to save data to the file
function saveStore(store: Set<string>) {
    try {
        const dataToSave = {
            checkedInMembers: Array.from(store).sort(),
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
        console.error('Error saving check-in store:', error);
    }
}

function initializeStore() {
  // In a development environment, Next.js can clear the require cache on every request,
  // which would cause us to re-initialize and potentially lose in-memory data.
  // Storing the Set in a global variable is a workaround for this hot-reloading behavior.
  if (process.env.NODE_ENV === 'production') {
    if (!checkedInMembers) {
        checkedInMembers = loadStore();
    }
  } else {
    if (!global.checkedInMembers) {
        console.log('Initializing check-in store from file for development...');
        global.checkedInMembers = loadStore();
        console.log(`Check-in store initialized with ${global.checkedInMembers.size} members.`);
    }
    checkedInMembers = global.checkedInMembers;
  }
}

initializeStore();

function generateDeterministicQRCode(memberId: string): string {
    const hash = createHash('sha256');
    hash.update(memberId);
    return hash.digest('hex').substring(0, 8).toUpperCase();
}

function getMemberIdFromCode(code: string, memberIds: string[]): string | null {
    return memberIds.find(id => generateDeterministicQRCode(id) === code) || null;
}

export async function resetAllData(): Promise<{ success: boolean; message: string }> {
    console.log('Resetting all check-in data...');
    checkedInMembers.clear();
    saveStore(checkedInMembers); // Save the empty set to the file
    console.log('All check-in data has been reset.');
    return { success: true, message: 'All check-in data have been reset.' };
}

export async function generateMemberQRCode(memberId: string): Promise<string> {
    const code = generateDeterministicQRCode(memberId);
    return code;
}

export async function verifyAndInvalidateQRCode(code: string): Promise<{ success: boolean; message: string }> {
  const maxMembers = 5000;
  // It's not efficient to guess all ad-hoc members. We will check against the code first.
  const allPossibleMemberIds = Array.from({ length: maxMembers }, (_, i) => `member-${i + 1}`);
  
  const memberIdFromCode = getMemberIdFromCode(code, allPossibleMemberIds);
  const memberIdToCheck = memberIdFromCode || code; // Treat the code as a potential memberId

  // The list of possible members includes pre-defined ones and any that have ever been checked in (ad-hoc)
  const isKnownMember = allPossibleMemberIds.includes(memberIdToCheck) || checkedInMembers.has(memberIdToCheck);

  if (checkedInMembers.has(memberIdToCheck)) {
    return { success: false, message: `Member ${memberIdToCheck} has already been checked in.` };
  }

  // Allow check-in for known members or any manually entered ID
  checkedInMembers.add(memberIdToCheck);
  saveStore(checkedInMembers); // Persist the new check-in
  
  return { success: true, message: `Check-in for ${memberIdToCheck} successful. Welcome!` };
}

export async function checkInMemberById(memberId: string): Promise<{ success: boolean; message: string }> {
  if (!memberId) {
    return { success: false, message: 'Member ID cannot be empty.' };
  }
  if (checkedInMembers.has(memberId)) {
    return { success: false, message: `Member ${memberId} has already been checked in.` };
  }
  
  // For manual check-in, we allow any ID.
  checkedInMembers.add(memberId);
  saveStore(checkedInMembers); // Persist the new check-in
  
  return { success: true, message: `Successfully checked in ${memberId}.` };
}

export async function getCheckedInMembers(): Promise<string[]> {
    // Return a sorted array for consistent display
    return Array.from(checkedInMembers).sort();
}

export async function getPreGeneratedCodes(memberIds: string[]): Promise<Array<{memberId: string, qrCode: string}>> {
    const codes = await Promise.all(memberIds.map(async (id) => {
        const qrCode = await generateMemberQRCode(id);
        return { memberId: id, qrCode };
    }));
    return codes;
}
