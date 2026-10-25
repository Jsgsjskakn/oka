import type { BookingDetails } from '@/types/booking';

export const mockReservations: BookingDetails[] = [
  {
    id: 'GO-7291',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    time: '08:00 PM',
    guests: 4,
    customerName: 'Guest User',
    customerPhone: '9876543210',
    customerEmail: 'guest@example.com',
    specialRequests: 'Corner table if possible',
    occasion: 'Anniversary',
    tablePreference: 'Indoor',
  },
  {
    id: 'GO-6183',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    time: '07:30 PM',
    guests: 2,
    customerName: 'Guest User',
    customerPhone: '9876543210',
    customerEmail: 'guest@example.com',
    occasion: 'Birthday',
    tablePreference: 'Outdoor',
  },
  {
    id: 'GO-5072',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    time: '01:00 PM',
    guests: 6,
    customerName: 'Guest User',
    customerPhone: '9876543210',
    customerEmail: 'guest@example.com',
    occasion: 'Business',
    tablePreference: 'Indoor',
    specialRequests: 'Need projector setup',
  },
];
