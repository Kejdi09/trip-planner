import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (value: number) => Math.round(value * TYPE_SCALE);

const COLORS = {
  background: '#F5F6F8',
  primary: '#1097A8',
  text: '#111318',
  label: '#2D2F37',
  border: '#D4D8DE',
  inputBackground: '#F8F9FB',
  inputText: '#2A2C33',
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
    marginBottom: rs(26),
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
  title: {
    marginBottom: rs(8),
    fontSize: rs(24),
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginBottom: rs(18),
    fontSize: rs(14),
    fontWeight: '600',
    color: '#6F7481',
    lineHeight: rs(20),
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
  passwordInputContainer: {
    position: 'relative',
    marginBottom: rs(14),
  },
  passwordInput: {
    paddingRight: rs(46),
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
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
  primaryButton: {
    height: rs(52),
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
    marginBottom: rs(12),
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
  backLink: {
    alignSelf: 'center',
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: rs(16),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
