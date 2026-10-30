import api from './api.js';

class ReportService {
  constructor() {
    this.basePath = '/reports';
  }

  // Sends the decrypted (plaintext) content so admins can review the actual message.
  async reportMessage({ messageId, reportedUserId, roomId, content, media, reason, note }) {
    const response = await api.post(this.basePath, {
      messageId,
      reportedUserId,
      roomId,
      content,
      media,
      reason,
      note,
    });
    return response.data;
  }
}

const reportService = new ReportService();
export default reportService;
