import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { mediaController } from '../controllers/mediaController.js';
import { certificateController } from '../controllers/certificateController.js';
import { adminMiddleware, presidentMiddleware, settingsAdminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(adminMiddleware);

router.get('/media', mediaController.getAll);
router.get('/media/:id', mediaController.getById);
router.get('/media/:id/usage', mediaController.getUsage);
router.post('/media/upload', mediaController.upload);
router.put('/media/:id', mediaController.updateMetadata);
router.post('/media/:id/replace', mediaController.replaceImage);
router.delete('/media/:id', mediaController.delete);

router.get('/overview', adminController.getOverview);

router.get('/applications', adminController.getApplications);
router.patch('/applications/:id/approve', adminController.approveApplication);
router.post('/applications/:id/approve', adminController.approveApplication);
router.patch('/applications/:id/reject', adminController.rejectApplication);
router.post('/applications/:id/reject', adminController.rejectApplication);
router.delete('/applications/:id', adminMiddleware, adminController.deleteApplication);

router.get('/members', adminController.getMembers);
router.get('/members/:id', adminController.getMemberDetail);
router.get('/members/:id/award-files', adminController.getMemberAwardFiles);
router.get('/award-files/:id/download', adminController.downloadAwardFile);
router.put('/members/:id', adminController.updateMember);
router.post('/members/:id/toggle-status', adminController.toggleMemberStatus);
router.post('/members/:id/reset-password', adminController.resetMemberPassword);
router.delete('/members/:id', adminMiddleware, adminController.deleteMember);

router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

router.get('/enrollments', adminController.getEnrollments);
router.put('/enrollments/:id', adminController.updateEnrollment);
router.delete('/enrollments/:id', adminController.deleteEnrollment);

router.get('/certificates', adminController.getCertificates);
router.post('/certificates/issue', adminController.issueCertificate);
router.post('/certificates/generate', certificateController.generate);
router.post('/certificates/bulk-generate', certificateController.bulkGenerate);
router.post('/certificates/:id/deliver', certificateController.deliver);
router.get('/certificates/:id/download', certificateController.download);
router.post('/certificates/:id/toggle', adminController.toggleCertificate);
router.delete('/certificates/:id', adminController.deleteCertificate);

router.get('/awards', adminController.getAwards);
router.post('/awards', adminController.createAward);
router.delete('/awards/:id', adminController.deleteAward);

router.get('/projects', adminController.getProjects);
router.post('/projects', adminController.createProject);
router.put('/projects/:id', adminController.updateProject);
router.delete('/projects/:id', adminController.deleteProject);

// Student Project Submissions Review
router.get('/project-submissions', adminController.getProjectSubmissions);
router.put('/project-submissions/:id/review', adminController.reviewProjectSubmission);
router.get('/project-submissions/:id/download', adminController.downloadProjectSubmissionFile);
router.delete('/project-submissions/:id', adminController.deleteProjectSubmission);

router.get('/events', adminController.getEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

router.get('/achievements', adminController.getAchievements);
router.post('/achievements', adminController.createAchievement);
router.put('/achievements/:id', adminController.updateAchievement);
router.delete('/achievements/:id', adminController.deleteAchievement);

router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.patch('/announcements/:id/toggle', adminController.toggleAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

router.get('/social-links', adminController.getSocialLinks);
router.post('/social-links', adminController.createSocialLink);
router.put('/social-links/:id', adminController.updateSocialLink);
router.delete('/social-links/:id', adminController.deleteSocialLink);

router.get('/governance', adminController.getGovernance);
router.post('/governance', adminController.createGovernance);
router.put('/governance/:id', adminController.updateGovernance);
router.delete('/governance/:id', adminController.deleteGovernance);
router.post('/governance/reorder', adminController.reorderGovernance);
router.post('/governance/transfer', adminController.transferGovernanceRole);

router.get('/settings', adminController.getSettings);
router.put('/settings', settingsAdminMiddleware, adminController.updateSettings);
router.post('/settings/toggle-registration', settingsAdminMiddleware, adminController.toggleRegistrationStatus);
router.post('/change-password', adminController.changeAdminPassword);

router.get('/telegram/status', adminController.getTelegramBotStatus);
router.post('/telegram/token', presidentMiddleware, adminController.updateTelegramBotToken);
router.post('/telegram/test', adminController.testTelegramBotConnection);
router.get('/telegram/commands', adminController.getBotCommands);
router.put('/telegram/commands', adminController.updateBotCommand);
router.post('/telegram/commands/sync', presidentMiddleware, adminController.syncBotCommands);
router.get('/telegram/content', adminController.getBotContent);
router.put('/telegram/content', adminController.updateBotContent);

// Presidential Executive Hierarchy & System Operations
router.get('/admins', presidentMiddleware, adminController.getAdmins);
router.post('/admins', presidentMiddleware, adminController.createAdmin);
router.put('/admins/:id/password', presidentMiddleware, adminController.updateAdminPassword);
router.delete('/admins/:id', presidentMiddleware, adminController.deleteAdmin);
router.get('/system/export-db', presidentMiddleware, adminController.exportDatabase);
router.get('/system/audit-logs', presidentMiddleware, adminController.getAuditLogs);

export default router;
