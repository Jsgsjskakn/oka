export interface BookingDetails {
  id?: string;
  date: string;
  time: string;
  guests: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialRequests?: string;
  occasion?: string;
  tablePreference?: string;
}
