import { memoizeObjectArguments } from './helpers';
import { quadOut, cubicOut, makeAnimationGroup, makeExponentialTransition, makeInstantWhenHiddenTransition, makeLogarithmicTransition, makeTransition, makeTransitionGroup } from './animation';
import { getLinesMinAndMaxValues, getMaxSumOnRange, getMinAndMaxOnRange, linesObjectToVectorArray, getLinesMinAndMaxOnRange, getMinAndMaxFromLinesCache, getDateComponentsForRange as getDataDateComponentsForRangeHelperImport, inRange } from './helpers';
import { getDateNotchScale, getValueRangeForFixedNotches, getValueRangeForFixedBottom, getSubDecimalScale } from './helpers';
import { themeTransitionDuration, chartMapHeight, chartMapBottom, chartSidePadding, chartValueScaleMaxNotchCount, chartValue2YScaleNotchCount, chartMapCornerRadius, chartValueAreaNotchCount } from './constants';
// SafariAssKicker is skipped, we assume modern browsers
import { TYPE_AREA, TYPE_BAR, TYPE_LINE, TYPE_LINE_TWO_Y } from './constants';
import watchGestures from './gestures';
import makeChartDrawer from './drawers/chart';

const minMapSelectionLength = 5;

/**
 * Draws and operates one chart
 */
interface ChartOptions {
  onRangeChange?: (range: { start: number; end: number }) => void;
}

export default function makeChart(element: HTMLElement, {name, type, dates, lines}: any, initialTheme = 'day', options: ChartOptions = {}) {
  // The arguments store the unaltered chart state

  const linesMinAndMax = type === TYPE_LINE || type === TYPE_LINE_TWO_Y ? getLinesMinAndMaxValues(lines) : {};

  const minIndex = type === TYPE_BAR ? -0.5 : 0;
  const maxIndex = dates.length - (type === TYPE_BAR ? 0.5 : 1);

  /**
   * Stores the plain not animated chart state
   */
  const state = getInitialState(lines, minIndex, maxIndex, initialTheme);

  /**
   * Stores the animated chart state
   */
  const transitions = createTransitionGroup({type, lines, dates, state, linesMinAndMax, onUpdate: updateView});

  // Creating a DOM and a WebGL renderer
  // We assume element is the container
  const {
    chartBox,
    mainCanvas,
    mapCanvas,
  } = createDOM(element, name);

  const updateCanvases = makeChartDrawer(mainCanvas, mapCanvas, type, lines, dates, minIndex, maxIndex);
  const gesturesWatcher = watchGestures(chartBox, getStateForGestureWatcher(minIndex, maxIndex, state.startIndex, state.endIndex), {
    mapSelectorStart: handleStartIndexChange,
    mapSelectorMiddle: handleIndexMove,
    mapSelectorEnd: handleEndIndexChange,
    detailsPosition: handleDetailsPositionChange
  });

  // Public API to toggle lines externally
  function toggleLine(key: string) {
     handleToggleLine(key);
  }

  function handleToggleLine(key: string) {
    const {lines} = state;

    setState({
      lines: {
        ...lines,
        [key]: {
          ...lines[key],
          enabled: !lines[key].enabled
        }
      }
    });
  }

  function handleWindowResize() {
    setState({
      mainCanvasWidth: mainCanvas.clientWidth,
      mainCanvasHeight: mainCanvas.clientHeight,
      mapCanvasWidth: mapCanvas.clientWidth,
      mapCanvasHeight: mapCanvas.clientHeight,
      pixelRatio: window.devicePixelRatio || 1
    });
  }

  function handleStartIndexChange(relativeIndex: number) {
    const x = minIndex + relativeIndex * (maxIndex - minIndex);
    const startIndex = inRange(minIndex, x, maxIndex - minMapSelectionLength);
    const endIndex = Math.max(state.endIndex, startIndex + minMapSelectionLength);

    setState({startIndex, endIndex});
  }

  function handleEndIndexChange(relativeIndex: number) {
    const x = minIndex + relativeIndex * (maxIndex - minIndex);
    const endIndex = inRange(minIndex + minMapSelectionLength, x, maxIndex);
    const startIndex = Math.min(state.startIndex, endIndex - minMapSelectionLength);

    setState({startIndex, endIndex});
  }

  function handleIndexMove(relativeMiddleX: number) {
    const x = minIndex + relativeMiddleX * (maxIndex - minIndex);
    const currentXLength = state.endIndex - state.startIndex;
    const startIndex = inRange(minIndex, x - currentXLength / 2, maxIndex - currentXLength);
    const endIndex = startIndex + currentXLength;

    setState({startIndex, endIndex});
  }

  function handleDetailsPositionChange(relativeX: number | null) {
    if (relativeX === null) {
      setState({detailsIndex: null});
    } else {
      const index = state.startIndex + (state.endIndex - state.startIndex) * relativeX;
      setState({
        detailsIndex: inRange(0, Math.round(index), dates.length - 1)
      });
    }
  }

  /**
   * Every state change must come here. This function decides what to update when the state changes.
   */
  function setState(newState: any) {
    const oldStartIndex = state.startIndex;
    const oldEndIndex = state.endIndex;

    Object.assign(state, newState);

    if (options.onRangeChange && (state.startIndex !== oldStartIndex || state.endIndex !== oldEndIndex)) {
        const startTs = dates[inRange(0, Math.round(state.startIndex), dates.length - 1)];
        const endTs = dates[inRange(0, Math.round(state.endIndex), dates.length - 1)];
        options.onRangeChange({ start: startTs, end: endTs });
    }

    applyMapValueRange(linesMinAndMax, state.lines);
    applyLinesOpacity(state.lines);
    applyMainValueRange(lines, state.lines, state.startIndex, state.endIndex);
    applyDatesRange(dates, minIndex, maxIndex, state.startIndex, state.endIndex);
    applyDetailsPosition(state.detailsIndex, state.startIndex, state.endIndex);
    applyTheme(state.theme);

    transitions.updateOnNextFrame();
  }

  const applyMapValueRange = memoizeObjectArguments((linesMinAndMax: any, linesState: any) => {
    switch (type) {
      case TYPE_LINE: {
        const {min, max} = getMinAndMaxFromLinesCache(linesMinAndMax, linesState);

        // Don't shrink the chart when all the lines are disabled
        if (isFinite(min) && isFinite(max)) {
          transitions.setTargets({
            mapMinValue: min,
            mapMaxValue: max
          });
        }
        break;
      }
      case TYPE_BAR: {
        const maxSum = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), 0, Infinity);

        if (maxSum > 0) {
          transitions.setTargets({
            mapMaxValue: maxSum
          });
        }
      }
    }
  });

  const applyLinesOpacity = memoizeObjectArguments((linesState: any) => {
    const linesOpacity: any = {};
    for (const key in linesState) {
      if (linesState.hasOwnProperty(key)) {
        linesOpacity[key] = linesState[key].enabled ? 1 : 0;
      }
    }

    transitions.setTargets({linesOpacity});
  });

  const applyMainValueRange = memoizeObjectArguments((linesData: any, linesState: any, startIndex: number, endIndex: number) => {
    switch (type) {
      case TYPE_LINE: {
        const {min, max} = getLinesMinAndMaxOnRange(linesData, linesState, startIndex, endIndex);

        // Don't shrink the chart when all the lines are disabled
        if (isFinite(min) && isFinite(max)) {
          const minMax = getValueRangeForFixedBottom(min, max, chartValueScaleMaxNotchCount);

          transitions.setTargets({
            mainMinValue: minMax.min,
            mainMaxValue: minMax.max,
            mainValueNotchScale: minMax.notchScale
          });
        }
        break;
      }
      case TYPE_LINE_TWO_Y: {
        const [mainLineKey, altLineKey] = Object.keys(lines);
        const rawMinMax = getMinAndMaxOnRange(lines[mainLineKey].values, startIndex, endIndex);
        const minMax = getValueRangeForFixedNotches(rawMinMax.min, rawMinMax.max, chartValue2YScaleNotchCount);
        const rawAltMinMax = getMinAndMaxOnRange(lines[altLineKey].values, startIndex, endIndex);
        const altMinMax = getValueRangeForFixedNotches(rawAltMinMax.min, rawAltMinMax.max, chartValue2YScaleNotchCount);

        transitions.setTargets({
          mainMinValue: minMax.min,
          mainMaxValue: minMax.max,
          mainValueNotchScale: minMax.notchScale,
          mainAltMinValue: altMinMax.min,
          mainAltMaxValue: altMinMax.max,
          mainAltValueNotchScale: altMinMax.notchScale
        });
        break;
      }
      case TYPE_BAR: {
        const maxSum = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), startIndex, endIndex);
        const minMax = getValueRangeForFixedBottom(0, maxSum, chartValueScaleMaxNotchCount);

        if (maxSum > 0) {
          transitions.setTargets({
            mainMinValue: minMax.min,
            mainMaxValue: minMax.max,
            mainValueNotchScale: minMax.notchScale
          });
        }
      }
    }
  });

  const applyDatesRange = memoizeObjectArguments((dates: number[], minIndex: number, maxIndex: number, startIndex: number, endIndex: number) => {
    const startDate = getDataDateComponentsForRangeLocal(dates, startIndex);
    const endDate = getDataDateComponentsForRangeLocal(dates, endIndex);

    transitions.setTargets({
      dateNotchScale: getDateNotchScale(endIndex - startIndex),
      rangeStartDay: startDate.day,
      rangeStartMonth: startDate.month,
      rangeStartYear: startDate.year,
      rangeEndDay: endDate.day,
      rangeEndMonth: endDate.month,
      rangeEndYear: endDate.year,
    });

    gesturesWatcher.setChartState(getStateForGestureWatcher(minIndex, maxIndex, startIndex, endIndex));
  });

  const applyDetailsPosition = memoizeObjectArguments((detailsIndex: number | null, startIndex: number, endIndex: number) => {
    if (detailsIndex === null) {
      transitions.setTargets({
        detailsPosition: [undefined, 0]
      });
      return;
    }

    const detailsDate = getDataDateComponentsForRangeLocal(dates, detailsIndex);
    const relativePosition = (detailsIndex - startIndex) / (endIndex - startIndex);

    transitions.setTargets({
      detailsPosition: [{
        ...detailsDate,
        index: detailsIndex,
        align: relativePosition > 0.5 ? 0 : 1
      }, 1]
    });
  });

  const applyTheme = memoizeObjectArguments((theme: string) => {
    transitions.setTargets({
      theme: theme === 'day' ? 0 : 1
    });
  });

  /**
   * Applies the current dist chart state to the chart
   */
  function updateView() {
    const {
      startIndex,
      endIndex,
      mainCanvasWidth,
      mainCanvasHeight,
      mapCanvasWidth,
      mapCanvasHeight,
      pixelRatio,
      lines: linesState
    } = state;

    const {
      linesOpacity,
      detailsPosition: [
        {
          index: detailsIndex,
          day: detailsDay,
          month: detailsMonth,
          year: detailsYear,
          align: detailsAlign
        } = {} as any,
        detailsOpacity
      ],
      ...restTransitionState
    } = transitions.getState();

    updateCanvases({
      ...restTransitionState,
      mainCanvasWidth: mainCanvasWidth * pixelRatio,
      mainCanvasHeight: mainCanvasHeight * pixelRatio,
      mapCanvasWidth: mapCanvasWidth * pixelRatio,
      mapCanvasHeight: mapCanvasHeight * pixelRatio,
      pixelRatio,
      startIndex,
      endIndex,
      detailsIndex,
      detailsDay,
      detailsMonth,
      detailsYear,
      detailsAlign,
      detailsOpacity
    }, linesOpacity);
  }

  return {
    start() {
      window.addEventListener('resize', handleWindowResize);
      handleWindowResize();
    },
    setTheme(theme: string) {
      setState({theme});
    },
    toggleLine,
    destroy() {
       window.removeEventListener('resize', handleWindowResize);
       transitions.destroy();
       gesturesWatcher.destroy();
       element.innerHTML = ''; // Cleanup DOM
    }
  }
};

function getInitialState(lines: any, minIndex: number, maxIndex: number, theme: string) {
  const linesState: any = {};
  for (const key of Object.keys(lines)) {
    linesState[key] = {
      enabled: true
    }
  }

  return {
    mainCanvasWidth: 0,
    mainCanvasHeight: 0,
    mapCanvasWidth: 0,
    mapCanvasHeight: 0,
    pixelRatio: 1,
    startIndex: minIndex + (maxIndex - minIndex) * 0.73,
    endIndex: maxIndex,
    lines: linesState,
    detailsIndex: null,
    theme
  }
}

function createTransitionGroup({
  type,
  lines,
  dates,
  state: {startIndex, endIndex, theme, lines: linesState},
  linesMinAndMax,
  onUpdate
}: any) {
  const startDate = getDataDateComponentsForRangeLocal(dates, startIndex);
  const endDate = getDataDateComponentsForRangeLocal(dates, endIndex);
  let mapMinValue;
  let mapMaxValue;
  let mapAltMinValue;
  let mapAltMaxValue;
  let mainMinValue;
  let mainMaxValue;
  let mainValueNotchScale;
  let mainAltMinValue;
  let mainAltMaxValue;
  let mainAltValueNotchScale;
  let useLinearValueTransition = false;

  switch (type) {
    case TYPE_LINE: {
      const mapMinMax = getMinAndMaxFromLinesCache(linesMinAndMax, linesState);
      mapMinValue = mapMinMax.min;
      mapMaxValue = mapMinMax.max;
      const rawMainMinMax = getLinesMinAndMaxOnRange(lines, linesState, startIndex, endIndex);
      const mainMinMax = getValueRangeForFixedBottom(rawMainMinMax.min, rawMainMinMax.max, chartValueScaleMaxNotchCount);
      mainMinValue = mainMinMax.min;
      mainMaxValue = mainMinMax.max;
      mainValueNotchScale = mainMinMax.notchScale;
      break;
    }
    case TYPE_LINE_TWO_Y: {
      const [mainLineKey, altLineKey] = Object.keys(lines);
      const mapMinMax = linesMinAndMax[mainLineKey];
      mapMinValue = mapMinMax.min;
      mapMaxValue = mapMinMax.max;
      const mapAltMinMax = linesMinAndMax[altLineKey];
      mapAltMinValue = mapAltMinMax.min;
      mapAltMaxValue = mapAltMinMax.max;
      const mainRawMinMax = getMinAndMaxOnRange(lines[mainLineKey].values, startIndex, endIndex);
      const mainMinMax = getValueRangeForFixedNotches(mainRawMinMax.min, mainRawMinMax.max, chartValue2YScaleNotchCount);
      mainMinValue = mainMinMax.min;
      mainMaxValue = mainMinMax.max;
      mainValueNotchScale = mainMinMax.notchScale;
      const mainAltRawMinMax = getMinAndMaxOnRange(lines[altLineKey].values, startIndex, endIndex);
      const mainAltMinMax = getValueRangeForFixedNotches(mainAltRawMinMax.min, mainAltRawMinMax.max, chartValue2YScaleNotchCount);
      mainAltMinValue = mainAltMinMax.min;
      mainAltMaxValue = mainAltMinMax.max;
      mainAltValueNotchScale = mainAltMinMax.notchScale;
      break;
    }
    case TYPE_BAR: {
      mapMinValue = 0;
      mapMaxValue = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), 0, dates.length - 1);
      const mainMaxSum = getMaxSumOnRange(linesObjectToVectorArray(lines, linesState), startIndex, endIndex);
      const mainMinMax = getValueRangeForFixedBottom(0, mainMaxSum, chartValueScaleMaxNotchCount);
      mainMinValue = mainMinMax.min;
      mainMaxValue = mainMinMax.max;
      mainValueNotchScale = mainMinMax.notchScale;
      useLinearValueTransition = true;
      break;
    }
    case TYPE_AREA: {
      mapMinValue = 0;
      mapMaxValue = 100;
      mainMinValue = 0;
      mainMaxValue = 100;
      mainValueNotchScale = getSubDecimalScale(100 / chartValueAreaNotchCount);
      break;
    }
  }

  const valueTransitionFactory = useLinearValueTransition ? makeTransition : makeExponentialTransition;
  const valueNotchScaleTransitionFactory = useLinearValueTransition ? makeLogarithmicTransition : makeTransition;

  const detailsTransitionOptions = {
    easing: cubicOut,
    duration: 300
  };

  const linesOpacityTransitions: any = {};
  for (const [key, {enabled}] of Object.entries(linesState) as any) {
    linesOpacityTransitions[key] = makeTransition(enabled ? 1 : 0);
  }

  return makeAnimationGroup({
    linesOpacity: makeTransitionGroup(linesOpacityTransitions),
    mapMinValue: valueTransitionFactory(mapMinValue),
    mapMaxValue: valueTransitionFactory(mapMaxValue),
    mapAltMinValue: valueTransitionFactory(mapAltMinValue),
    mapAltMaxValue: valueTransitionFactory(mapAltMaxValue),
    mainMinValue: valueTransitionFactory(mainMinValue),
    mainMaxValue: valueTransitionFactory(mainMaxValue),
    mainValueNotchScale: valueNotchScaleTransitionFactory(mainValueNotchScale),
    mainAltMinValue: valueTransitionFactory(mainAltMinValue),
    mainAltMaxValue: valueTransitionFactory(mainAltMaxValue),
    mainAltValueNotchScale: valueNotchScaleTransitionFactory(mainAltValueNotchScale),
    dateNotchScale: makeTransition(getDateNotchScale(endIndex - startIndex), {
      maxDistance: 1.5
    }),
    detailsPosition: makeInstantWhenHiddenTransition(
      makeTransitionGroup({
        index: makeTransition(0, detailsTransitionOptions),
        day: makeTransition(0, detailsTransitionOptions),
        month: makeTransition(0, detailsTransitionOptions),
        year: makeTransition(0, detailsTransitionOptions),
        align: makeTransition(0)
      }),
      makeTransition(0, {
        duration: 300
      })
    ),
    rangeStartDay: makeTransition(startDate.day, {easing: quadOut}),
    rangeStartMonth: makeTransition(startDate.month, {easing: quadOut}),
    rangeStartYear: makeTransition(startDate.year, {easing: quadOut}),
    rangeEndDay: makeTransition(endDate.day, {easing: quadOut}),
    rangeEndMonth: makeTransition(endDate.month, {easing: quadOut}),
    rangeEndYear: makeTransition(endDate.year, {easing: quadOut}),
    theme: makeTransition(theme === 'day' ? 0 : 1, {duration: themeTransitionDuration}),
  }, onUpdate);
}

function createDOM(root: HTMLElement, name: string) {
    // We manually create the structure to match what React will expect or just insert it.
    // React will provide a container. We insert canvas inside.

    // <div class="chart">
    //    <canvas class="mapCanvas" ...></canvas>
    //    <canvas class="mainCanvas" ...></canvas>
    // </div>

    const chartDiv = document.createElement('div');
    chartDiv.style.position = 'relative';
    chartDiv.style.height = '100%';
    chartDiv.style.width = '100%';
    chartDiv.style.userSelect = 'none';
    chartDiv.style.webkitUserSelect = 'none';
    // -webkit-tap-highlight-color: transparent;

    const mapCanvas = document.createElement('canvas');
    mapCanvas.style.position = 'absolute';
    mapCanvas.style.zIndex = '0';
    mapCanvas.style.left = `${chartSidePadding}px`;
    mapCanvas.style.bottom = `${chartMapBottom}px`;
    mapCanvas.style.width = `calc(100% - ${chartSidePadding * 2}px)`;
    mapCanvas.style.height = `${chartMapHeight}px`;
    mapCanvas.style.borderRadius = `${chartMapCornerRadius}px`;

    const mainCanvas = document.createElement('canvas');
    mainCanvas.style.position = 'absolute';
    mainCanvas.style.zIndex = '1';
    mainCanvas.style.top = '0';
    mainCanvas.style.left = '0';
    mainCanvas.style.width = '100%';
    mainCanvas.style.height = '100%';

    chartDiv.appendChild(mapCanvas);
    chartDiv.appendChild(mainCanvas);
    root.appendChild(chartDiv);

    return {
        chartBox: chartDiv,
        mainCanvas,
        mapCanvas
    };
}

function getStateForGestureWatcher(minIndex: number, maxIndex: number, startIndex: number, endIndex: number) {
  return {
    mapSelectorStart: (startIndex - minIndex) / ((maxIndex - minIndex) || 1),
    mapSelectorEnd: (endIndex - minIndex) / ((maxIndex - minIndex) || 1)
  };
}

function getDataDateComponentsForRangeLocal(dates: number[], index: number) {
  const timestamp = dates[inRange(0, Math.round(index), dates.length - 1)];
  return getDataDateComponentsForRangeHelper(timestamp);
}

function getDataDateComponentsForRangeHelper(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  return {
    year,
    month: year * 12 + monthIndex,
    day: Math.floor(timestamp / 86400000)
  };
}
