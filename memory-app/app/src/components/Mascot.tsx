import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Path, Circle, Line, G } from 'react-native-svg';

interface Props {
  size?: number;
}

export const Mascot: React.FC<Props> = ({ size = 200 }) => {
  return (
    <Svg width={size} height={(size * 280) / 240} viewBox="0 0 240 280">
      <Defs>
        <LinearGradient id="bodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#C4B5FD" />
          <Stop offset="100%" stopColor="#7C3AED" />
        </LinearGradient>
        <LinearGradient id="bodyGradShade" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A78BFA" stopOpacity="0" />
          <Stop offset="100%" stopColor="#5B21B6" stopOpacity="0.55" />
        </LinearGradient>
        <LinearGradient id="bellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#FFFBEB" />
          <Stop offset="100%" stopColor="#FEF3C7" />
        </LinearGradient>
        <LinearGradient id="faceGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#FFF7ED" />
        </LinearGradient>
        <LinearGradient id="beakGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
        <LinearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#F59E0B" />
        </LinearGradient>
        <RadialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FB7185" stopOpacity="0.7" />
          <Stop offset="60%" stopColor="#FB7185" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FBBF24" stopOpacity="0.7" />
          <Stop offset="60%" stopColor="#FBBF24" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="120" cy="265" rx="58" ry="6" fill="#1F2937" opacity="0.12" />
      <Path d="M 82 230 Q 78 250 92 252 Q 100 248 96 232 Z" fill="#5B21B6" />
      <Path d="M 158 230 Q 162 250 148 252 Q 140 248 144 232 Z" fill="#5B21B6" />
      <Path d="M 120 240 Q 113 258 120 260 Q 127 258 120 240 Z" fill="#6D28D9" />

      <Ellipse cx="98" cy="248" rx="11" ry="6" fill="url(#beakGrad)" />
      <Ellipse cx="142" cy="248" rx="11" ry="6" fill="url(#beakGrad)" />
      <Circle cx="92" cy="250" r="2.5" fill="#92400E" />
      <Circle cx="98" cy="252" r="2.5" fill="#92400E" />
      <Circle cx="104" cy="250" r="2.5" fill="#92400E" />
      <Circle cx="136" cy="250" r="2.5" fill="#92400E" />
      <Circle cx="142" cy="252" r="2.5" fill="#92400E" />
      <Circle cx="148" cy="250" r="2.5" fill="#92400E" />

      <Ellipse cx="120" cy="170" rx="68" ry="78" fill="url(#bodyGrad)" />
      <Ellipse cx="120" cy="170" rx="68" ry="78" fill="url(#bodyGradShade)" />

      <Path d="M 120 145 C 95 145 84 168 86 200 C 88 225 105 235 120 235 C 135 235 152 225 154 200 C 156 168 145 145 120 145 Z" fill="url(#bellyGrad)" />

      <Path d="M 56 158 Q 42 168 48 200 Q 55 222 70 218 Q 78 200 75 175 Q 70 155 56 158 Z" fill="url(#bodyGrad)" />
      <Path d="M 56 158 Q 42 168 48 200 Q 55 222 70 218 Q 78 200 75 175 Q 70 155 56 158 Z" fill="url(#bodyGradShade)" />
      <Path d="M 184 158 Q 198 168 192 200 Q 185 222 170 218 Q 162 200 165 175 Q 170 155 184 158 Z" fill="url(#bodyGrad)" />
      <Path d="M 184 158 Q 198 168 192 200 Q 185 222 170 218 Q 162 200 165 175 Q 170 155 184 158 Z" fill="url(#bodyGradShade)" />

      <G transform="translate(135 200) rotate(8)">
        <Circle cx="0" cy="0" r="32" fill="url(#glow)" />
        <Path d="M -18 -22 L 18 -22 L 18 6 L -18 6 Z" fill="url(#bookGrad)" stroke="#92400E" strokeWidth="1.5" />
        <Path d="M -15 -19 L 15 -19 L 15 3 L -15 3 Z" fill="#FFFBEB" />
        <Line x1="-10" y1="-12" x2="10" y2="-12" stroke="#92400E" strokeWidth="1" />
        <Line x1="-10" y1="-7" x2="10" y2="-7" stroke="#92400E" strokeWidth="1" />
        <Line x1="-10" y1="-2" x2="5" y2="-2" stroke="#92400E" strokeWidth="1" />
        <Circle cx="-22" cy="-26" r="2" fill="#FBBF24" />
        <Circle cx="20" cy="-28" r="1.5" fill="#FBBF24" />
        <Circle cx="22" cy="6" r="1.8" fill="#FBBF24" />
      </G>

      <Path d="M 120 70 C 90 60 65 78 65 110 C 65 140 95 165 120 175 C 145 165 175 140 175 110 C 175 78 150 60 120 70 Z" fill="url(#faceGrad)" />

      <Path d="M 72 65 L 65 35 L 90 55 Z" fill="url(#bodyGrad)" />
      <Path d="M 72 65 L 65 35 L 90 55 Z" fill="url(#bodyGradShade)" />
      <Path d="M 168 65 L 175 35 L 150 55 Z" fill="url(#bodyGrad)" />
      <Path d="M 168 65 L 175 35 L 150 55 Z" fill="url(#bodyGradShade)" />

      <Path d="M 76 58 L 72 45 L 84 53 Z" fill="#FBBF24" opacity="0.4" />
      <Path d="M 164 58 L 168 45 L 156 53 Z" fill="#FBBF24" opacity="0.4" />

      <Ellipse cx="82" cy="125" rx="12" ry="8" fill="url(#cheekGrad)" />
      <Ellipse cx="158" cy="125" rx="12" ry="8" fill="url(#cheekGrad)" />

      <Circle cx="95" cy="110" r="22" fill="#1F2937" />
      <Circle cx="145" cy="110" r="22" fill="#1F2937" />
      <Circle cx="100" cy="103" r="7" fill="white" />
      <Circle cx="150" cy="103" r="7" fill="white" />
      <Circle cx="90" cy="115" r="3" fill="white" opacity="0.85" />
      <Circle cx="140" cy="115" r="3" fill="white" opacity="0.85" />
      <Circle cx="103" cy="100" r="1.5" fill="white" />
      <Circle cx="153" cy="100" r="1.5" fill="white" />

      <Path d="M 80 80 Q 95 73 110 82" stroke="#5B21B6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M 130 82 Q 145 73 160 80" stroke="#5B21B6" strokeWidth="3" fill="none" strokeLinecap="round" />

      <Path d="M 120 130 L 113 142 Q 120 148 127 142 Z" fill="url(#beakGrad)" />
      <Path d="M 113 148 Q 120 152 127 148" stroke="#92400E" strokeWidth="1.3" fill="none" opacity="0.55" strokeLinecap="round" />

      <Path d="M 30 80 L 32 86 L 38 88 L 32 90 L 30 96 L 28 90 L 22 88 L 28 86 Z" fill="#FBBF24" opacity="0.85" />
      <Path d="M 205 100 L 207 105 L 212 107 L 207 109 L 205 114 L 203 109 L 198 107 L 203 105 Z" fill="#FBBF24" opacity="0.7" />
      <Circle cx="40" cy="45" r="2" fill="#FBBF24" opacity="0.85" />
      <Circle cx="200" cy="55" r="2.5" fill="#FBBF24" opacity="0.85" />
      <Circle cx="215" cy="170" r="2" fill="#FBBF24" opacity="0.85" />
      <Circle cx="22" cy="140" r="1.8" fill="#FBBF24" opacity="0.85" />
    </Svg>
  );
};

export default Mascot;
