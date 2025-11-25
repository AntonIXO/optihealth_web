import { TYPE_LINE, TYPE_LINE_TWO_Y, TYPE_BAR, TYPE_AREA } from './constants';
import { interpolateLinear } from './helpers';

interface InputDataPoint {
  bucket: string; // ISO timestamp
  value: number;
}

interface TelegramChartData {
  name: string;
  type: string;
  dates: number[];
  lines: Record<string, {
    name: string;
    color: number;
    values: number[];
  }>;
}

export function transformDataForTelegramChart(
  data1: InputDataPoint[],
  name1: string,
  data2: InputDataPoint[] | null,
  name2: string | null,
  type: 'line' | 'bar' | 'area' | 'scatter' = 'line',
  normalize: boolean = false
): TelegramChartData {
  // Scatter is not natively supported by the ported engine (which focuses on time series lines/bars).
  // If type is scatter, we might need to fallback or approximate.
  // Given the context, we'll treat scatter as lines for now or let the user know.

  const mapType = (t: string) => {
    if (t === 'bar') return TYPE_BAR;
    if (t === 'area') return TYPE_AREA;
    return TYPE_LINE;
  };

  let outputType = mapType(type);
  if (data2 && outputType === TYPE_LINE && !normalize) {
      // If comparing two lines and NOT normalized, use two Y axes for better scaling
      outputType = TYPE_LINE_TWO_Y;
  }

  // Collect all unique timestamps
  const timestamps = new Set<number>();
  data1.forEach(d => timestamps.add(new Date(d.bucket).getTime()));
  if (data2) {
    data2.forEach(d => timestamps.add(new Date(d.bucket).getTime()));
  }

  const sortedDates = Array.from(timestamps).sort((a, b) => a - b);

  // Helper to interpolate
  const getValuesForDates = (data: InputDataPoint[]) => {
    // Create a map for quick lookup
    const map = new Map<number, number>();
    data.forEach(d => map.set(new Date(d.bucket).getTime(), d.value));

    const values: number[] = [];

    // We need to fill values for ALL sortedDates.
    // If exact match exists, use it.
    // If not, interpolate between neighbors.

    // Sort input data by time first to help finding neighbors
    const sortedInput = [...data].sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime());

    for (let i = 0; i < sortedDates.length; i++) {
      const target = sortedDates[i];
      if (map.has(target)) {
        values.push(map.get(target)!);
      } else {
        // Find nearest neighbors
        // Since sortedInput is sorted, we can search.
        // Optimization: could track index.

        // Find previous point
        let prev: InputDataPoint | null = null;
        let next: InputDataPoint | null = null;

        for (let j = 0; j < sortedInput.length; j++) {
          const t = new Date(sortedInput[j].bucket).getTime();
          if (t < target) {
            prev = sortedInput[j];
          } else if (t > target) {
            next = sortedInput[j];
            break;
          }
        }

        if (prev && next) {
           const t1 = new Date(prev.bucket).getTime();
           const v1 = prev.value;
           const t2 = new Date(next.bucket).getTime();
           const v2 = next.value;

           const factor = (target - t1) / (t2 - t1);
           values.push(v1 + (v2 - v1) * factor);
        } else if (prev) {
          values.push(prev.value); // Extrapolate/Hold last value
        } else if (next) {
          values.push(next.value); // Hold first value
        } else {
          values.push(0); // Should not happen if data is not empty
        }
      }
    }
    return values;
  };

  const values1 = getValuesForDates(data1);
  const lines: any = {
    y0: {
      name: name1,
      color: 0x36A2EB, // Blue-ish
      values: values1
    }
  };

  if (data2 && name2) {
    const values2 = getValuesForDates(data2);
    lines.y1 = {
      name: name2,
      color: 0xFF6384, // Red-ish
      values: values2
    };
  }

  // Normalization Logic (0-100) if requested
  if (normalize) {
    const normalizeArray = (arr: number[]) => {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const range = max - min;
        if (range === 0) return arr.map(() => 50);
        return arr.map(v => ((v - min) / range) * 100);
    };

    if (lines.y0) lines.y0.values = normalizeArray(lines.y0.values);
    if (lines.y1) lines.y1.values = normalizeArray(lines.y1.values);
  }

  return {
    name: 'Chart', // Not visible in new design usually
    type: outputType,
    dates: sortedDates,
    lines
  };
}
