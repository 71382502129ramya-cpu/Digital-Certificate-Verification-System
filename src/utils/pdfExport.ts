import { jsPDF } from 'jspdf';
import { Certificate } from '../types';

export function generateCertificatePDF(certificate: Certificate) {
  // Create landscape A4 document (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background subtle cream fill
  doc.setFillColor(253, 252, 249);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer primary navy border
  doc.setDrawColor(15, 23, 42); // #0f172a
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner ornate gold border
  doc.setDrawColor(202, 138, 4); // #ca8a04
  doc.setLineWidth(1);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  // Thin inner accent border
  doc.setDrawColor(234, 179, 8); // #eab308
  doc.setLineWidth(0.4);
  doc.rect(16, 16, pageWidth - 32, pageHeight - 32);

  // Corner ornaments (geometric luxury accents)
  const drawCornerAccent = (x: number, y: number, dx: number, dy: number) => {
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(1.2);
    doc.line(x, y, x + dx * 12, y);
    doc.line(x, y, x, y + dy * 12);
  };
  drawCornerAccent(14, 14, 1, 1);
  drawCornerAccent(pageWidth - 14, 14, -1, 1);
  drawCornerAccent(14, pageHeight - 14, 1, -1);
  drawCornerAccent(pageWidth - 14, pageHeight - 14, -1, -1);

  // Institution / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(certificate.institution_name.toUpperCase(), pageWidth / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('CENTRAL VERIFICATION SYSTEM • CRYPTOGRAPHICALLY SECURED ACCREDITATION', pageWidth / 2, 33, { align: 'center' });

  // Decorative divider
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 40, 36, pageWidth / 2 + 40, 36);

  // Main Certificate Title
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(180, 83, 9); // Gold-amber
  const titleType = (certificate.certificate_type || 'EXCELLENCE').toUpperCase();
  doc.text(`CERTIFICATE OF ${titleType}`, pageWidth / 2, 48, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('This is proudly and formally conferred to certify that', pageWidth / 2, 56, { align: 'center' });

  // Recipient Name
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text(certificate.recipient_name, pageWidth / 2, 70, { align: 'center' });

  // Name underline
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 60, 74, pageWidth / 2 + 60, 74);

  // Recipient info (Roll No / Department)
  if (certificate.recipient_roll) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Student Credential ID: ${certificate.recipient_roll}  •  ${certificate.recipient_email}`, pageWidth / 2, 80, { align: 'center' });
  }

  // Award Statement & Event
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text('has demonstrated outstanding competence and successfully fulfilled all criteria for', pageWidth / 2, 92, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(certificate.title, pageWidth / 2, 101, { align: 'center' });

  if (certificate.event_title && certificate.event_title !== certificate.title) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`at "${certificate.event_title}"`, pageWidth / 2, 108, { align: 'center' });
  }

  // Grade / Merit badge
  if (certificate.grade) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(`HONOR / DISTINCTION: ${certificate.grade.toUpperCase()}`, pageWidth / 2, 116, { align: 'center' });
  }

  // Embed QR Code
  if (certificate.qr_code_data) {
    try {
      doc.addImage(certificate.qr_code_data, 'PNG', 26, 130, 36, 36);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('SCAN TO VERIFY AUTHENTICITY', 44, 170, { align: 'center' });
    } catch (e) {
      console.warn('Could not embed QR code into PDF', e);
    }
  }

  // Verification ID & Date block (Center-left)
  const formattedDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATE IDENTIFIER:', 70, 140);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(certificate.id, 70, 146);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE OF CONFERMENT:', 70, 154);
  doc.setFont('helvetica', 'normal');
  doc.text(formattedDate, 70, 160);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS RECORD:', 70, 168);
  doc.setFont('helvetica', 'bold');
  if (certificate.status === 'Active') {
    doc.setTextColor(22, 101, 52); // green
  } else if (certificate.status === 'Revoked') {
    doc.setTextColor(185, 28, 28); // red
  } else {
    doc.setTextColor(217, 119, 6); // amber
  }
  doc.text(certificate.status.toUpperCase(), 105, 168);

  // Issuer Signatures & Seal (Right side)
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);

  // Line 1: Issuing Officer
  doc.line(pageWidth - 95, 154, pageWidth - 30, 154);
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(certificate.issuer_name, pageWidth - 62, 150, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED SIGNATORY / ISSUER', pageWidth - 62, 160, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(certificate.institution_name, pageWidth - 62, 164, { align: 'center' });

  // Official Gold Security Seal graphic representation
  doc.setFillColor(245, 158, 11);
  doc.circle(pageWidth - 118, 150, 11, 'F');
  doc.setFillColor(251, 191, 36);
  doc.circle(pageWidth - 118, 150, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(120, 53, 15);
  doc.text('VERIFIED', pageWidth - 118, 149, { align: 'center' });
  doc.text('OFFICIAL', pageWidth - 118, 153, { align: 'center' });

  // Bottom Cryptographic Audit Footer
  doc.setFillColor(241, 245, 249);
  doc.rect(16, pageHeight - 25, pageWidth - 32, 9, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`SHA-256 HASH: ${certificate.sha256_hash}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Verify integrity online: Use Certificate ID or QR code to validate cryptographic authenticity against the central immutable registry.', pageWidth / 2, pageHeight - 17, { align: 'center' });

  // Save the PDF
  doc.save(`${certificate.id}.pdf`);
}
