import React from 'react';
import { Platform, useWindowDimensions, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme';

interface Props {
  children: React.ReactNode;
  bg?: 'soft' | 'transparent';
}

/**
 * On web (preview), renders a phone-shaped frame with a soft gradient backdrop.
 * On native (real device), just renders the content fullscreen.
 */
export const MobileFrame: React.FC<Props> = ({ children, bg = 'soft' }) => {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isPhonePreview = isWeb && width > 500;

  if (!isPhonePreview) {
    return <View style={{ flex: 1, backgroundColor: 'transparent' }}>{children}</View>;
  }

  const w = 390;
  const h = Math.min(844, height - 32);

  return (
    <LinearGradient
      colors={bg === 'soft' ? (gradients.bgScreen as any) : ['#000', '#000']}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{
        width: w,
        height: h,
        backgroundColor: '#0F0F19',
        borderRadius: 56,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.4,
        shadowRadius: 48,
      }}>
        <View style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: 44,
          overflow: 'hidden',
        }}>
          {children}
        </View>
      </View>
    </LinearGradient>
  );
};

export default MobileFrame;
