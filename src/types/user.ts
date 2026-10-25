export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
}

export interface MockOTPState {
  phoneNumber: string;
  otpSent: boolean;
  otpVerified: boolean;
}
