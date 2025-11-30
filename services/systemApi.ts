export const systemApi = {
  async checkUpdateProgress() {
    const response = await fetch('/api/system/update-progress');
    if (!response.ok) throw new Error('Failed to get update progress');
    return response.json();
  },

  async executeUpdate() {
    const response = await fetch('/api/system/update', { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }
    return response.json();
  }
};
