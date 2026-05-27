import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLoading } from '@/components/common/AppLoading';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from '../../../lib/notifications-api';

const parseContent = (content: string | null, title?: string | null, body?: string | null) => {
  if (title || body) return { title: title ?? 'Notification', body: body ?? '' };
  if (!content) return { title: 'Notification', body: '' };
  try { const p = JSON.parse(content) as { title?: string; body?: string }; return { title: p.title ?? 'Notification', body: p.body ?? '' }; }
  catch { return { title: 'Notification', body: content }; }
};
const formatTime = (v: string) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(); };

export function NotificationsScreen() {
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setItems(await fetchNotifications());
    } catch {
      setItems([]);
      setErrorMessage('Unable to load notifications right now.');
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FCFD' }}><AppLoading message="Loading notifications..." /></SafeAreaView>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FCFD' }}><View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={20} color="#0F172A" /></Pressable><Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>Notifications</Text><Pressable disabled={items.length === 0 || items.every((n) => n.is_read)} onPress={async () => { await markAllNotificationsRead(); setItems((p) => p.map((n) => ({ ...n, is_read: true }))); }}><Text style={{ color: items.length === 0 || items.every((n) => n.is_read) ? '#94A3B8' : '#008D9B', fontWeight: '700' }}>Mark all</Text></Pressable></View><ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>{errorMessage ? <Text style={{ color: '#DC2626' }}>{errorMessage}</Text> : null}{items.length === 0 ? <Text style={{ color: '#64748B' }}>No notifications yet.</Text> : items.map((n) => { const c = parseContent(n.content, n.title, n.body); return <Pressable key={n.id} onPress={async () => { if (!n.is_read) { await markNotificationRead(n.id); setItems((p) => p.map((x) => x.id === n.id ? { ...x, is_read: true } : x)); } }} style={{ backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: n.is_read ? '#E2E8F0' : '#7DD3FC', padding: 14, marginBottom: 10 }}><Text style={{ fontWeight: '800', color: '#0F172A' }}>{c.title}</Text><Text style={{ color: '#475569', marginTop: 4 }}>{c.body}</Text><Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 12 }}>{formatTime(n.created_at)}{n.is_read ? ' · Read' : ' · Unread'}</Text></Pressable>; })}</ScrollView></SafeAreaView>;
}
