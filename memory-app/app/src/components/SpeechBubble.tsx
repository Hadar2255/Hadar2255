import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SpeechBubble: React.FC<Props> = ({ children, style }) => {
  return (
    <View style={{ position: 'relative', flex: 1 }}>
      <View style={[{
        backgroundColor: colors.surface,
        borderColor: colors.primaryLighter,
        borderWidth: 3,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        ...shadows.md,
      }, style]}>
        {children}
      </View>
    </View>
  );
};

export default SpeechBubble;
