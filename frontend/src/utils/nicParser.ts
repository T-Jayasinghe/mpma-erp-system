export interface NICInfo {
  dob: string; // YYYY-MM-DD format
  gender: "Male" | "Female";
  age?: number;
  isValid: boolean;
}

/**
 * Parses a Sri Lankan National Identity Card (NIC) number.
 * Supports both Old Format (9 digits + V/v/X/x, 10 chars) and New Format (12 digits).
 *
 * Old NIC format: YYDDDXXXXV (Year 19YY)
 * New NIC format: YYYYDDDXXXXX (Year YYYY)
 * DDD: Days from Jan 1st.
 *  - If DDD > 500: Gender is Female, Days = DDD - 500
 *  - If DDD <= 500: Gender is Male, Days = DDD
 */
export const parseSriLankanNIC = (nic: string): NICInfo | null => {
  if (!nic) return null;
  const cleanNic = nic.trim();

  let year: number;
  let daysCount: number;

  // Old NIC format: 9 digits + V/v/X/x (10 characters)
  if (/^[0-9]{9}[vVxX]$/.test(cleanNic)) {
    year = 1900 + parseInt(cleanNic.substring(0, 2), 10);
    daysCount = parseInt(cleanNic.substring(2, 5), 10);
  }
  // New NIC format: 12 digits
  else if (/^[0-9]{12}$/.test(cleanNic)) {
    year = parseInt(cleanNic.substring(0, 4), 10);
    daysCount = parseInt(cleanNic.substring(4, 7), 10);
  } else {
    return null;
  }

  // Determine Gender
  let gender: "Male" | "Female" = "Male";
  if (daysCount > 500) {
    gender = "Female";
    daysCount -= 500;
  }

  // Days count must be between 1 and 366
  if (daysCount < 1 || daysCount > 366) {
    return null;
  }

  // Days count per month (DRP Sri Lanka day counting standard, Feb = 29 days)
  const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 0;
  let day = daysCount;

  for (let i = 0; i < monthDays.length; i++) {
    if (day <= monthDays[i]) {
      month = i + 1;
      break;
    }
    day -= monthDays[i];
  }

  // Adjust for non-leap year Feb 29 (day 60)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (!isLeapYear && month === 2 && day === 29) {
    month = 3;
    day = 1;
  }

  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const dob = `${year}-${monthStr}-${dayStr}`;

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }

  return {
    dob,
    gender,
    age,
    isValid: true
  };
};
