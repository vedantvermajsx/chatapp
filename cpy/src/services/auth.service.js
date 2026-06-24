import api from './api.js';

class AuthService{
  constructor() {
    this.basePath = '/auth';
  }


  async checkUsername(username) {
      const response = await api.get(`${this.basePath}/check-username?username=${encodeURIComponent(username)}`);
      return response.data;
  }

  async login(credentials) {
    const response = await api.post(`${this.basePath}/login`, credentials);
    return response.data;
  }

  async register(userData) {
    const response = await api.post(`${this.basePath}/register`, userData);
    return response.data;
  }

  async guestLogin(guestData) {
   try{
    const response = await api.post(`${this.basePath}/guest`, guestData);
    
    return response.data;
   }catch(error){
    console.log(error.message);
    return error.response.data;
   }
  }

  async logout() {
    await api.post(`${this.basePath}/logout`);
  }


}

const authService = new AuthService();
export default authService;
