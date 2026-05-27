import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type AppLoadingProps = {
  message?: string;
};

const GLOBE_SIZE = 104;
const ORBIT_SIZE = 144;
const ORBIT_RADIUS = ORBIT_SIZE / 2;
const PLANE_SIZE = 18;

export function AppLoading({ message = 'Getting things ready...' }: AppLoadingProps) {
  const orbitRotation = React.useRef(new Animated.Value(0)).current;
  const glowPulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    orbitLoop.start();
    glowLoop.start();

    return () => {
      orbitLoop.stop();
      glowLoop.stop();
    };
  }, [glowPulse, orbitRotation]);

  const orbitRotate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.3],
  });

  return (
    <View style={styles.container}>
      <View style={styles.animationStage}>
        <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />

        <View style={styles.globe}>
          <View style={styles.meridian} />
          <View style={styles.equator} />
          <View style={[styles.latitude, styles.latitudeTop]} />
          <View style={[styles.latitude, styles.latitudeBottom]} />
          <View style={[styles.meridian, styles.meridianTilt]} />
        </View>

        <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitRotate }] }]}>
          <View style={styles.planeWrap}>
            <Ionicons name="airplane" size={PLANE_SIZE} color="#0284C7" />
          </View>
        </Animated.View>
      </View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FCFF',
    paddingHorizontal: 24,
  },
  animationStage: {
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: GLOBE_SIZE + 24,
    height: GLOBE_SIZE + 24,
    borderRadius: 999,
    backgroundColor: '#67E8F9',
  },
  globe: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: 999,
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  meridian: {
    position: 'absolute',
    width: 2,
    height: '82%',
    borderRadius: 999,
    backgroundColor: 'rgba(224, 242, 254, 0.8)',
  },
  meridianTilt: {
    transform: [{ rotate: '55deg' }],
    opacity: 0.55,
  },
  equator: {
    position: 'absolute',
    width: '85%',
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(224, 242, 254, 0.85)',
  },
  latitude: {
    position: 'absolute',
    width: '74%',
    height: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 242, 254, 0.55)',
  },
  latitudeTop: {
    top: 24,
  },
  latitudeBottom: {
    bottom: 24,
  },
  orbit: {
    position: 'absolute',
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeWrap: {
    position: 'absolute',
    top: ORBIT_SIZE / 2 - PLANE_SIZE / 2,
    left: ORBIT_SIZE / 2 + ORBIT_RADIUS - PLANE_SIZE - 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 4,
    shadowColor: '#0C4A6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F766E',
    textAlign: 'center',
  },
});
