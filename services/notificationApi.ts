export const notificationApi = {
  async getPreferences() {
    const res = await fetch('/api/notifications/preferences');
    return res.json();
  },

  async updatePreferences(prefs: any) {
    const res = await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    return res.json();
  }
};
