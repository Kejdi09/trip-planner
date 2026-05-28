import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type AppLoadingProps = {
  message?: string;
};

const GLOBE_SIZE = 108;
const ORBIT_SIZE = 154;
const PLANE_BADGE_SIZE = 34;
const PLANE_SIZE = 17;

export function AppLoading({ message = 'Getting things ready...' }: AppLoadingProps) {
  const orbitRotation = React.useRef(new Animated.Value(0)).current;
  const glowPulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1400,
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

  const planeCounterRotate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['35deg', '-325deg'],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.34],
  });

  return (
    <View style={styles.container}>
      <View style={styles.animationStage}>
        <Animated.View style={[styles.outerGlow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
        <View style={styles.innerGlow} />

        <View style={styles.globeShadow}>
          <View style={styles.globe}>
            <View style={styles.oceanHighlight} />

            <View style={[styles.landMass, styles.landNorthAmerica]} />
            <View style={[styles.landMass, styles.landSouthAmerica]} />
            <View style={[styles.landMass, styles.landEuropeAfrica]} />
            <View style={[styles.landMass, styles.landAsia]} />
            <View style={[styles.landMass, styles.landAustralia]} />

            <View style={styles.equator} />
            <View style={[styles.latitudeRing, styles.latitudeNorth]} />
            <View style={[styles.latitudeRing, styles.latitudeSouth]} />
            <View style={[styles.longitudeRing, styles.longitudeCenter]} />
            <View style={[styles.longitudeRing, styles.longitudeLeft]} />
            <View style={[styles.longitudeRing, styles.longitudeRight]} />
          </View>
        </View>

        <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitRotate }] }]}>
          <Animated.View style={[styles.planeBadge, { transform: [{ rotate: planeCounterRotate }] }]}>
            <Ionicons name="airplane" size={PLANE_SIZE} color="#008D9B" />
          </Animated.View>
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
    backgroundColor: '#F4FBFC',
    paddingHorizontal: 24,
  },
  animationStage: {
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    width: GLOBE_SIZE + 34,
    height: GLOBE_SIZE + 34,
    borderRadius: 999,
    backgroundColor: '#67E8F9',
  },
  innerGlow: {
    position: 'absolute',
    width: GLOBE_SIZE + 18,
    height: GLOBE_SIZE + 18,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 141, 155, 0.10)',
  },
  globeShadow: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: '#008D9B',
    shadowColor: '#006D78',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  globe: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: '#0EA5C6',
    borderWidth: 2,
    borderColor: '#BDEEF2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  oceanHighlight: {
    position: 'absolute',
    top: 8,
    left: 14,
    width: 62,
    height: 52,
    borderRadius: 31,
    backgroundColor: 'rgba(125, 211, 252, 0.38)',
    transform: [{ rotate: '-18deg' }],
  },
  landMass: {
    position: 'absolute',
    backgroundColor: 'rgba(204, 251, 241, 0.86)',
    borderRadius: 999,
  },
  landNorthAmerica: {
    top: 29,
    left: 20,
    width: 27,
    height: 19,
    transform: [{ rotate: '-24deg' }],
  },
  landSouthAmerica: {
    top: 55,
    left: 39,
    width: 17,
    height: 31,
    transform: [{ rotate: '-19deg' }],
  },
  landEuropeAfrica: {
    top: 35,
    left: 59,
    width: 20,
    height: 41,
    transform: [{ rotate: '10deg' }],
  },
  landAsia: {
    top: 30,
    right: 12,
    width: 32,
    height: 24,
    transform: [{ rotate: '16deg' }],
  },
  landAustralia: {
    right: 21,
    bottom: 28,
    width: 19,
    height: 11,
    transform: [{ rotate: '-7deg' }],
  },
  equator: {
    position: 'absolute',
    width: '92%',
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(240, 253, 250, 0.72)',
  },
  latitudeRing: {
    position: 'absolute',
    width: '86%',
    height: 26,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 253, 250, 0.54)',
  },
  latitudeNorth: {
    top: 24,
  },
  latitudeSouth: {
    bottom: 24,
  },
  longitudeRing: {
    position: 'absolute',
    width: 36,
    height: '93%',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 253, 250, 0.58)',
  },
  longitudeCenter: {
    width: 2,
    borderWidth: 0,
    backgroundColor: 'rgba(240, 253, 250, 0.62)',
  },
  longitudeLeft: {
    transform: [{ rotate: '-12deg' }],
  },
  longitudeRight: {
    transform: [{ rotate: '12deg' }],
  },
  orbit: {
    position: 'absolute',
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    borderRadius: ORBIT_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 141, 155, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeBadge: {
    position: 'absolute',
    top: -PLANE_BADGE_SIZE / 2,
    left: ORBIT_SIZE / 2 - PLANE_BADGE_SIZE / 2,
    width: PLANE_BADGE_SIZE,
    height: PLANE_BADGE_SIZE,
    borderRadius: PLANE_BADGE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BDEEF2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006D78',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  message: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#0F766E',
    textAlign: 'center',
  },
});
