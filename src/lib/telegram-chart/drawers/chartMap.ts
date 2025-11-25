import { memoizeObjectArguments } from '../helpers';
import {
  chartMapBarsVerticalPadding,
  chartMapLinesHorizontalMargin,
  chartMapLinesVerticalMargin,
  chartMapLineWidth
} from '../constants';
import { TYPE_AREA, TYPE_BAR, TYPE_LINE, TYPE_LINE_TWO_Y } from '../constants';
import drawLinesGroup from './linesGroup';
import makeBars from './bars';
import makePercentageArea from './percentageArea';

export default function makeChartMap(ctx: CanvasRenderingContext2D, type: string, linesData: any, minIndex: number, maxIndex: number, percentageAreaCache: any) {
  const [mainLineKey, altLineKey] = Object.keys(linesData);

  const drawBars = type === TYPE_BAR ? makeBars(ctx, linesData) : () => {};
  const drawPercentageArea = type === TYPE_AREA ? makePercentageArea(ctx, linesData, percentageAreaCache) : () => {};

  return memoizeObjectArguments(({
    canvasWidth, canvasHeight,
    minValue, maxValue, altMinValue, altMaxValue,
    pixelRatio
  }: any, linesOpacity: any) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const commonArguments = {
      ctx,
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight
    };

    switch (type) {
      case TYPE_LINE:
        drawLinesGroup({
          ...commonArguments,
          linesData,
          linesOpacity,
          fromX: chartMapLinesHorizontalMargin * pixelRatio,
          toX: canvasWidth - chartMapLinesHorizontalMargin * pixelRatio,
          fromIndex: minIndex,
          toIndex: maxIndex,
          fromY: canvasHeight - chartMapLinesVerticalMargin * pixelRatio,
          toY: chartMapLinesVerticalMargin * pixelRatio,
          fromValue: minValue,
          toValue: maxValue,
          lineWidth: chartMapLineWidth * pixelRatio
        });
        break;
      case TYPE_LINE_TWO_Y: {
        const _commonArguments = {
          linesOpacity,
          fromX: chartMapLinesHorizontalMargin * pixelRatio,
          toX: canvasWidth - chartMapLinesHorizontalMargin * pixelRatio,
          fromIndex: minIndex,
          toIndex: maxIndex,
          fromY: canvasHeight - chartMapLinesVerticalMargin * pixelRatio,
          toY: chartMapLinesVerticalMargin * pixelRatio,
          lineWidth: chartMapLineWidth * pixelRatio
        };
        drawLinesGroup({
          ...commonArguments,
          ..._commonArguments,
          fromValue: altMinValue,
          toValue: altMaxValue,
          linesData: {
            [altLineKey]: linesData[altLineKey]
          }
        });
        drawLinesGroup({
          ...commonArguments,
          ..._commonArguments,
          fromValue: minValue,
          toValue: maxValue,
          linesData: {
            [mainLineKey]: linesData[mainLineKey]
          }
        });
        break;
      }
      case TYPE_BAR: {
        drawBars({
          ...commonArguments,
          linesOpacity,
          fromX: 0,
          toX: canvasWidth,
          fromIndex: minIndex,
          toIndex: maxIndex,
          fromSum: minValue,
          toSum: maxValue,
          topPadding: chartMapBarsVerticalPadding * pixelRatio
        });
        break;
      }
      case TYPE_AREA: {
        drawPercentageArea({
          ...commonArguments,
          linesOpacity,
          fromX: 0,
          toX: canvasWidth,
          fromIndex: minIndex,
          toIndex: maxIndex
        });
      }
    }
  });
}
