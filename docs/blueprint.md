# **App Name**: AttendEase

## Core Features:

- QR Code Check-in: Scan user's QR code at the event entrance to verify their registration. This app does not retain the user data after the QR code check. No personal identifiable information is persisted at any time.
- Check-in Validation: Cross-reference scanned QR code against a temporary in-memory data structure to ensure it's valid and hasn't been used before. The check-in validation deletes any record or information regarding that record to prevent tracking of attendees. 
- One-Time Use: Prevent re-entry by invalidating the QR code upon successful check-in during the current session. 
- AI Event Suggestion Tool: Provide personalized event suggestions based on user preferences, past attendance and the event's description. Use AI tool to filter the events depending on the parameters that better suits the user. 
- User-friendly Interface: Intuitive interface for scanning QR codes and viewing event details.

## Style Guidelines:

- Primary color: Deep violet (#6852BB) to convey sophistication and innovation.
- Background color: Very light purple (#F8F7FC), near white, to ensure readability and a clean interface.
- Accent color: Cyan (#42CBCF) to draw attention to important interactive elements.
- Font: 'Inter' (sans-serif) for a modern, neutral and highly readable text.
- Use minimalist, outline-style icons to represent event features and actions.
- Clean, modern layout with a focus on readability and ease of use. Use a grid system for consistent spacing and alignment.
- Subtle animations to provide feedback on user interactions and guide the user through the check-in process.