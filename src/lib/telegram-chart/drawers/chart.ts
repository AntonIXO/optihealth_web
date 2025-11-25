import {
  chartMainTopMargin,
  chartMapHeight,
  chartMapBottom,
  chartMainLinesBottomMargin,
  chartSidePadding,
  chartColumnDetailsY,
  chartColumnDetailsXMargin,
  chartColumnDetailsWidth,
  chartColumnDetailsMinDistanceToEdge
} from '../constants';
import { TYPE_AREA } from '../constants';

// We will import drawers from this file as well to avoid circular dependency or multi-file complexity for now.
// Or better, we define drawers in separate files and import here.
// The plan said "Create src/lib/telegram-chart/drawers/ directory".
// So I should stick to that.

import makeChartTop from './chartTop';
import makeChartMainWithoutX from './chartMainWithoutX';
import makeChartX from './chartX';
import makeChartMap from './chartMap';
import { makePercentageAreaCache } from './percentageArea';
import makeColumnDetails from './columnDetails';
import { memoizeObjectArguments } from '../helpers';

export default function makeChartDrawer(
  mainCanvas: HTMLCanvasElement,
  mapCanvas: HTMLCanvasElement,
  type: string,
  linesData: any,
  dates: number[],
  minIndex: number,
  maxIndex: number
) {
  const mainCtx = mainCanvas.getContext('2d')!;
  const mapCtx = mapCanvas.getContext('2d')!;
  const percentageAreaCache = type === TYPE_AREA ? makePercentageAreaCache(linesData) : () => [];

  // Using a simplified memoizer for canvas resizing
  let lastMainWidth = 0, lastMainHeight = 0;
  let forceRedrawMainCanvas = 0;

  const updateMainCanvasSize = (width: number, height: number) => {
    if (width !== lastMainWidth || height !== lastMainHeight) {
      mainCanvas.width = width;
      mainCanvas.height = height;
      lastMainWidth = width;
      lastMainHeight = height;
      ++forceRedrawMainCanvas;
    }
  };

  let lastMapWidth = 0, lastMapHeight = 0;
  const updateMapCanvasSize = (width: number, height: number) => {
     if (width !== lastMapWidth || height !== lastMapHeight) {
      mapCanvas.width = width;
      mapCanvas.height = height;
      lastMapWidth = width;
      lastMapHeight = height;
    }
  };

  const drawChartTop = makeChartTop(mainCtx);
  const drawChartMainWithoutX = makeChartMainWithoutX(mainCtx, type, linesData, percentageAreaCache);
  const drawChartX = makeChartX(mainCtx, dates, minIndex, maxIndex);
  const drawColumnDetails = makeColumnDetails(mainCtx, type, linesData);
  const drawChartMap = makeChartMap(mapCtx, type, linesData, minIndex, maxIndex, percentageAreaCache);

  let wasDetailsPopupDrawn = false;

  return (state: any, linesOpacity: any) => {
    const {
        mainCanvasWidth,
        mainCanvasHeight,
        mapCanvasWidth,
        mapCanvasHeight,
        pixelRatio = 1,
        mapMinValue,
        mapMaxValue,
        mapAltMinValue,
        mapAltMaxValue,
        mainMinValue,
        mainMaxValue,
        mainValueNotchScale,
        mainAltMinValue,
        mainAltMaxValue,
        mainAltValueNotchScale,
        dateNotchScale,
        startIndex,
        endIndex,
        detailsIndex,
        detailsDay,
        detailsMonth,
        detailsYear,
        detailsAlign,
        detailsOpacity,
        rangeStartDay,
        rangeStartMonth,
        rangeStartYear,
        rangeEndDay,
        rangeEndMonth,
        rangeEndYear,
        theme
    } = state;

    const mainSectionY = chartMainTopMargin * pixelRatio;
    const mainSectionHeight = mainCanvasHeight - (chartMainLinesBottomMargin + chartMapHeight + chartMapBottom) * pixelRatio - mainSectionY;
    const doDrawDetailsPopup = detailsOpacity > 0 && detailsIndex !== null;

    updateMainCanvasSize(mainCanvasWidth, mainCanvasHeight);
    updateMapCanvasSize(mapCanvasWidth, mapCanvasHeight);

    if (doDrawDetailsPopup) {
      mainCtx.clearRect(0, 0, mainCanvasWidth, mainCanvasHeight);
      forceRedrawMainCanvas++;
      wasDetailsPopupDrawn = true;
    } else if (wasDetailsPopupDrawn) {
      forceRedrawMainCanvas++;
      wasDetailsPopupDrawn = false;
    }

    drawChartTop({
      x: 0,
      y: 0,
      width: mainCanvasWidth,
      height: mainSectionY,
      rightMargin: chartSidePadding * pixelRatio,
      startDay: rangeStartDay,
      startMonth: rangeStartMonth,
      startYear: rangeStartYear,
      endDay: rangeEndDay,
      endMonth: rangeEndMonth,
      endYear: rangeEndYear,
      pixelRatio,
      theme,
      _: forceRedrawMainCanvas
    });

    drawChartMainWithoutX({
      x: 0,
      y: mainSectionY,
      width: mainCanvasWidth,
      height: mainSectionHeight,
      minValue: mainMinValue,
      maxValue: mainMaxValue,
      valueNotchScale: mainValueNotchScale,
      altMinValue: mainAltMinValue,
      altMaxValue: mainAltMaxValue,
      altValueNotchScale: mainAltValueNotchScale,
      startIndex,
      endIndex,
      detailsIndex,
      detailsOpacity,
      pixelRatio,
      theme,
      _: forceRedrawMainCanvas
    }, linesOpacity);

    drawChartX({
      x: 0,
      y: mainSectionY + mainSectionHeight,
      width: mainCanvasWidth,
      height: mainCanvasHeight - mainSectionY - mainSectionHeight,
      startIndex,
      endIndex,
      dateNotchScale,
      pixelRatio,
      theme,
      _: forceRedrawMainCanvas
    });

    if (doDrawDetailsPopup) {
      drawColumnDetails({
        x: Math.round(getDetailsPopupX(mainCanvasWidth, pixelRatio, detailsIndex, startIndex, endIndex, detailsAlign)),
        y: chartColumnDetailsY * pixelRatio,
        ctx: mainCtx,
        pixelRatio,
        theme,
        type,
        linesData,
        linesOpacity,
        index: detailsIndex,
        day: detailsDay,
        month: detailsMonth,
        year: detailsYear,
        opacity: detailsOpacity
      });
    }

    drawChartMap({
      canvasWidth: mapCanvasWidth,
      canvasHeight: mapCanvasHeight,
      minValue: mapMinValue,
      maxValue: mapMaxValue,
      altMinValue: mapAltMinValue,
      altMaxValue: mapAltMaxValue,
      pixelRatio
    }, linesOpacity);
  };
}

function getDetailsPopupX(canvasWidth: number, pixelRatio: number, detailsIndex: number, startIndex: number, endIndex: number, align: number) {
  const pointerX = chartSidePadding * pixelRatio
    + (canvasWidth - chartSidePadding * 2 * pixelRatio) * (detailsIndex - startIndex) / (endIndex - startIndex);

  const xOnLeftAlign = Math.max(
    chartColumnDetailsMinDistanceToEdge * pixelRatio,
    pointerX - (chartColumnDetailsWidth + chartColumnDetailsXMargin) * pixelRatio
  );
  const xOnRightAlign = Math.min(
    canvasWidth - (chartColumnDetailsMinDistanceToEdge + chartColumnDetailsWidth) * pixelRatio,
    pointerX + chartColumnDetailsXMargin * pixelRatio
  );

  return xOnLeftAlign * (1 - align) + xOnRightAlign * align;
}
