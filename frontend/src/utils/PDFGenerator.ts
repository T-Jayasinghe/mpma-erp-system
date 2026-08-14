import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './api';
import logoImg from '../assets/logo.png';

const PRIMARY_COLOR: [number, number, number] = [15, 23, 42]; // Slate-900
const SECONDARY_COLOR: [number, number, number] = [2, 132, 199]; // Blue-600
const SUCCESS_COLOR: [number, number, number] = [5, 150, 105]; // Emerald-600

// Logo caching for fast synchronous rendering in jsPDF
let cachedLogoDataUrl: string | null = null;
const logoImage = new Image();
logoImage.crossOrigin = 'Anonymous';
logoImage.onload = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = logoImage.naturalWidth;
    canvas.height = logoImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(logoImage, 0, 0);
      cachedLogoDataUrl = canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('Logo pre-cache notice:', e);
  }
};
logoImage.src = logoImg;

const drawHeaderLogo = (doc: jsPDF, x: number, y: number, w: number, h: number) => {
  try {
    if (cachedLogoDataUrl) {
      doc.addImage(cachedLogoDataUrl, 'PNG', x, y, w, h);
    } else if (logoImage.complete && logoImage.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = logoImage.naturalWidth;
      canvas.height = logoImage.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(logoImage, 0, 0);
        const data = canvas.toDataURL('image/png');
        cachedLogoDataUrl = data;
        doc.addImage(data, 'PNG', x, y, w, h);
      } else {
        doc.addImage(logoImg, 'PNG', x, y, w, h);
      }
    } else {
      doc.addImage(logoImg, 'PNG', x, y, w, h);
    }
  } catch (err) {
    console.warn('PDF Header Logo rendering warning:', err);
  }
};

interface StudentReceiptPayment {
  id: number;
  student_id: string;
  registration_fee: number;
  course_fee: number;
  full_amount_payable: number;
  amount_paid: number;
  payment_method: string;
  payment_status: string;
  payment_reference: string;
  transaction_id?: string | null;
  receipt_number?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
}

interface StudentReceiptData {
  payment: StudentReceiptPayment;
  studentName: string;
  courseBatch?: string;
}

interface StudentProfilePdfData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  course: string;
  batch: string;
  studentCategory?: string | null;
  nic?: string | null;
  passport?: string | null;
  enrollmentDate?: string;
  status: string;
  latestPayment?: StudentReceiptPayment | null;
  registrationStatus?: string;
}

export const generateBookingSlip = (type: 'Transport' | 'Classroom' | 'Auditorium', data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Branding Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Draw Logo
  drawHeaderLogo(doc, 15, 6, 30, 30);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 50, 24);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Advanced Resource Management Platform', 50, 32);

  // Slip Title
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = `${type} Reservation Slip`;
  doc.text(title, 20, 60);

  // Horizontal Line
  doc.setDrawColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.setLineWidth(1);
  doc.line(20, 65, 80, 65);

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 20, 60, { align: 'right' });
  doc.text(`Reference ID: #${type.toUpperCase().substring(0,3)}-${Math.floor(1000 + Math.random() * 9000)}`, pageWidth - 20, 67, { align: 'right' });

  // Booking Information
  const infoRows = [];
  if (type === 'Transport') {
    infoRows.push(['Requester Name', data.requesterName || data.name]);
    infoRows.push(['Division', data.department || 'N/A']);
    infoRows.push(['Contact Number', data.contactNumber || data.contact]);
    infoRows.push(['Vehicle', data.vehicle?.name || data.vehicleName || 'N/A']);
    infoRows.push(['Route', `${data.pickupLocation || data.pickup} to ${data.destination}`]);
    infoRows.push(['Departure', `${formatDate(data.departureDate)} at ${data.departureTime}`]);
    infoRows.push(['Return', formatDate(data.returnDate)]);
    infoRows.push(['Estimated KM', `${data.estimatedKm || 'N/A'} KM`]);
    infoRows.push(['Purpose', data.purpose || data.description || 'Trip']);
  } else if (type === 'Classroom') {
    infoRows.push(['Requester', data.requestingOfficerName || data.name]);
    infoRows.push(['Designation', data.designation || 'N/A']);
    infoRows.push(['Course', data.courseName]);
    infoRows.push(['Classroom', data.classroom?.name || 'N/A']);
    infoRows.push(['Date Range', `${formatDate(data.dateFrom)} to ${formatDate(data.dateTo)}`]);
    infoRows.push(['Time Slot', `${data.timeFrom || data.start} - ${data.timeTo || data.end}`]);
    infoRows.push(['Participants', `${data.numberOfParticipants || data.participants} PAX`]);
  } else if (type === 'Auditorium') {
    infoRows.push(['Requester', data.name]);
    infoRows.push(['Contact', data.contact]);
    infoRows.push(['Date', formatDate(data.date)]);
    infoRows.push(['Schedule', `${data.start} - ${data.end}`]);
    infoRows.push(['Participants', `${data.participants} PAX`]);
    infoRows.push(['Event', data.description || 'N/A']);
  }

  autoTable(doc, {
    startY: 80,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 50 },
      1: { textColor: [15, 23, 42] }
    }
  });

  // Footer / Status
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.rect(20, finalY, pageWidth - 40, 40, 'F');
  
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 30, finalY + 15);
  
  const status = data.status || 'Pending';
  const statusColor: [number, number, number] = status === 'Approved' ? [5, 150, 105] : [217, 119, 6];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(status.toUpperCase(), 50, finalY + 15);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an automatically generated document from the MPMA ERP System.', pageWidth / 2, finalY + 30, { align: 'center' });

  doc.save(`${type}_Slip_${data.id || 'new'}.pdf`);
};

export const generateStudentPaymentReceipt = ({
  payment,
  studentName,
  courseBatch,
}: StudentReceiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const receiptNo = payment.receipt_number || `PAY-${payment.id}`;
  const paidAt = payment.paid_at
    ? new Date(payment.paid_at).toLocaleString('en-LK')
    : 'N/A';

  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Draw Logo
  drawHeaderLogo(doc, 15, 6, 30, 30);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 50, 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Student Payment Receipt', 50, 32);

  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Receipt', 20, 60);

  doc.setDrawColor(SUCCESS_COLOR[0], SUCCESS_COLOR[1], SUCCESS_COLOR[2]);
  doc.setLineWidth(1);
  doc.line(20, 65, 78, 65);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString('en-LK')}`, pageWidth - 20, 58, { align: 'right' });
  doc.text(`Receipt No: ${receiptNo}`, pageWidth - 20, 66, { align: 'right' });

  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20, 76, pageWidth - 40, 30, 3, 3, 'F');
  doc.setTextColor(SUCCESS_COLOR[0], SUCCESS_COLOR[1], SUCCESS_COLOR[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.payment_status.toUpperCase(), 30, 88);
  doc.setFontSize(20);
  doc.text(`Rs. ${Number(payment.amount_paid).toLocaleString()}`, 30, 100);

  const details = [
    ['Student Name', studentName],
    ['Student ID', payment.student_id],
    ['Course / Batch', courseBatch || 'N/A'],
    ['Payment Reference', payment.payment_reference],
    ['Transaction ID', payment.transaction_id || 'N/A'],
    ['Payment Method', payment.payment_method || 'N/A'],
    ['Paid At', paidAt],
  ];

  autoTable(doc, {
    startY: 118,
    body: details,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 55 },
      1: { textColor: [15, 23, 42] },
    },
  });

  const feesStartY = (doc as any).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: feesStartY,
    head: [['Fee Type', 'Amount']],
    body: [
      ['Registration Fee', `Rs. ${Number(payment.registration_fee).toLocaleString()}`],
      ['Course Fee', `Rs. ${Number(payment.course_fee).toLocaleString()}`],
      ['Total Payable', `Rs. ${Number(payment.full_amount_payable).toLocaleString()}`],
      ['Amount Paid', `Rs. ${Number(payment.amount_paid).toLocaleString()}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: SUCCESS_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 18;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a system-generated receipt. No signature required.', pageWidth / 2, finalY, { align: 'center' });

  doc.save(`payment_receipt_${receiptNo}.pdf`);
};

export const generateStudentProfilePdf = (student: StudentProfilePdfData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const payment = student.latestPayment;

  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Draw Logo
  drawHeaderLogo(doc, 15, 6, 30, 30);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 50, 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Management Module', 50, 32);

  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Profile', 20, 60);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString('en-LK')}`, pageWidth - 20, 60, { align: 'right' });
  doc.text(`Student ID: ${student.id}`, pageWidth - 20, 67, { align: 'right' });

  autoTable(doc, {
    startY: 80,
    body: [
      ['Full Name', fullName],
      ['Student Category', student.studentCategory || 'N/A'],
      ['NIC / Passport', student.nic || student.passport || 'N/A'],
      ['Email', student.email],
      ['Phone', student.phone || 'N/A'],
      ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString('en-LK') : 'N/A'],
      ['Gender', student.gender || 'N/A'],
      ['Address', student.address || 'N/A'],
      ['Course', student.course],
      ['Batch', student.batch],
      ['Registered Date', student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('en-LK') : 'N/A'],
      ['Registration Status', student.registrationStatus || student.status],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 50 },
      1: { textColor: [15, 23, 42] },
    },
  });

  const paymentStartY = (doc as any).lastAutoTable.finalY + 12;
  autoTable(doc, {
    startY: paymentStartY,
    head: [['Payment Field', 'Value']],
    body: payment
      ? [
          ['Payment Reference', payment.payment_reference],
          ['Payment Status', payment.payment_status],
          ['Payment Method', payment.payment_method],
          ['Registration Fee', `Rs. ${Number(payment.registration_fee).toLocaleString()}`],
          ['Course Fee', `Rs. ${Number(payment.course_fee).toLocaleString()}`],
          ['Total Payable', `Rs. ${Number(payment.full_amount_payable).toLocaleString()}`],
          ['Amount Paid', `Rs. ${Number(payment.amount_paid).toLocaleString()}`],
          ['Receipt Number', payment.receipt_number || 'N/A'],
        ]
      : [['Payment', 'No payment record found']],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 16;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a system-generated student profile.', pageWidth / 2, finalY, { align: 'center' });

  doc.save(`student_profile_${student.id.slice(0, 8).toUpperCase()}.pdf`);
};

export const generateListReport = (title: string, columns: string[], rows: any[][]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');
  
  // Draw Logo
  drawHeaderLogo(doc, 15, 4, 24, 24);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 45, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth - 20, 20, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 42);

  autoTable(doc, {
    startY: 46,
    margin: { left: 15, right: 15 },
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' }
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
};

export const exportToCSV = (filename: string, headers: string[], rows: (string | number | boolean)[][]) => {
  const escapeCell = (cell: any) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateCoursesReport = (courses: any[], filters: { stream?: string; mode?: string; schedule?: string; status?: string; search?: string }) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Branding Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 34, 'F');
  
  // Draw Logo
  drawHeaderLogo(doc, 15, 4, 26, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 46, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Course Management - Courses Master Report', 46, 26);

  // Metadata
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleString('en-LK')}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Total Records: ${courses.length}`, pageWidth - 15, 26, { align: 'right' });

  // Filter Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 38, pageWidth - 30, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 38, pageWidth - 30, 14, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const filterParts = [
    `Stream: ${filters.stream || 'All'}`,
    `Mode: ${filters.mode || 'All'}`,
    `Schedule: ${filters.schedule || 'All'}`,
    `Status: ${filters.status || 'All'}`,
    filters.search ? `Search: "${filters.search}"` : ''
  ].filter(Boolean).join('  |  ');
  
  doc.text(`Applied Filters:  ${filterParts}`, 20, 47);

  const tableHead = [['#', 'Code', 'Course Title', 'Stream', 'Duration', 'Mode', 'Schedule', 'Max Pax', 'Reg Fee (LKR)', 'Course Fee (LKR)', 'Status']];
  const tableBody = courses.map((c, index) => [
    index + 1,
    c.courseCode || 'N/A',
    c.courseName || '',
    c.stream || 'N/A',
    c.duration || 'N/A',
    c.mode || 'Physical',
    c.schedule || 'N/A',
    c.maxParticipants || 'N/A',
    c.registrationFee ? Number(c.registrationFee).toLocaleString() : '0',
    c.courseFee ? Number(c.courseFee).toLocaleString() : '0',
    c.status || 'Active'
  ]);

  autoTable(doc, {
    startY: 56,
    margin: { left: 15, right: 15 },
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
    columnStyles: {
      0: { halign: 'center' },
      1: { fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'center' }
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('MPMA ERP System - Official Course Report', 15, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`courses_report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateBatchesReport = (batches: any[], courses: any[], filters: { courseId?: string; status?: string; startDate?: string; endDate?: string; search?: string }) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const getCourseName = (courseId: string) => {
    const course = courses.find((c: any) => c.id === courseId);
    return course ? `${course.courseCode} - ${course.courseName}` : courseId || 'N/A';
  };

  // Branding Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 34, 'F');
  
  // Draw Logo
  drawHeaderLogo(doc, 15, 4, 26, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 46, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Course Management - Batches & Intake Report', 46, 26);

  // Metadata
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleString('en-LK')}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Total Batches: ${batches.length}`, pageWidth - 15, 26, { align: 'right' });

  // Filter Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 38, pageWidth - 30, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 38, pageWidth - 30, 14, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const courseFilterObj = filters.courseId ? courses.find(c => c.id === filters.courseId) : null;
  const courseLabel = courseFilterObj ? courseFilterObj.courseCode : (filters.courseId ? 'Selected Course' : 'All Courses');
  
  const filterParts = [
    `Course: ${courseLabel}`,
    `Status: ${filters.status || 'All'}`,
    filters.startDate ? `From: ${filters.startDate}` : '',
    filters.endDate ? `To: ${filters.endDate}` : '',
    filters.search ? `Search: "${filters.search}"` : ''
  ].filter(Boolean).join('  |  ');
  
  doc.text(`Applied Filters:  ${filterParts}`, 20, 47);

  const tableHead = [['#', 'Batch Code', 'Course Title', 'Schedule', 'Mode', 'Type', 'Location', 'Start Date', 'End Date', 'Enrolled', 'Max Cap', 'Status']];
  const tableBody = batches.map((b, index) => {
    const enrolled = Number(b.currentStudents || 0);
    const maxCap = Number(b.maxStudents || 0);

    return [
      index + 1,
      b.batchCode || 'N/A',
      getCourseName(b.courseId),
      b.schedule || 'Weekday',
      b.mode || 'Physical',
      b.type || 'Full Time',
      b.location || 'N/A',
      b.startDate ? new Date(b.startDate).toLocaleDateString('en-LK') : 'N/A',
      b.endDate ? new Date(b.endDate).toLocaleDateString('en-LK') : 'N/A',
      enrolled,
      maxCap,
      b.status || 'Available'
    ];
  });

  autoTable(doc, {
    startY: 56,
    margin: { left: 15, right: 15 },
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
    columnStyles: {
      0: { halign: 'center' },
      1: { fontStyle: 'bold' },
      9: { halign: 'center' },
      10: { halign: 'center' },
      11: { halign: 'center' }
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('MPMA ERP System - Official Batches Report', 15, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`batches_report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateLecturersReport = (lecturers: any[], filters: { category?: string; status?: string; department?: string; search?: string }) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Branding Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Draw Logo
  drawHeaderLogo(doc, 15, 4, 26, 26);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MPMA ERP SYSTEM', 46, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Course Management - Lecturers Master Report', 46, 26);

  // Metadata
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleString('en-LK')}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Total Lecturers: ${lecturers.length}`, pageWidth - 15, 26, { align: 'right' });

  // Filter Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 38, pageWidth - 30, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 38, pageWidth - 30, 14, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const filterParts = [
    `Category: ${filters.category || 'All'}`,
    `Department: ${filters.department || 'All'}`,
    `Status: ${filters.status || 'All'}`,
    filters.search ? `Search: "${filters.search}"` : ''
  ].filter(Boolean).join('  |  ');
  
  doc.text(`Applied Filters:  ${filterParts}`, 20, 47);

  const tableHead = [['#', 'Full Name', 'Category', 'NIC / Passport', 'Mobile', 'Email', 'Department / Company', 'Designation', 'Status']];
  const tableBody = lecturers.map((l, index) => [
    index + 1,
    l.fullName || 'N/A',
    l.category === 'Outside' ? 'Outside' : 'SLPA Internal',
    l.nicPassport || 'N/A',
    l.mobile || 'N/A',
    l.email || 'N/A',
    l.category === 'Outside' ? (l.companyName || 'N/A') : (l.department || 'SLPA'),
    l.designation || 'N/A',
    l.status || 'Active'
  ]);

  autoTable(doc, {
    startY: 56,
    margin: { left: 15, right: 15 },
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
    columnStyles: {
      0: { halign: 'center' },
      1: { fontStyle: 'bold' },
      8: { halign: 'center' }
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('MPMA ERP System - Official Lecturers Report', 15, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`lecturers_report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
