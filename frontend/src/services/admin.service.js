import api from './api.js';

class AdminService {
  constructor() {
    this.basePath = '/admin';
  }

  async getOverview() {
    const response = await api.get(`${this.basePath}/overview`);
    return response.data;
  }

  async getUsers({ search = '', page = 0, limit = 25, filter = 'all' } = {}) {
    const response = await api.get(`${this.basePath}/users`, {
      params: { search, page, limit, filter },
    });
    return response.data;
  }

  async getGuests({ search = '', page = 0, limit = 25 } = {}) {
    const response = await api.get(`${this.basePath}/guests`, {
      params: { search, page, limit },
    });
    return response.data;
  }

  async getUserDetail(userId) {
    const response = await api.get(`${this.basePath}/users/${userId}`);
    return response.data;
  }

  async getRooms({ search = '', page = 0, limit = 25 } = {}) {
    const response = await api.get(`${this.basePath}/rooms`, {
      params: { search, page, limit },
    });
    return response.data;
  }

  async getReports({ status = 'open', page = 0, limit = 25 } = {}) {
    const response = await api.get(`${this.basePath}/reports`, {
      params: { status, page, limit },
    });
    return response.data;
  }

  async dismissReport(reportId) {
    const response = await api.post(`${this.basePath}/reports/${reportId}/dismiss`);
    return response.data;
  }

  async banUser(userId, { durationMs, reason = '', reportId = null } = {}) {
    const response = await api.post(`${this.basePath}/users/${userId}/ban`, {
      durationMs, reason, reportId,
    });
    return response.data;
  }

  async unbanUser(userId) {
    const response = await api.post(`${this.basePath}/users/${userId}/unban`);
    return response.data;
  }

  async getBans() {
    const response = await api.get(`${this.basePath}/bans`);
    return response.data;
  }
}

const adminService = new AdminService();
export default adminService;
