import { View, Text, FlatList, Image, StyleSheet, SafeAreaView } from 'react-native';

const DUMMY_POSTS = [
  {
    id: '1',
    user: 'Kejdi',
    destination: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500',
    caption: 'Amazing trip to Paris! 🗼',
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    user: 'Arta',
    destination: 'Rome, Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500',
    caption: 'Roma is unreal 🍕',
    likes: 18,
    comments: 3,
  },
  {
    id: '3',
    user: 'Drin',
    destination: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500',
    caption: 'Best sunset of my life 🌅',
    likes: 42,
    comments: 8,
  },
];

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>TripSync ✈️</Text>
      <FlatList
        data={DUMMY_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user[0]}</Text>
              </View>
              <View>
                <Text style={styles.username}>{item.user}</Text>
                <Text style={styles.destination}>📍 {item.destination}</Text>
              </View>
            </View>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.cardFooter}>
              <Text style={styles.caption}>{item.caption}</Text>
              <View style={styles.actions}>
                <Text style={styles.action}>❤️ {item.likes}</Text>
                <Text style={styles.action}>💬 {item.comments}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', marginBottom: 12, borderRadius: 12, overflow: 'hidden', marginHorizontal: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  username: { fontWeight: 'bold', fontSize: 14 },
  destination: { color: '#888', fontSize: 12 },
  image: { width: '100%', height: 250 },
  cardFooter: { padding: 12 },
  caption: { fontSize: 14, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 16 },
  action: { fontSize: 14, color: '#555' },
});