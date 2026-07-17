export type ReservationRequest = {
  propertySlug: string;
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  message?: string;
};

export type Reservation = ReservationRequest & {
  id: string;
  status: "pending";
  createdAt: string;
};
