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

  async getUserProfile(userId) {
    const response = await api.get(`${this.basePath}/${userId}/profile`);
    return response.data?.user;
  }

  async searchUsers(query, limit = 5) {
    const response = await api.get(`${this.basePath}/search`, {
      params: { q: query, limit }
    });
    const data = response.data;
    const list = Array.isArray(data) ? data : (data?.users || data?.data || []);
    const mapped = list.map((u) => ({
      id: u.userid || u.id || u._id,
      username: u.username,
      avatar: u.pfp ?? u.avatar ?? '',
      bio: u.bio ?? '',
    }));

    return mapped;
  }
}

const userService = new UserService();
export default userService;
