import { formatDateForDateScale } from '../helpers';
import { mixNumberColors, numberColorToRGBA } from '../helpers';
import { dateNotchScaleBase } from '../constants';
import { chartScaleLabelColors, chartScaleLabelFontSize, fontFamily } from '../constants';

export default function drawDateScale({
  ctx,
  x, y, width,
  pixelRatio,
  dates,
  fromX,
  toX,
  fromIndex,
  toIndex,
  notchScale,
  theme
}: any) {
  if (fromIndex === toIndex) {
    return;
  }

  ctx.font = `${Math.round(chartScaleLabelFontSize * pixelRatio)}px/1 ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  const textColor = mixNumberColors(chartScaleLabelColors[0], chartScaleLabelColors[1], theme);
  const approximateLabelMaxWidth = 40 * pixelRatio;

  notchScale = Math.max(0, notchScale);

  const notchRange = dateNotchScaleBase ** Math.floor(notchScale);
  const secondaryNotchOpacity = 1 - (notchScale % 1);

  const realFromX = x - approximateLabelMaxWidth / 2;
  const realToX = x + width + approximateLabelMaxWidth / 2;
  const xPerIndex = (toX - fromX) / (toIndex - fromIndex);
  const realFromIndex = fromIndex - (xPerIndex === 0 ? 0 : (fromX - realFromX) / xPerIndex);

  for (
    let index = Math.max(0, Math.ceil(realFromIndex / notchRange) * notchRange);
    index < dates.length;
    index += notchRange
  ) {
    const x = fromX + (index - fromIndex) * xPerIndex;

    if (x >= realToX) {
      continue;
    }

    const isPrimary = (index / notchRange) % dateNotchScaleBase === 0;
    const opacity = isPrimary ? 1 : secondaryNotchOpacity;

    if (opacity <= 0) {
      continue;
    }

    ctx.fillStyle = numberColorToRGBA(textColor, opacity);
    ctx.fillText(formatDateForDateScale(dates[index]), Math.round(x), y);
  }
}
