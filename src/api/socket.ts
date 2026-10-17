/**
 * CollabFlow Real-Time WebSocket Manager
 *
 * Multiplexed WebSocket client with JWT authentication, auto-reconnect
 * with exponential backoff and jitter, client-side presence heartbeats,
 * event bus subscriber model, and catch-up mechanism using last_seen_id.
 */

import { apiClient } from './client';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface SocketMessage<T = any> {
  type: string;
  payload?: T;
  [key: string]: any;
}

type EventHandler<T = any> = (data: T) => void;

class SocketManager {
  private socket: WebSocket | null = null;
  private status: SocketStatus = 'disconnected';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private lastSeenIds: Map<string, string> = new Map(); // channelId -> last_seen_id
  private currentChannelId: string | null = null;
  private isExplicitDisconnect: boolean = false;

  private getWsUrl(channelId?: string): string {
    const customWs = import.meta.env.VITE_WS_URL as string | undefined;
    if (customWs) {
      return customWs;
    }

    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = loc.host;
    const ch = channelId || this.currentChannelId || 'general';
    return `${protocol}//${host}/ws/chat/${ch}/`;
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  private setStatus(newStatus: SocketStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((cb) => cb(newStatus));
    }
  }

  /**
   * Connect to WebSocket server for a given channel/room
   */
  public connect(channelId?: string): void {
    if (channelId) {
      this.currentChannelId = channelId;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitDisconnect = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const token = apiClient.getAccessToken();
    let url = this.getWsUrl(channelId);
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(token)}`;
    }

    try {
      this.socket = new WebSocket(url);
    } catch {
      this.handleSocketError();
      return;
    }

    this.socket.onopen = () => {
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      // Catch-up: request messages since last seen
      if (this.currentChannelId && this.lastSeenIds.has(this.currentChannelId)) {
        this.send({
          type: 'catch_up',
          channel_id: this.currentChannelId,
          last_seen_id: this.lastSeenIds.get(this.currentChannelId),
        });
      }

      this.emit('socket:connected', { channelId: this.currentChannelId });
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data: SocketMessage = JSON.parse(event.data);
        if (data && data.type) {
          // If this is a chat message, record last seen id
          if (data.type === 'chat.message' && data.payload?.id && data.payload?.channelId) {
            this.lastSeenIds.set(data.payload.channelId, data.payload.id);
          }
          this.emit(data.type, data.payload || data);
        }
      } catch {
        // Plain text or unparseable frame
      }
    };

    this.socket.onclose = () => {
      this.cleanup();
      this.setStatus('disconnected');
      if (!this.isExplicitDisconnect) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      this.handleSocketError();
    };
  }

  /**
   * Disconnect explicitly
   */
  public disconnect(): void {
    this.isExplicitDisconnect = true;
    this.cleanup();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Ignore
      }
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  private handleSocketError(): void {
    this.cleanup();
    if (!this.isExplicitDisconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Stopped attempting after maximum retries
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, capped at 30s + jitter
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000) + Math.random() * 1000;
    this.setStatus('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'client_heartbeat', timestamp: Date.now() });
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send JSON payload to WebSocket
   */
  public send(message: SocketMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Event bus subscriptions
   */
  public subscribe<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.unsubscribe(event, handler);
  }

  public unsubscribe<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = any>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in socket listener for ${event}:`, err);
        }
      });
    }
  }

  public recordLastSeen(channelId: string, messageId: string): void {
    this.lastSeenIds.set(channelId, messageId);
  }
}

export const socketManager = new SocketManager();
