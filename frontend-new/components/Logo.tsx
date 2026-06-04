import React from 'react';
import Svg, { Defs, LinearGradient, Stop, G, Circle, Path, Rect } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

/**
 * SwipeConnect logo — two person silhouettes connected by an arc, representing
 * professional networking. Replaces the old briefcase-and-heart mark.
 */
const Logo: React.FC<LogoProps> = ({ size = 40, color = '#FF006E' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.65" />
        </LinearGradient>
      </Defs>

      {/* Soft background square */}
      <Rect x="3" y="3" width="94" height="94" rx="22" fill={color} opacity="0.08" />

      {/* ── Left person ─────────────────────────────────── */}
      {/* Head */}
      <Circle cx="28" cy="30" r="12" fill="url(#lg)" />
      {/* Shoulders / body */}
      <Path d="M6 76 Q6 54 28 54 Q50 54 50 76" fill="url(#lg)" />

      {/* ── Right person ────────────────────────────────── */}
      {/* Head */}
      <Circle cx="72" cy="30" r="12" fill="url(#lg)" />
      {/* Shoulders / body */}
      <Path d="M50 76 Q50 54 72 54 Q94 54 94 76" fill="url(#lg)" />

      {/* ── Connection arc between the two people ───────── */}
      <Path
        d="M 36 23 Q 50 8 64 23"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Connection dot at the top of the arc */}
      <Circle cx="50" cy="11" r="5" fill={color} />
    </Svg>
  );
};

export default Logo;
