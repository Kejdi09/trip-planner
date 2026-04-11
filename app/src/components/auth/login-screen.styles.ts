import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (value: number) => Math.round(value * TYPE_SCALE);

const COLORS = {
  background: '#F5F6F8',
  primary: '#1097A8',
  text: '#111318',
  mutedText: '#C7CAD1',
  label: '#2D2F37',
  border: '#D4D8DE',
  inputBackground: '#F8F9FB',
  inputText: '#2A2C33',
  placeholder: '#A3A7AF',
  error: '#D54545',
  success: '#1F7A57',
  buttonText: '#FFFFFF',
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: rs(16),
    paddingHorizontal: 24,
    paddingBottom: rs(14),
    backgroundColor: COLORS.background,
  },
  topSection: {
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(34),
  },
  logoBadge: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  brandText: {
    fontSize: rs(24),
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: rs(20),
  },
  tabButton: {
    width: '50%',
    alignItems: 'center',
    paddingBottom: rs(8),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: rs(18),
    fontWeight: '700',
    color: COLORS.mutedText,
    letterSpacing: -0.3,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  inputLabel: {
    marginBottom: rs(8),
    fontSize: rs(15),
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: -0.2,
  },
  input: {
    height: rs(52),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: rs(14),
    fontSize: rs(16),
    color: COLORS.inputText,
    backgroundColor: COLORS.inputBackground,
  },
  emailInput: {
    marginBottom: rs(16),
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: rs(16),
  },
  passwordInput: {
    paddingRight: rs(46),
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  confirmPasswordInput: {
    marginBottom: rs(14),
  },
  errorMessage: {
    marginBottom: rs(8),
    color: COLORS.error,
    fontSize: rs(13),
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  statusMessage: {
    marginBottom: rs(8),
    color: COLORS.success,
    fontSize: rs(13),
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  eyeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: rs(52),
    width: rs(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    height: rs(52),
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(16),
    boxShadow: '0px 4px 8px rgba(11, 111, 123, 0.18)',
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.72,
  },
  primaryButtonText: {
    fontSize: rs(18),
    fontWeight: '700',
    color: COLORS.buttonText,
    letterSpacing: -0.1,
  },
  forgotLink: {
    alignSelf: 'center',
  },
  forgotLinkText: {
    color: COLORS.primary,
    fontSize: rs(16),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: rs(6),
  },
  footerText: {
    color: '#8F949F',
    fontSize: rs(14),
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  footerAction: {
    color: COLORS.primary,
    fontSize: rs(15),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
