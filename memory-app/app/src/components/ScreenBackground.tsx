import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, GradientName } from '../theme';

interface Props {
  children: React.ReactNode;
  variant?: GradientName;
}

export const ScreenBackground: React.FC<Props> = ({ children, variant = 'bgScreen' }) => {
  return (
    <LinearGradient
      colors={gradients[variant] as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </LinearGradient>
  );
};

export default ScreenBackground;
