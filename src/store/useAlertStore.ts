import { create } from "zustand";
import { PriceAlert, Asset } from "../types";
import { dbService } from "../firebase/config";
import { useAuthStore } from "./useAuthStore";
import { useToastStore } from "./useToastStore";

export interface AlertState {
  alerts: PriceAlert[];
  loading: boolean;
  triggeredAlerts: string[];
  notifPermission: NotificationPermission;
  fetchAlerts: (uid: string) => Promise<void>;
  createAlert: (uid: string, symbol: string, assetType: any, condition: "above" | "below", value: number) => Promise<void>;
  deleteAlert: (uid: string, alertId: string) => Promise<void>;
  toggleAlert: (uid: string, alertId: string) => Promise<void>;
  checkAlerts: (prices: Asset[]) => void;
  clearTriggered: () => void;
  requestNotifPermission: () => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  loading: false,
  triggeredAlerts: [],
  notifPermission: typeof Notification !== "undefined" ? Notification.permission : "default",
  fetchAlerts: async (uid) => {
    set({ loading: true });
    try {
      const alerts = await dbService.getAlerts(uid);
      set({ alerts, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  createAlert: async (uid, symbol, assetType, condition, value) => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      symbol,
      assetType,
      condition,
      targetPrice: value,
      isActive: true,
      isTriggered: false,
      createdAt: new Date().toISOString()
    };
    await dbService.saveAlert(uid, newAlert);
    set({ alerts: [...get().alerts, newAlert] });
  },
  deleteAlert: async (uid, alertId) => {
    await dbService.deleteAlert(uid, alertId);
    set({ alerts: get().alerts.filter(a => a.id !== alertId) });
  },
  toggleAlert: async (uid, alertId) => {
    const alert = get().alerts.find(a => a.id === alertId);
    if (alert) {
      const updated = { ...alert, isActive: !alert.isActive };
      await dbService.saveAlert(uid, updated);
      set({ alerts: get().alerts.map(a => a.id === alertId ? updated : a) });
    }
  },
  requestNotifPermission: async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    set({ notifPermission: permission });
  },
  checkAlerts: (prices) => {
    const active = get().alerts.filter(a => a.isActive && !a.isTriggered);
    if (active.length === 0) return;

    let triggered: string[] = [];
    const authUser = useAuthStore.getState().user;
    const uid = authUser?.uid;
    const { addToast } = useToastStore.getState();

    const updatedAlerts = get().alerts.map(alert => {
      const asset = prices.find(p => p.symbol === alert.symbol);
      if (!asset || !alert.isActive || alert.isTriggered) return alert;

      let isTriggered = false;
      if (alert.condition === "above" && asset.price >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === "below" && asset.price <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        const body = `${alert.symbol} went ${alert.condition} ₹${alert.targetPrice.toLocaleString()} · Current: ₹${asset.price.toLocaleString()}`;

        triggered.push(body);

        // 1. Browser Notification API
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(`🔔 Alert Triggered — ${alert.symbol}`, {
              body,
              icon: "/favicon.ico",
              tag: alert.id,
              requireInteraction: false,
            });
          } catch (_) {}
        }

        // 2. In-app Toast
        addToast({
          title: "Price Alert Triggered",
          message: body,
          type: "alert",
          symbol: alert.symbol,
        });

        const updated = {
          ...alert,
          isTriggered: true,
          isActive: false,
          triggeredAt: new Date().toISOString()
        };
        if (uid) {
          dbService.saveAlert(uid, updated);
        }
        return updated;
      }
      return alert;
    });

    if (triggered.length > 0) {
      set({
        alerts: updatedAlerts,
        triggeredAlerts: [...get().triggeredAlerts, ...triggered]
      });
    }
  },
  clearTriggered: () => set({ triggeredAlerts: [] })
}));
