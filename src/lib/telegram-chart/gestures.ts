import {
  chartMainTopMargin,
  chartMapHeight,
  chartSidePadding,
  chartMainLinesTopMargin,
  chartMainLinesBottomMargin,
  chartMapBottom,
  chartSelectorGripWidth,
} from './constants';
import { watchMouseDrag, watchTouchDrag, watchHover } from './helpers';
import { isInRectangle } from './helpers';

const mapGripOutsideOffset = 30;
const mapGripInsideOffset = Math.max(chartSelectorGripWidth, 15);
const mapGripVerticalOffset = 10;

export default function watchGestures(element: HTMLElement, chartState: any, callbacks: any) {
  chartState = {...chartState};

  let startMapSelectorDrag: any = null;
  let middleMapSelectorDrag: any = null;
  let endMapSelectorDrag: any = null;

  element.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('touchstart', handleTouchStart, {passive: false});

  const detailsHoverWatcher = watchHover({
    element,
    checkHover: (event: any) => {
      const {x, y} = getEventRelativeCoordinates(event);
      return isInMapLines(x, y);
    },
    onMove: (event: any) => {
      const {x} = getEventRelativeCoordinates(event);
      const {x: linesX, width: linesWidth} = getMainLinesBounds();
      callbacks.detailsPosition((x - linesX) / (linesWidth || 1))
    },
    onEnd: () => callbacks.detailsPosition(null)
  });

  return {
    setChartState(newState: any) {
      chartState = Object.assign(chartState, newState);
    },
    destroy() {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('touchstart', handleTouchStart);

      for (const watcher of [detailsHoverWatcher, startMapSelectorDrag, middleMapSelectorDrag, endMapSelectorDrag]) {
        if (watcher) {
          watcher.destroy();
        }
      }
    }
  };

  function handleMouseDown(event: MouseEvent) {
    event.preventDefault();
    const {x, y} = getEventRelativeCoordinates(event);

    if (isInMapSelectionStart(x, y)) {
      handleMapStartDrag(x, watchMouseDrag);
    } else if (isInMapSelectionEnd(x, y)) {
      handleMapEndDrag(x, watchMouseDrag);
    } else if (isInMapSelectionMiddle(x, y)) {
      handleMapMiddleDrag(x, watchMouseDrag);
    }
  }

  function handleTouchStart(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const {x, y} = getEventRelativeCoordinates(touch);

      if (isInMapSelectionStart(x, y)) {
        handleMapStartDrag(x, ({onMove, onEnd}: any) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      } else if (isInMapSelectionEnd(x, y)) {
        handleMapEndDrag(x, ({onMove, onEnd}: any) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      } else if (isInMapSelectionMiddle(x, y)) {
        handleMapMiddleDrag(x, ({onMove, onEnd}: any) => {
          event.preventDefault();
          return watchTouchDrag({startTouch: touch, onMove, onEnd});
        });
      }
    }
  }

  function handleMapStartDrag(x: number, createWatcher: any) {
    if (startMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = getMapBounds();
    const xOffset = x - (mapX + chartState.mapSelectorStart * mapWidth);

    startMapSelectorDrag = createWatcher({
      onMove: (event: any) => {
        const {x} = getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = getMapBounds();
        callbacks.mapSelectorStart((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => startMapSelectorDrag = null
    });
  }

  function handleMapMiddleDrag(x: number, createWatcher: any) {
    if (middleMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = getMapBounds();
    const xOffset = x - (mapX + (chartState.mapSelectorStart + chartState.mapSelectorEnd) / 2 * mapWidth);

    middleMapSelectorDrag = createWatcher({
      onMove: (event: any) => {
        const {x} = getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = getMapBounds();
        callbacks.mapSelectorMiddle((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => middleMapSelectorDrag = null
    });
  }

  function handleMapEndDrag(x: number, createWatcher: any) {
    if (endMapSelectorDrag !== null) {
      return;
    }

    const {x: mapX, width: mapWidth} = getMapBounds();
    const xOffset = x - (mapX + chartState.mapSelectorEnd * mapWidth);

    endMapSelectorDrag = createWatcher({
      onMove: (event: any) => {
        const {x} = getEventRelativeCoordinates(event);
        const {x: mapX, width: mapWidth} = getMapBounds();
        callbacks.mapSelectorEnd((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => endMapSelectorDrag = null
    });
  }

  function isInMapSelectionStart(targetX: number, targetY: number) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorStart - mapGripOutsideOffset, y - mapGripVerticalOffset,
      mapGripInsideOffset + mapGripOutsideOffset, height + mapGripVerticalOffset * 2
    );
  }

  function isInMapSelectionEnd(targetX: number, targetY: number) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorEnd - mapGripInsideOffset, y - mapGripVerticalOffset,
      mapGripInsideOffset + mapGripOutsideOffset, height + mapGripVerticalOffset * 2
    );
  }

  function isInMapSelectionMiddle(targetX: number, targetY: number) {
    const {x, y, width, height} = getMapBounds();

    return isInRectangle(
      targetX, targetY,
      x + width * chartState.mapSelectorStart, y - mapGripVerticalOffset,
      width * (chartState.mapSelectorEnd - chartState.mapSelectorStart), height + mapGripVerticalOffset * 2
    );
  }

  function isInMapLines(targetX: number, targetY: number) {
    const {x, y, width, height} = getMainLinesBounds();

    return isInRectangle(targetX, targetY, x, y, width, height);
  }

  function getEventRelativeCoordinates(event: MouseEvent | Touch) {
    const {clientWidth, clientHeight} = element;
    const bounds = element.getBoundingClientRect();

    return {
      x: (event.clientX - bounds.left) / bounds.width * clientWidth,
      y: (event.clientY - bounds.top) / bounds.height * clientHeight
    };
  }

  function getMapBounds() {
    const {clientWidth, clientHeight} = element;

    return {
      x: chartSidePadding,
      y: clientHeight - chartMapHeight - chartMapBottom,
      width: clientWidth - chartSidePadding * 2,
      height: chartMapHeight
    };
  }

  function getMainLinesBounds() {
    const {clientWidth, clientHeight} = element;
    const y = chartMainTopMargin + chartMainLinesTopMargin;

    return {
      x: chartSidePadding,
      y,
      width: clientWidth - chartSidePadding * 2,
      height: clientHeight - y - chartMainLinesBottomMargin - chartMapHeight
    };
  }
}
