export type MenuRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type PlaceFixedMenuInput = {
  trigger: MenuRect;
  panel: { width: number; height: number };
  viewport: { width: number; height: number };
  gap?: number;
  padding?: number;
  align?: 'start' | 'end';
  prefer?: 'above' | 'below' | 'auto';
};

export type PlaceFixedMenuResult = {
  top: number;
  left: number;
  placement: 'above' | 'below';
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}

function resolvePlacement(
  prefer: 'above' | 'below' | 'auto',
  fitsAbove: boolean,
  fitsBelow: boolean,
  spaceAbove: number,
  spaceBelow: number,
): 'above' | 'below' {
  if (prefer === 'below') {
    return fitsBelow || !fitsAbove ? 'below' : 'above';
  }
  if (prefer === 'above') {
    return fitsAbove || !fitsBelow ? 'above' : 'below';
  }
  if (fitsBelow) return 'below';
  if (fitsAbove) return 'above';
  return spaceBelow >= spaceAbove ? 'below' : 'above';
}

export function placeFixedMenu({
  trigger,
  panel,
  viewport,
  gap = 6,
  padding = 8,
  align = 'end',
  prefer = 'auto',
}: PlaceFixedMenuInput): PlaceFixedMenuResult {
  const spaceBelow = viewport.height - (trigger.top + trigger.height);
  const spaceAbove = trigger.top;
  const needed = panel.height + gap;
  const placement = resolvePlacement(
    prefer,
    spaceAbove >= needed,
    spaceBelow >= needed,
    spaceAbove,
    spaceBelow,
  );

  const unclampedTop =
    placement === 'below'
      ? trigger.top + trigger.height + gap
      : trigger.top - panel.height - gap;
  const unclampedLeft =
    align === 'end'
      ? trigger.left + trigger.width - panel.width
      : trigger.left;

  const maxTop = Math.max(padding, viewport.height - panel.height - padding);
  const maxLeft = Math.max(padding, viewport.width - panel.width - padding);

  return {
    top: clamp(unclampedTop, padding, maxTop),
    left: clamp(unclampedLeft, padding, maxLeft),
    placement,
  };
}
