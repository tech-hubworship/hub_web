export interface DepartureSlot {
  value: string;
  label: string;
  max_count: number; // 0 = 무제한
  is_active: boolean;
}

export interface ReturnSlot {
  value: string;
  label: string;
  max_count: number;
  is_active: boolean;
}

export interface ElectiveLecture {
  value: string;
  label: string;
}

export interface HubUpConfig {
  registration_open: string;
  registration_deadline: string;
  fee_early_bird: string;
  fee_early_bird_until: string;
  fee_regular: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  contact_name: string;
  contact_phone: string;
  event_dates: string;
  event_venue: string;
  event_venue_address: string;
  max_capacity: string;
  [key: string]: string;
}

export interface FormData {
  community: string;
  group: string;
  leaderName: string;
  name: string;
  gender: string;
  birthdate: string;
  phone: string;
  privacyConsent: boolean;
  departureBusTime: string;
  returnBusTime: string;
  carRole: '' | '자가운전자' | '동승자' | '택시 및 대중교통';
  carPassengerCount: string;
  carPassengerNames: string;
  carPlateNumber: string;
  carArrivalTime: string;
  carDepartureTime: string;
  electiveLecture: string;
  depositConfirm: boolean;
  intercessorTeam: string;
  volunteerTeam: string;
  finalSubmitConfirm: boolean;
}
