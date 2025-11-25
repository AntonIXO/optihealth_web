import { memoizeObjectArguments } from '../helpers';
import { mixNumberColors } from '../helpers';
import { getDayInMonth, months, timestampInDay } from '../helpers';
import {
  chartHeaderBaselineOffset,
  chartHeaderFontSize,
  chartHeaderFontWeight,
  chartHeaderShrinkStartWidth,
  textColors,
  fontFamily
} from '../constants';
import drawRotatingDisplay from './rotatingDisplay';

export default function makeChartTop(ctx: CanvasRenderingContext2D) {
  return memoizeObjectArguments(({
    x, y, width, height, rightMargin,
    startDay, startMonth, startYear,
    endDay, endMonth, endYear,
    pixelRatio,
    theme
  }: any) => {
    ctx.save();
    ctx.clearRect(x, y, width, height);
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    const fontSize = chartHeaderFontSize * pixelRatio * Math.min(1, width / pixelRatio / chartHeaderShrinkStartWidth);
    const spaceWidth = 4 / 13 * fontSize;
    const commonArguments = {
      ctx,
      y: y + chartHeaderBaselineOffset * pixelRatio,
      containerAlign: 'right',
      baseline: 'alphabetic',
      fontFamily,
      fontSize,
      fontWeight: chartHeaderFontWeight,
      topAlign: 1,
      bottomAlign: 1,
      color: mixNumberColors(textColors[0], textColors[1], theme)
    };
    let rightPosition = y + width - rightMargin;

    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: endYear
    });
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: endMonth,
      getItemText: getMonthText
    });
    rightPosition -= Math.max(1.39 * fontSize, drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: endDay,
      getItemText: getDayText
    }));
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: 0,
      getItemText: returnDash
    });
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: startYear
    });
    rightPosition -= spaceWidth + drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: startMonth,
      getItemText: getMonthText
    });
    drawRotatingDisplay({
      ...commonArguments,
      x: rightPosition,
      position: startDay,
      getItemText: getDayText
    });

    ctx.restore();
  });
}

function getMonthText(monthNumber: number) {
  return months[monthNumber % 12];
}

function getDayText(dayNumber: number) {
  return getDayInMonth(dayNumber * timestampInDay);
}

function returnDash() {
  return '-';
}
