import api from './api.js';

class UserService {
  constructor() {
    this.basePath = '/users';
  }

  async deleteUser(userId) {
    const response = await api.delete(`${this.basePath}/${userId}`);
    return response.data;
  }

  async getProfile() {
    const response = await api.get(`${this.basePath}/profile`);
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await api.put(`${this.basePath}/profile`, profileData);
    return response.data;
  }

  async getActivityStatus(userId) {
    const response = await api.get(`${this.basePath}/activity-status`, {
      params: { userId }
    });
    return response.data.data;
  }
}

const userService = new UserService();
export default userService;
