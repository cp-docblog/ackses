import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

/** Icon paths transcribed from the inline SVGs in the design prototype. */
export type IconName =
  | 'vin'
  | 'check'
  | 'search'
  | 'camera'
  | 'filters'
  | 'home'
  | 'cart'
  | 'user'
  | 'grid'
  | 'shop'
  | 'orders'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'scan'
  | 'info'
  | 'target';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = colors.white, strokeWidth = 2 }: Props) {
  const stroke = { stroke: color, strokeWidth, fill: 'none' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'vin' && (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={2} {...stroke} />
          <Path d="M7 10v4M11 10v4M15 10v4" {...stroke} />
        </>
      )}
      {name === 'check' && <Path d="m5 12 5 5L20 7" {...stroke} strokeWidth={strokeWidth + 1} />}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="m20 20-3.5-3.5" {...stroke} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M4 8a2 2 0 0 1 2-2h2l2-2h4l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" {...stroke} />
          <Circle cx={12} cy={13} r={3.5} {...stroke} />
        </>
      )}
      {name === 'filters' && (
        <Path d="M4 7h16M7 12h10M10 17h4" {...stroke} strokeLinecap="round" />
      )}
      {name === 'home' && <Path d="M3 11 12 3l9 8v10H3z" {...stroke} />}
      {name === 'cart' && (
        <>
          <Path d="M3 4h2l2.5 11h11L21 7H6.5" {...stroke} />
          <Circle cx={9} cy={20} r={1.5} {...stroke} />
          <Circle cx={17} cy={20} r={1.5} {...stroke} />
        </>
      )}
      {name === 'user' && (
        <>
          <Path d="M4 20a8 8 0 0 1 16 0" {...stroke} />
          <Circle cx={12} cy={8} r={4} {...stroke} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x={3} y={3} width={8} height={8} rx={2} {...stroke} />
          <Rect x={13} y={3} width={8} height={8} rx={2} {...stroke} />
          <Rect x={3} y={13} width={8} height={8} rx={2} {...stroke} />
          <Rect x={13} y={13} width={8} height={8} rx={2} {...stroke} />
        </>
      )}
      {name === 'shop' && <Path d="M3 9l2-5h14l2 5M3 9h18v11H3zM9 20v-6h6v6" {...stroke} />}
      {name === 'orders' && (
        <>
          <Rect x={4} y={3} width={16} height={18} rx={2} {...stroke} />
          <Path d="M8 8h8M8 12h8M8 16h5" {...stroke} />
        </>
      )}
      {name === 'edit' && <Path d="M4 20h4l10-10-4-4L4 16z" {...stroke} />}
      {name === 'trash' && <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...stroke} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} strokeWidth={strokeWidth + 1} />}
      {name === 'scan' && (
        <Path
          d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
          {...stroke}
        />
      )}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M12 8v5M12 16h.01" {...stroke} />
        </>
      )}
      {name === 'target' && (
        <>
          <Circle cx={12} cy={12} r={8} {...stroke} />
          <Circle cx={12} cy={12} r={3} {...stroke} />
        </>
      )}
    </Svg>
  );
}

/** The red star-burst verification mark that sits after shop and seller names. */
export function VerifiedMark({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m12 2 2.4 2.4 3.4-.4.8 3.3 3 1.7-1.5 3 1.5 3-3 1.7-.8 3.3-3.4-.4L12 22l-2.4-2.4-3.4.4-.8-3.3-3-1.7 1.5-3-1.5-3 3-1.7.8-3.3 3.4.4z"
        fill={colors.red}
      />
      <Path d="m8.5 12 2.5 2.5 4.5-5" stroke={colors.white} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}

/** Filled check-in-a-circle used on the seller account header. */
export function VerifiedDot({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={colors.red} />
      <Path d="m8 12 3 3 5-6" stroke={colors.white} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}
