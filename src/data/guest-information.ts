import { resort, rooms } from '@/data/resort';
export const resortContact = { verified: false, address: resort.address, phone: resort.phone, email: resort.email, mapUrl: '' };
export const policySections = [
  { title: 'Check-in & check-out', text: `The current demonstration lists check-in at ${resort.checkInTime} and check-out at ${resort.checkOutTime}. Times, identification requirements and early arrivals need resort confirmation.` },
  { title: 'Booking & reservations', text: 'The booking flow records a pending reservation request. Availability, final confirmation and any deposit requirements need resort confirmation.' },
  { title: 'Cancellation & refunds', text: 'Cancellation deadlines, charges and refund eligibility have not been supplied. Resort confirmation required before relying on a refund or making travel commitments.' },
  { title: 'Payment information', text: 'Live payments are not connected. Payment Ready/Test does not mean paid; saving a request does not charge money. Accepted methods, taxes and payment deadlines need resort confirmation.' },
  { title: 'Children & extra guests', text: `Listed room capacities range from ${Math.min(...rooms.map(r => r.capacity))} to ${Math.max(...rooms.map(r => r.capacity))} guests. Children’s age limits, extra beds and additional charges need resort confirmation.` },
  { title: 'Pet policy', text: 'Pet permissions, restrictions and any fees have not been supplied. Resort confirmation required before bringing a pet.' },
  { title: 'Resort rules & guest safety', text: 'Quiet hours, pool rules, smoking areas, accessibility and emergency arrangements need resort confirmation. Activity difficulty and guest suitability are listed with each experience.' },
];
export const guestFaqs = [
  { question: 'What are the check-in and check-out times?', answer: policySections[0].text },
  { question: 'Does saving my booking confirm my reservation?', answer: 'No. Requests are recorded as Pending and need resort confirmation; a saved request is not a confirmed stay.' },
  { question: 'Have I paid when I see Payment Ready/Test?', answer: policySections[3].text },
  { question: 'Can I cancel and receive a refund?', answer: policySections[2].text },
  { question: 'Can children or extra guests stay?', answer: policySections[4].text },
  { question: 'Are pets allowed?', answer: policySections[5].text },
  { question: 'How can I plan a trek or activity?', answer: 'Visit Activities & Trek Advisor in Dashboard. Each experience lists its duration, difficulty and suitability. Planned slots require resort confirmation.' },
  { question: 'Where can I get verified directions?', answer: 'Visit How to Reach Us for the current information status. The exact address, map pin and transport details still need resort confirmation.' },
];