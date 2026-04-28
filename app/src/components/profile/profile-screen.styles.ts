import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E7E7",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111111",
  },
  headerIconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 26,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  username: {
    fontSize: 15,
    color: "#8A8A8A",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 18,
  },
  statBlock: {
    alignItems: "center",
    minWidth: 80,
  },
  statValue: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111111",
  },
  statLabel: {
    marginTop: 2,
    fontSize: 14,
    color: "#8A8A8A",
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 18,
  },
  editButton: {
    backgroundColor: "#E9EEF4",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
  },
  cardsSection: {
    marginTop: 28,
    paddingHorizontal: 18,
    gap: 14,
  },
  actionCard: {
    minHeight: 92,
    borderWidth: 1.5,
    borderColor: "#A9E2E8",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111111",
  },
  actionSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#8A8A8A",
  },
  settingsSection: {
    marginTop: 26,
    paddingHorizontal: 22,
  },
  settingsHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6B6B6B",
    marginBottom: 12,
  },
  settingsRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingsText: {
    fontSize: 18,
    color: "#222222",
    fontWeight: "500",
  },
});
