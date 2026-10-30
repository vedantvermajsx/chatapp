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
}

const adminService = new AdminService();
export default adminService;
