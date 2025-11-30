export const pushApi = {
  async subscribe(subscription: PushSubscription) {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });
    return res.json();
  },

  async unsubscribe(subscription: PushSubscription) {
    const res = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });
    return res.json();
  },

  async getStatus() {
    const res = await fetch('/api/push/status');
    return res.json();
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notificações não suportadas');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers não suportados');
    }

    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registado:', reg);
      return reg;
    } catch (error) {
      console.error('Erro ao registar Service Worker:', error);
      throw error;
    }
  },

  async subscribeToPush() {
    try {
      // Registar Service Worker
      const reg = await this.registerServiceWorker();

      // Pedir permissão
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Permissão de notificações negada');
      }

      // Get public key (empty for now - usar VAPID em produção)
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: undefined // VAPID public key em produção
      });

      // Subscribe no backend
      await this.subscribe(subscription);

      return subscription;
    } catch (error) {
      console.error('Erro ao subscribir push:', error);
      throw error;
    }
  },

  async unsubscribeFromPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        await this.unsubscribe(subscription);
        await subscription.unsubscribe();
      }

      return true;
    } catch (error) {
      console.error('Erro ao unsubscriber push:', error);
      throw error;
    }
  }
};
