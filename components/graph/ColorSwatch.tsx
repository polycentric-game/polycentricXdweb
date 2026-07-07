import { cn } from '@/lib/utils';

interface ColorSwatchProps {
  color: string;
  className?: string;
}

/** Renders a legend/filter swatch using the exact graph hex color. */
export function ColorSwatch({ color, className }: ColorSwatchProps) {
  return (
    <div
      className={cn('w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/15', className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
