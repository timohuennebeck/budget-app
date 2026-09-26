import { useRef } from 'react';
import { type LayoutRectangle, View, type ViewProps } from 'react-native';

export interface MeasuredViewProps extends ViewProps {
  /** Called with the view's window coordinates after every layout */
  onMeasure: (rect: LayoutRectangle) => void;
}

// View that reports where it sits on screen, e.g. for coach marks. Measures
// through a ref because layout events carry no measureInWindow on web.
export function MeasuredView({ onMeasure, onLayout, ...props }: MeasuredViewProps) {
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      onLayout={(event) => {
        onLayout?.(event);
        ref.current?.measureInWindow((x, y, width, height) => onMeasure({ x, y, width, height }));
      }}
      {...props}
    />
  );
}
