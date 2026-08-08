export type StudentStatus = 'Pending' | 'Enrolled' | 'Registered' | 'Graduated' | 'Dropout';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface StudentPaymentSummary {
  id: number;
  student_id: string;
  registration_fee: number;
  course_fee: number;
  full_amount_payable: number;
  amount_paid: number;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_completed: boolean;
  payment_reference: string;
  transaction_id?: string | null;
  receipt_number?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  course: string;
  batch: string;
  studentCategory?: string | null;
  nic?: string | null;
  passport?: string | null;
  application_number?: string | null;
  nationality?: string | null;
  country_of_origin?: string | null;
  course_id?: string | null;
  batch_id?: string | null;
  company_name?: string | null;
  outside_position?: string | null;
  service_number?: string | null;
  epf_number?: string | null;
  department?: string | null;
  slpa_position?: string | null;
  documents?: Array<{ id: number; document_type: string; file_name: string; mime_type: string; uploaded_by_admin: boolean }>;
  admin_notes?: string | null;
  qualificationsData?: string | object | null;
  qualifications?: string | object | null;
  enrollmentDate: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  latestPayment?: StudentPaymentSummary | null;
  payments?: StudentPaymentSummary[];
  registrationStatus?: 'Pending Payment' | 'Registered' | 'Cancelled';
}

export const formatStudentId = (id: string): string => {
  return id.split('-')[0].toUpperCase();
};

export const getStudentFullName = (student: Pick<StudentRecord, 'firstName' | 'lastName'>): string => {
  return `${student.firstName} ${student.lastName}`.trim();
};

export const getNicOrPassport = (student: Pick<StudentRecord, 'nic' | 'passport'>): string => {
  if (student.nic) return student.nic;
  if (student.passport) return student.passport;
  return '—';
};
