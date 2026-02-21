import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Rect,
  Path,
  Line,
  Polygon,
} from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, color = '#FF006E' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.7} />
        </LinearGradient>
        <LinearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF006E" />
          <Stop offset="100%" stopColor="#FF1493" />
        </LinearGradient>
      </Defs>

      <G transform="translate(50, 50)">
        {/* Briefcase body */}
        <Rect
          x={-24}
          y={-16}
          width={48}
          height={32}
          rx={4}
          fill="url(#logoGradient)"
          opacity={0.9}
        />

        {/* Briefcase handle */}
        <Path
          d="M -16 -16 Q -16 -28 0 -28 Q 16 -28 16 -16"
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />

        {/* Briefcase detail line */}
        <Line
          x1={-24}
          y1={-4}
          x2={24}
          y2={-4}
          stroke="white"
          strokeWidth={1.5}
          opacity={0.6}
        />

        {/* Swipe arrow shaft */}
        <Line
          x1={28}
          y1={0}
          x2={44}
          y2={0}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Swipe arrow head */}
        <Polygon points="44,0 40,3 40,-3" fill={color} />

        {/* Heart accent */}
        <G transform="translate(-28, -8) scale(0.7)">
          <Path
            d="M 12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="url(#heartGradient)"
          />
        </G>
      </G>
    </Svg>
  );
};

export default Logo;
