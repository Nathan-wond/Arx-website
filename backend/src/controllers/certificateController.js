import { db } from '../services/db.js';
import {
  generateCertificatePDF,
  generateCertificatePNG,
  issueAndDeliverCertificate,
  bulkGenerateCertificates,
  deliverCertificate
} from '../services/certificateGenerator.js';

export const certificateController = {
  verify(req, res) {
    const { certificateId } = req.params;

    if (!certificateId || typeof certificateId !== 'string') {
      res.status(400).json({ error: 'Please provide a Certificate ID to verify.' });
      return;
    }

    const cert = db.verifyCertificateByCertId(certificateId.trim());

    if (!cert) {
      res.status(404).json({
        verified: false,
        error: 'Certificate not found. Please double-check the Certificate ID or contact IT Club administration.'
      });
      return;
    }

    res.json({
      verified: true,
      status: cert.status,
      certificate: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        courseName: cert.courseName,
        issueDate: cert.issueDate,
        status: cert.status,
        role: cert.role || 'Member',
        achievement: cert.achievement || `Completion of ${cert.courseName}`,
        authorizedSignatures: cert.authorizedSignatures,
        qrData: cert.qrData,
        downloadUrls: {
          pdf: `/api/certificates/${cert.certificateId}/download?format=pdf`,
          image: `/api/certificates/${cert.certificateId}/download?format=png`
        }
      }
    });
  },

  getById(req, res) {
    const { id } = req.params;
    const cert = db.getCertificateById(id) || db.verifyCertificateByCertId(id);

    if (!cert) {
      res.status(404).json({ error: 'Certificate not found.' });
      return;
    }

    res.json({
      certificate: {
        ...cert,
        downloadUrls: {
          pdf: `/api/certificates/${cert.certificateId || cert.id}/download?format=pdf`,
          image: `/api/certificates/${cert.certificateId || cert.id}/download?format=png`
        }
      }
    });
  },

  /**
   * Endpoint to download a personalized certificate as PDF or high-resolution PNG image
   * GET /api/certificates/:id/download?format=pdf|png
   */
  async download(req, res) {
    try {
      const { id } = req.params;
      const format = (req.query.format || 'pdf').toLowerCase().trim();

      let cert = db.getCertificateById(id) || db.verifyCertificateByCertId(id);
      if (!cert) {
        const member = db.findMemberById(id) || db.findMemberByMemberId(id);
        if (member) {
          const memberCerts = db.getMemberCertificates(member.id);
          if (memberCerts && memberCerts.length > 0) {
            cert = memberCerts[memberCerts.length - 1];
          } else if (member.status === 'approved' || member.role === 'member') {
            const enrollments = db.getAllEnrollments ? db.getAllEnrollments() : [];
            const userEnr = enrollments.filter(e => e.memberId === member.id || e.memberId === member.memberId);
            const courseTitle = userEnr[0]?.courseTitle || 'Computer Science & Software Development';
            cert = db.issueCertificate({
              memberId: member.id,
              studentName: member.studentName,
              courseName: courseTitle
            });
          }
        }
      }
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found.' });
        return;
      }

      // Fetch corresponding member if exists to ensure up-to-date role/name
      if (cert.memberId) {
        const member = db.findMemberById(cert.memberId) || db.findMemberByMemberId(cert.memberId);
        if (member) {
          cert.studentName = cert.studentName || member.studentName;
          cert.role = cert.role || member.role;
        }
      }

      const safeId = (cert.certificateId || cert.id || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (format === 'png' || format === 'image') {
        const imageBuffer = await generateCertificatePNG(cert);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${safeId}.png"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);
      } else {
        const pdfBuffer = await generateCertificatePDF(cert);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeId}.pdf"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(pdfBuffer);
      }
    } catch (err) {
      console.error('[Certificate Download Error]', err);
      res.status(500).json({ error: `Failed to generate certificate download: ${err.message}` });
    }
  },

  /**
   * Admin endpoint: Generate personalized certificate for a member
   * POST /api/admin/certificates/generate
   */
  async generate(req, res) {
    try {
      const result = await issueAndDeliverCertificate(req.body);
      res.status(201).json({
        success: true,
        message: `Certificate for ${result.certificate.studentName} (${result.certificate.certificateId}) generated successfully!`,
        certificate: result.certificate,
        delivery: result.delivery,
        downloadUrls: result.downloadUrls
      });
    } catch (err) {
      console.error('[Certificate Generation Error]', err);
      res.status(400).json({ error: err.message || 'Failed to generate certificate.' });
    }
  },

  /**
   * Admin endpoint: Bulk generate certificates for multiple members
   * POST /api/admin/certificates/bulk-generate
   */
  async bulkGenerate(req, res) {
    try {
      const result = await bulkGenerateCertificates(req.body);
      res.status(200).json({
        success: true,
        message: `Bulk certificate generation completed: ${result.successCount} issued, ${result.failCount} failed.`,
        ...result
      });
    } catch (err) {
      console.error('[Bulk Certificate Generation Error]', err);
      res.status(400).json({ error: err.message || 'Failed to bulk generate certificates.' });
    }
  },

  /**
   * Admin endpoint: Deliver/Resend certificate via Telegram or Email
   * POST /api/admin/certificates/:id/deliver
   */
  async deliver(req, res) {
    try {
      const { id } = req.params;
      const { channels } = req.body || {};

      const cert = db.getCertificateById(id) || db.verifyCertificateByCertId(id);
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found.' });
        return;
      }

      const results = await deliverCertificate(cert, channels || ['telegram', 'email']);
      res.json({
        success: true,
        message: `Delivery dispatched for certificate ${cert.certificateId}.`,
        deliveryResults: results
      });
    } catch (err) {
      console.error('[Certificate Delivery Error]', err);
      res.status(500).json({ error: `Delivery failed: ${err.message}` });
    }
  }
};