// An SVG path through the points as a smooth curve that never overshoots one (a monotone cubic spline): a dip stays a dip
// and a flat stretch stays flat, which a plain smoothing curve would not guarantee. Points must run left to right.
export function smoothPath(points: [number, number][]): string {
  const n = points.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  tangent[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const sum = a * a + b * b;
    if (sum > 9) {
      const k = 3 / Math.sqrt(sum);
      tangent[i] = k * a * slope[i];
      tangent[i + 1] = k * b * slope[i];
    }
  }
  const f = (v: number) => v.toFixed(1);
  let path = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    path += ` C${f(x0 + h)} ${f(y0 + tangent[i] * h)} ${f(x1 - h)} ${f(y1 - tangent[i + 1] * h)} ${f(x1)} ${f(y1)}`;
  }
  return path;
}
