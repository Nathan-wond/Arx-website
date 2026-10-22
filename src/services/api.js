const TOKEN_KEY = 'itclub_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save token to localStorage', err);
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove token from localStorage', err);
  }
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('Upload payload too large. The files you attached exceed the server limit. Please upload smaller or compressed files (under 2.5MB).');
    }
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  
  async getSettings() {
    return request('/api/settings');
  },

  async getPublicSettings() {
    return request('/api/settings');
  },

  
  async register(params)

  {
    return request(

      '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(params)
      });
  },

  async checkTelegramUsername(username) {
    const qs = `?username=${encodeURIComponent(username)}`;
    return request(`/api/auth/check-telegram-username${qs}`);
  },

  async checkEmail(email) {
    const qs = `?email=${encodeURIComponent(email)}`;
    return request(`/api/auth/check-email${qs}`);
  },

  async activateAccount(code, memberId) {
    return request(

      '/api/auth/activate', {
        method: 'POST',
        body: JSON.stringify({ code, memberId })
      });
  },

  async login(credentials) {
    return request(

      '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
  },

  async adminLogin(credentials) {
    return request(

      '/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
  },

  async logout() {
    clearStoredToken();
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {

      
    }},

  async getMe() {
    return request('/api/auth/me');
  },

  
  async getProfile() {
    return request('/api/members/profile');
  },

  async updateProfile(updates) {
    return request('/api/members/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async changePassword(data) {
    return request('/api/members/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMemberCourses() {
    return request('/api/members/courses');
  },

  async getMemberCertificates() {
    return request('/api/members/certificates');
  },

  async getMemberAwards() {
    return request('/api/members/awards');
  },

  async getMemberProjects() {
    return request('/api/members/projects');
  },

  async getDashboardSummary() {
    return request('/api/members/dashboard-summary');
  },

  async getMyEnrollments() {
    return this.getMemberCourses();
  },

  async getMyCourses() {
    return this.getMemberCourses();
  },

  async getMyCertificates() {
    return this.getMemberCertificates();
  },

  async getMyAwards() {
    return this.getMemberAwards();
  },

  async getMyProjects() {
    return this.getMemberProjects();
  },

  async getMyAttendance() {
    const summary = await this.getDashboardSummary().catch(() => ({ attendance: null }));
    return { attendance: summary?.attendance || null };
  },

  
  async getCourses(category, search) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/courses${queryString}`);
  },

  async getCourseById(id) {
    return request(`/api/courses/${id}`);
  },

  async enrollCourse(courseId) {
    return request(`/api/courses/${courseId}/enroll`, {
      method: 'POST'
    });
  },

  
  async verifyCertificate(certificateId) {
    return request(

      `/api/certificates/verify/${encodeURIComponent(certificateId)}`);
  },

  async getCertificateById(id) {
    return request(`/api/certificates/${encodeURIComponent(id)}`);
  },

  
  async getProjects(status, category) {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.set('status', status);
    if (category && category !== 'All') params.set('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/projects${qs}`);
  },

  async getEvents(status) {
    const qs = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/events${qs}`);
  },

  async registerEvent(eventId, memberId) {
    return request(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ memberId })
    });
  },

  async getAchievements(category) {
    const qs = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/api/achievements${qs}`);
  },

  async getStats() {
    return request('/api/stats');
  },

  
  async getAdminOverview() {
    return request(

      '/api/admin/overview');
  },

  
  async getAdminApplications(status = 'pending') {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/admin/applications${qs}`);
  },

  async approveAdminApplication(id) {
    return request(`/api/admin/applications/${id}/approve`, {
      method: 'PATCH'
    });
  },

  async approveApplication(id) {
    return this.approveAdminApplication(id);
  },

  async rejectAdminApplication(id, rejectionReason) {
    return request(`/api/admin/applications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason })
    });
  },

  async rejectApplication(id, rejectionReason) {
    return this.rejectAdminApplication(id, rejectionReason);
  },

  async deleteAdminApplication(id) {
    return request(`/api/admin/applications/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminMembers(q, status) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status && status !== 'all') params.set('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/admin/members${qs}`);
  },

  async getAdminMemberDetail(id) {
    return request(

      `/api/admin/members/${id}`);
  },

  async getAdminMemberAwardFiles(id) {
    return request(`/api/admin/members/${id}/award-files`);
  },

  async updateAdminMember(id, data) {
    return request(`/api/admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleAdminMemberStatus(id) {
    return request(`/api/admin/members/${id}/toggle-status`, {
      method: 'POST'
    });
  },

  async deleteAdminMember(id) {
    return request(`/api/admin/members/${id}`, {
      method: 'DELETE'
    });
  },

  async resetAdminMemberPassword(id, newPassword) {
    return request(`/api/admin/members/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  async getAdminCourses() {
    return request('/api/admin/courses');
  },

  async createAdminCourse(courseData) {
    return request('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  },

  async updateAdminCourse(id, courseData) {
    return request(`/api/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  },

  async deleteAdminCourse(id) {
    return request(`/api/admin/courses/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminApplications(status = 'all') {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/admin/applications${qs}`);
  },

  async approveAdminApplication(id) {
    return request(`/api/admin/applications/${encodeURIComponent(id)}/approve`, {
      method: 'POST'
    });
  },

  async rejectAdminApplication(id, reason = 'Application rejected by admin.') {
    return request(`/api/admin/applications/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, rejectionReason: reason })
    });
  },

  async deleteAdminApplication(id) {
    return request(`/api/admin/applications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async getAdminEnrollments() {
    return request('/api/admin/enrollments');
  },

  async updateAdminEnrollment(id, data) {
    return request(`/api/admin/enrollments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminEnrollment(id) {
    return request(`/api/admin/enrollments/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async getAdminCertificates() {
    return request('/api/admin/certificates');
  },

  async issueAdminCertificate(data) {
    return request('/api/admin/certificates/issue', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async toggleAdminCertificate(id) {
    return request(`/api/admin/certificates/${id}/toggle`, {
      method: 'POST'
    });
  },

  async deleteAdminCertificate(id) {
    return request(`/api/admin/certificates/${id}`, {
      method: 'DELETE'
    });
  },

  async generateAdminCertificate(data) {
    return request('/api/admin/certificates/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async bulkGenerateAdminCertificates(data) {
    return request('/api/admin/certificates/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deliverAdminCertificate(id, channels = ['telegram', 'email']) {
    return request(`/api/admin/certificates/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify({ channels })
    });
  },

  getCertificateDownloadUrl(id, format = 'pdf') {
    return `/api/certificates/${encodeURIComponent(id)}/download?format=${encodeURIComponent(format)}`;
  },

  async getAdminAwards() {
    return request('/api/admin/awards');
  },

  async createAdminAward(data) {
    return request('/api/admin/awards', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminAward(id) {
    return request(`/api/admin/awards/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminProjects() {
    return request('/api/admin/projects');
  },

  async createAdminProject(data) {
    return request('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminProject(id, data) {
    return request(`/api/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminProject(id) {
    return request(`/api/admin/projects/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminProjectSubmissions(status) {
    const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/admin/project-submissions${qs}`);
  },

  async reviewAdminProjectSubmission(id, data) {
    return request(`/api/admin/project-submissions/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminProjectSubmission(id) {
    return request(`/api/admin/project-submissions/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminEvents() {
    return request('/api/admin/events');
  },

  async createAdminEvent(data) {
    return request('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminEvent(id, data) {
    return request(`/api/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminEvent(id) {
    return request(`/api/admin/events/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminAchievements() {
    return request('/api/admin/achievements');
  },

  async createAdminAchievement(data) {
    return request('/api/admin/achievements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminAchievement(id, data) {
    return request(`/api/admin/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminAchievement(id) {
    return request(`/api/admin/achievements/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminAnnouncements() {
    return request('/api/admin/announcements');
  },

  async createAdminAnnouncement(data) {
    return request('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminAnnouncement(id) {
    return request(`/api/admin/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleAdminAnnouncement(id) {
    return request(`/api/admin/announcements/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  async getAdminSettings() {
    return request('/api/admin/settings');
  },

  async updateAdminSettings(settings) {
    return request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  async updateSettings(settings) {
    return this.updateAdminSettings(settings);
  },

  async changeAdminPassword(newPassword) {
    return request('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  
  async getTelegramBroadcasts() {
    return request(

      '/api/telegram/broadcasts');
  },

  async reactToTelegramBroadcast(id, emoji) {
    return request(
      `/api/telegram/broadcasts/${id}/react`,
      {
        method: 'POST',
        body: JSON.stringify({ emoji })
      }
    );
  },

  async sendTelegramBotMessage(command, memberId, fromInfo) {
    return request(

      '/api/telegram/bot', {
        method: 'POST',
        body: JSON.stringify({ command, memberId, fromInfo })
      });
  },

  async getTelegramConfig() {
    return request(

      '/api/telegram/config');
  },

  async getActivationSession(token) {
    return request(

      `/api/telegram/activation-session/${token}`);
  },

  async verifyTelegramChannel(token, telegramUserId) {
    return request(

      '/api/telegram/verify-channel', {
        method: 'POST',
        body: JSON.stringify({ token, telegramUserId })
      });
  },

  async getTelegramWebhookInfo() {
    return request(

      '/api/telegram/webhook-info');
  },

  async syncTelegramWebhook() {
    return request(

      '/api/telegram/sync-webhook', {
        method: 'POST'
      });
  },

  async toggleRegistrationStatus(payload) {
    return request(

      '/api/admin/settings/toggle-registration', {
        method: 'POST',
        body: JSON.stringify(payload || {})
      });
  },

  async setRegistrationStatus(status, closedMessage) {
    return this.toggleRegistrationStatus({ status, closedMessage });
  },

  async getMyActivation() {
    return request(

      '/api/members/activation');
  },

  async generateMyActivation() {
    return request(

      '/api/members/activation/generate', {
        method: 'POST'
      });
  },

  async createActivationToken() {
    return this.generateMyActivation();
  },

  
  async getClubResources() {
    return request('/api/resources');
  },

  
  async getAnnouncements() {
    return request('/api/announcements');
  },

  
  async getAdminMedia(category, query) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (query && query.trim()) params.append('q', query.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/admin/media${qs}`);
  },

  async getAdminMediaById(id) {
    return request(`/api/admin/media/${id}`);
  },

  async getAdminMediaUsage(id) {
    return request(`/api/admin/media/${id}/usage`);
  },

  async uploadAdminMedia(data)

  {
    return request('/api/admin/media/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminMediaMetadata(id, data) {
    return request(`/api/admin/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async replaceAdminMedia(
  id,
  data)

  {
    return request(

      `/api/admin/media/${id}/replace`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
  },

  async deleteAdminMedia(id, force = false) {
    const qs = force ? '?force=true' : '';
    return request(`/api/admin/media/${id}${qs}`, {
      method: 'DELETE'
    });
  },

  
  async getPublicSocialLinks() {
    return request('/api/social-links');
  },

  async getGovernanceRoles() {
    return request('/api/governance');
  },

  
  async getAdminSocialLinks() {
    return request('/api/admin/social-links');
  },

  async createAdminSocialLink(data) {
    return request('/api/admin/social-links', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminSocialLink(id, data) {
    return request(`/api/admin/social-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminSocialLink(id) {
    return request(`/api/admin/social-links/${id}`, {
      method: 'DELETE'
    });
  },

  
  async getAdminGovernance() {
    return request('/api/admin/governance');
  },

  async createAdminGovernance(data) {
    return request('/api/admin/governance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminGovernance(id, data) {
    return request(`/api/admin/governance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminGovernance(id) {
    return request(`/api/admin/governance/${id}`, {
      method: 'DELETE'
    });
  },

  async reorderAdminGovernance(ids) {
    return request('/api/admin/governance/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },

  async transferAdminGovernanceRole(data) {
    return request('/api/admin/governance/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getPublicTeam(category) {
    const qs = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/api/governance${qs}`);
  },

  
  async getAdminTelegramStatus() {
    return request('/api/admin/telegram/status');
  },

  async updateAdminTelegramToken(token) {
    return request(

      '/api/admin/telegram/token', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
  },

  async testAdminTelegramConnection() {
    return request(

      '/api/admin/telegram/test', {
        method: 'POST'
      });
  },

  async getAdminBotCommands() {
    return request('/api/admin/telegram/commands');
  },

  async updateAdminBotCommand(command, updates) {
    return request('/api/admin/telegram/commands', {
      method: 'PUT',
      body: JSON.stringify({ command, updates })
    });
  },

  async syncAdminBotCommands() {
    return request('/api/admin/telegram/commands/sync', {
      method: 'POST'
    });
  },

  async getAdminBotContent() {
    return request('/api/admin/telegram/content');
  },

  async updateAdminBotContent(content) {
    return request('/api/admin/telegram/content', {
      method: 'PUT',
      body: JSON.stringify(content)
    });
  },

  
  // ─── ATTENDANCE CLIENT APIS ──────────────────────────────────────────────
  async checkInAttendance(payload) {
    const body = typeof payload === 'string' ? { memberId: payload } : (payload || {});
    return request('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async getAttendanceStatus() {
    return request('/api/attendance/status');
  },

  async getAvailableAttendanceSessions() {
    return request('/api/attendance/available-sessions');
  },

  async getMyAttendanceHistory() {
    return request('/api/attendance/my-history');
  },

  async getAdminAttendanceSessions() {
    return request('/api/attendance/admin/sessions');
  },

  async createAdminAttendanceSession(data) {
    return request('/api/attendance/admin/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminAttendanceSession(id, data) {
    return request(`/api/attendance/admin/sessions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminAttendanceSession(id) {
    return request(`/api/attendance/admin/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async getAdminUnsubmittedAttendance(sessionId) {
    return request(`/api/attendance/admin/sessions/${encodeURIComponent(sessionId)}/unsubmitted`);
  },

  async finalizeAdminAttendanceAbsences(sessionId) {
    return request(`/api/attendance/admin/sessions/${encodeURIComponent(sessionId)}/finalize-absences`, {
      method: 'POST'
    });
  },

  async getAdminAttendanceRecords(params = {}) {
    const qs = new URLSearchParams();
    if (params.sessionId) qs.set('sessionId', params.sessionId);
    if (params.courseId && params.courseId !== 'all') qs.set('courseId', params.courseId);
    if (params.reviewStatus && params.reviewStatus !== 'all') qs.set('reviewStatus', params.reviewStatus);
    if (params.classification && params.classification !== 'all') qs.set('classification', params.classification);
    if (params.date) qs.set('date', params.date);
    if (params.q) qs.set('q', params.q);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/api/attendance/admin/records${queryString}`);
  },

  async reviewAdminAttendanceRecord(id, data) {
    return request(`/api/attendance/admin/records/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async correctAdminAttendanceRecord(id, data) {
    return request(`/api/attendance/admin/records/${encodeURIComponent(id)}/correct`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminAttendanceRecord(id) {
    return request(`/api/attendance/admin/records/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Presidential & Administrative Hierarchy APIs
  async getAdmins() {
    return request('/api/admin/admins');
  },

  async createAdmin(data) {
    return request('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminPassword(id, newPassword) {
    return request(`/api/admin/admins/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    });
  },

  async changeAdminPassword(data) {
    return request('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAdmin(id) {
    return request(`/api/admin/admins/${id}`, {
      method: 'DELETE'
    });
  },

  async getAuditLogs() {
    return request('/api/admin/system/audit-logs');
  },

  async exportDatabase() {
    return request('/api/admin/system/export-db');
  }
};
