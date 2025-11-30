export const backupApi = {
  async createBackup() {
    const response = await fetch('/api/backup', { method: 'POST' });
    if (!response.ok) throw new Error('Backup failed');
    return response.json();
  },

  async getProgress() {
    const response = await fetch('/api/backup/progress');
    if (!response.ok) throw new Error('Failed to get progress');
    return response.json();
  },

  async restoreBackup(backupData: any) {
    const response = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData })
    });
    if (!response.ok) throw new Error('Restore failed');
    return response.json();
  }
};
