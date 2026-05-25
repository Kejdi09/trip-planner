import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 128,
  },
  statusMessage: {
    color: '#A19D9D',
    fontSize: 15,
    fontWeight: '500',
  },
  loadMoreWrapper: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  loadMoreButton: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#008D9B',
    backgroundColor: '#FFFFFF',
  },
  loadMoreText: {
    color: '#008D9B',
    fontSize: 13,
    fontWeight: '700',
  },
});
