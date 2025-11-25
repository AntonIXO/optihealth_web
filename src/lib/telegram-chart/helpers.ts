import { dateNotchScaleBase, chartScaleLabelFontSize, fontFamily } from './constants';

// --- NUMBER HELPERS ---

/**
 * Ratio values: 0 - number1, 1 - number2
 */
export function mixNumbers(number1: number, number2: number, ratio: number) {
  return number1 * (1 - ratio) + number2 * ratio;
}

export function roundWithBase(number: number, base: number) {
  return Math.round(number / base) * base;
}

export function floorWithBase(number: number, base: number) {
  return Math.floor(number / base) * base;
}

export function ceilWithBase(number: number, base: number) {
  return Math.ceil(number / base) * base;
}

const shortNumberSuffixes = ['K', 'M', 'B'];

export function formatNumberToShortForm(number: number) {
  const suffixPower = getNumberSuffixPower(number);

  return suffixPower === 0
    ? String(number)
    : number / (1000 ** suffixPower) + shortNumberSuffixes[suffixPower - 1];
}

function getNumberSuffixPower(number: number) {
  if (number === 0) {
    return 0;
  }

  for (let power = 1; power <= shortNumberSuffixes.length; ++power) {
    const base = 1000 ** power;

    if (number % base !== 0) {
      return power - 1;
    }
  }

  return shortNumberSuffixes.length;
}

export function formatNumberWithThousandGroups(number: number | string, divider = ' ') {
  const [integer, fractional] = String(number).split('.');
  const digitsCount = integer.length;
  let groupedInteger = '';

  for (let i = 0; i < digitsCount; i += 3) {
    groupedInteger = integer.slice(Math.max(0, digitsCount - i - 3), digitsCount - i)
      + (groupedInteger ? divider + groupedInteger : '');
  }

  return groupedInteger + (fractional ? '.' + fractional : '');
}

export function inRange(min: number, value: number, max: number) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

// https://stackoverflow.com/q/4467539/1118709
export function modulo(dividend: number, divider: number) {
  return ((dividend % divider) + divider) % divider;
}

// --- COLOR HELPERS ---

export function hexColorToNumber(color: string) {
  return parseInt(color.slice(1), 16);
}

export function numberColorToRGBA(color: number, opacity?: number) {
  return 'rgba('
    + (color >> 16) % 0x100 + ', '
    + (color >> 8) % 0x100 + ', '
    + color % 0x100 + ', '
    + (opacity === undefined ? 1 : opacity)
    + ')';
}

/**
 * Ratio values: 0 - color1, 1 - color2
 */
export function mixNumberColors(color1: number, color2: number, ratio: number) {
  if (ratio === 0) {
    return color1;
  }
  if (ratio === 1) {
    return color2;
  }

  const r1 = (color1 >> 16) % 0x100;
  const g1 = (color1 >> 8) % 0x100;
  const b1 = color1 % 0x100;

  const r2 = (color2 >> 16) % 0x100;
  const g2 = (color2 >> 8) % 0x100;
  const b2 = color2 % 0x100;

  return Math.round(mixNumbers(r1, r2, ratio)) << 16 | Math.round(mixNumbers(g1, g2, ratio)) << 8 | Math.round(mixNumbers(b1, b2, ratio));
}

export function mixNumberColorsAndOpacitiesToRGBA(color1: number, opacity1: number, color2: number, opacity2: number, ratio: number, globalOpacity = 1) {
  return numberColorToRGBA(
    mixNumberColors(color1, color2, ratio),
    mixNumbers(opacity1, opacity2, ratio) * globalOpacity
  );
}


// --- DATA HELPERS ---

/**
 * Gets the minimum and the maximum value of chart line on the given range
 */
export function getMinAndMaxOnRange(values: number[], from: number, to: number) {
  from = Math.max(0, from);
  to = Math.min(to, values.length - 1);
  let min: number, max: number;

  // Check the left edge
  const startVal = interpolateLinear(values, from);
  if (startVal !== undefined) {
      min = max = startVal;
  } else {
      min = Infinity; max = -Infinity; // Fallback
  }

  // Check the interim values
  for (let i = Math.ceil(from), e = Math.floor(to); i <= e; ++i) {
    if (values[i] < min) {
      min = values[i];
    } else if (values[i] > max) {
      max = values[i];
    }
  }

  // Check the right edge
  const value = interpolateLinear(values, to);
  if (value !== undefined) {
    if (value < min) {
      min = value;
    } else if (value > max) {
      max = value;
    }
  }

  return {min, max};
}

/**
 * Returns an interpolated value of the function
 */
export function interpolateLinear(values: number[], x: number) {
  if (x < 0 || x > values.length - 1) {
    return undefined;
  }

  const x1 = Math.floor(x);
  const x2 = Math.ceil(x);

  return values[x1] + (values[x2] - values[x1]) * (x - x1)
}

export function getMaxSumOnRange(dataVectors: number[][], from: number, to: number) {
  let max = 0;

  if (dataVectors.length > 0) {
    from = Math.max(0, Math.ceil(from));
    to = Math.min(Math.floor(to), dataVectors[0].length - 1);

    for (let i = from; i <= to; ++i) {
      let sum = 0;
      for (let j = 0; j < dataVectors.length; ++j) {
        sum += dataVectors[j][i];
      }
      if (sum > max) {
        max = sum;
      }
    }
  }

  return max;
}

export function linesObjectToVectorArray(linesData: any, linesState: any) {
  const dataVectors = [];

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key) && linesState[key].enabled) {
      dataVectors.push(linesData[key].values);
    }
  }

  return dataVectors;
}

export function getLinesMinAndMaxValues(lines: any) {
  const result: any = {};

  for (const [key, {values}] of Object.entries(lines) as any) {
    result[key] = {
      min: Math.min(...(values as number[])),
      max: Math.max(...(values as number[]))
    };
  }

  return result;
}

export function getMinAndMaxFromLinesCache(linesMinAndMax: any, linesState: any) {
  let totalMin = Infinity;
  let totalMax = -Infinity;

  for (const [key, {min, max}] of Object.entries(linesMinAndMax) as any) {
    if (linesState[key].enabled) {
      if (min < totalMin) {
        totalMin = min;
      }
      if (max > totalMax) {
        totalMax = max;
      }
    }
  }

  return {min: totalMin, max: totalMax};
}

export function getLinesMinAndMaxOnRange(linesData: any, linesState: any, startIndex: number, endIndex: number) {
  let totalMin = Infinity;
  let totalMax = -Infinity;

  for (const key in linesData) {
    if (linesData.hasOwnProperty(key)) {
      if (linesState[key].enabled) {
        const {min, max} = getMinAndMaxOnRange(linesData[key].values, startIndex, endIndex);
        if (min < totalMin) {
          totalMin = min;
        }
        if (max > totalMax) {
          totalMax = max;
        }
      }
    }
  }

  return {min: totalMin, max: totalMax};
}

// --- DATE HELPERS ---

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const timestampInDay = 86400000;

export function formatDateForDateScale(timestamp: number) {
  const date = new Date(timestamp);
  return months[date.getMonth()].slice(0, 3) + ' ' + date.getDate();
}

export function getDayInMonth(timestamp: number) {
  return new Date(timestamp).getDate();
}

export function getDayInWeekAndMonth(timestamp: number) {
  const date = new Date(timestamp);
  return weekDays[date.getDay()].slice(0, 3)
    + ', ' + date.getDate();
}

export function getDateComponentsForRange(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  return {
    year,
    month: year * 12 + monthIndex,
    day: Math.floor(timestamp / timestampInDay)
  };
}

// --- SCALE HELPERS ---

const dateNotchScaleBaseLog = Math.log(dateNotchScaleBase);

export function getDateNotchScale(datesCount: number, maxNotchesCount = 6) {
  if (datesCount <= 0) {
    return 1e9;
  }

  return Math.max(0, Math.ceil(Math.log(datesCount / maxNotchesCount) / dateNotchScaleBaseLog));
}

const log10Of2 = Math.log10(2);
const log10Of5 = Math.log10(5);

export function getSubDecimalScale(value: number, doRoundUp?: boolean) {
  const log10 = Math.log10(value);
  const log10Base = Math.floor(log10);
  const log10Remainder = modulo(log10, 1);

  if (log10 === -Infinity) {
    return -Infinity;
  }

  if (log10Remainder === 0 || !doRoundUp && log10Remainder < log10Of2) {
    return log10Base * 3;
  }
  if (log10Remainder <= log10Of2 || !doRoundUp && log10Remainder < log10Of5) {
    return log10Base * 3 + 1;
  }
  if (log10Remainder <= log10Of5 || !doRoundUp) {
    return log10Base * 3 + 2;
  }
  return log10Base * 3 + 3;
}

export function subDecimalScaleToNumber(scale: number) {
  const base = 10 ** Math.floor(scale / 3);
  const remainder = modulo(scale, 3);

  if (remainder < 1) {
    return base;
  }
  if (remainder < 2) {
    return base * 2;
  }
  return base * 5;
}

export function getValueRangeForFixedNotches(minValue: number, maxValue: number, notchCount = 5) {
  function getValueRange(notchScale: number) {
    const notchValue = subDecimalScaleToNumber(notchScale);
    const alignedMinValue = floorWithBase(minValue, notchValue);
    const alignedMaxValue = alignedMinValue + notchValue * notchCount;
    return [alignedMinValue, alignedMaxValue];
  }

  let notchScale = getSubDecimalScale(Math.max(1e-9, Math.abs((maxValue - minValue) / notchCount)), true);
  let [min, max] = getValueRange(notchScale);

  if (max < maxValue) {
    [min, max] = getValueRange(++notchScale);
  }

  return {min, max, notchScale};
}

export function getValueRangeForFixedBottom(minValue: number, maxValue: number, maxNotchCount = 5) {
  const {min, notchScale} = getValueRangeForFixedNotches(minValue, maxValue, maxNotchCount);
  return {min, max: maxValue, notchScale};
}

// --- CANVAS HELPERS ---

export function roundedRectanglePath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, borderRadius: number | number[]) {
  let topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius;

  if (Array.isArray(borderRadius)) {
    [topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius] = borderRadius;
  } else {
    topLeftRadius = topRightRadius = bottomRightRadius = bottomLeftRadius = borderRadius;
  }

  ctx.moveTo(x, y + height - bottomLeftRadius);
  ctx.arcTo(x, y, x + topLeftRadius, y, topLeftRadius);
  ctx.arcTo(x + width, y, x + width, y + topRightRadius, topRightRadius);
  ctx.arcTo(x + width, y + height, x + width - bottomRightRadius, y + height, bottomRightRadius);
  ctx.arcTo(x, y + height, x, y + height - bottomLeftRadius, bottomLeftRadius);
}

// --- GEOMETRY HELPERS ---

export function isInRectangle(targetX: number, targetY: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number) {
  return targetX >= rectX && targetX < rectX + rectWidth
    && targetY >= rectY && targetY < rectY + rectHeight;
}

// --- GESTURE HELPERS ---

/**
 * Triggers the move callback until the mouse drag is finished. Create in a mousedown event handler.
 */
export function watchMouseDrag({onMove, onEnd}: any) {
  const handleMove = (event: any) => {
    onMove(event);
  };

  const handleEnd = (event: any) => {
    destroy();
    onEnd(event);
  };

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('mouseleave', handleEnd);

  const destroy = () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('mouseleave', handleEnd);
  };

  return {destroy};
}

/**
 * Triggers the move callback until the touch move is finished. Create in a touchstart event handler.
 */
export function watchTouchDrag({startTouch, eventTarget = window, onMove, onEnd}: any) {
  const getTouch = (event: any) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === startTouch.identifier) {
        return touch;
      }
    }

    return null;
  };

  const handleMove = (event: any) => {
    const touch = getTouch(event);
    if (touch) {
      onMove(touch);
    }
  };

  const handleEnd = (event: any) => {
    const touch = getTouch(event);
    if (touch) {
      destroy();
      onEnd(touch);
    }
  };

  eventTarget.addEventListener('touchmove', handleMove);
  eventTarget.addEventListener('touchend', handleEnd);
  eventTarget.addEventListener('touchcancel', handleEnd);

  const destroy = () => {
    eventTarget.removeEventListener('touchmove', handleMove);
    eventTarget.removeEventListener('touchend', handleEnd);
    eventTarget.removeEventListener('touchcancel', handleEnd);
  };

  return {destroy};
}

export function watchHover({element, onMove, onEnd, checkHover = (event: any) => true}: any) {
  let hoverId: string | null = null;

  const handleMove = (event: any) => {
    eachSubEvent(event, (id: string, subEvent: any) => {
      if ((hoverId === null || id === hoverId)) {
        if (checkHover(subEvent)) {
          hoverId = id;
          onMove(subEvent);
        } else if (hoverId !== null) {
          hoverId = null;
          onEnd(subEvent);
        }
      }
    });
  };

  const handleEnd = (event: any) => {
    eachSubEvent(event, (id: string, subEvent: any) => {
      if (hoverId === id) {
        event.preventDefault(); // To prevent the frozen hover on touch devices
        hoverId = null;
        onEnd(subEvent);
      }
    });
  };

  const moveEvents = ['mouseenter', 'mousemove', 'touchstart', 'touchmove'];
  const endEvents = ['mouseleave', 'touchend', 'touchcancel'];

  for (const name of moveEvents) {
    element.addEventListener(name, handleMove);
  }
  for (const name of endEvents) {
    element.addEventListener(name, handleEnd);
  }

  return {
    destroy() {
      for (const name of moveEvents) {
        element.removeEventListener(name, handleMove);
      }
      for (const name of endEvents) {
        element.removeEventListener(name, handleEnd);
      }
    }
  };
}

function eachSubEvent(event: any, callback: any) {
  if (event.type.startsWith('mouse')) {
    callback('mouse', event);
  } else if (event.type.startsWith('touch')) {
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
      callback(`touch${touch.identifier}`, touch);
    }
  }
}

// --- MEMOIZE ---

// Simple memoize implementation to avoid extra dependencies
export function memoizeObjectArguments<T extends (...args: any[]) => any>(fn: T): T {
    let lastArgs: any[] | null = null;
    let lastResult: any = null;

    return function(...args: any[]) {
        if (lastArgs && args.length === lastArgs.length && args.every((arg, i) => shallowEqual(arg, lastArgs![i]))) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = fn(...args);
        return lastResult;
    } as T;
}

function shallowEqual(objA: any, objB: any) {
    if (objA === objB) return true;
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) return false;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) return false;
    }
    return true;
}
