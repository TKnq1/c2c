// The values of a chart as a table that only screen readers see. The wrapper does the hiding: a table that carries sr-only
// itself keeps its full height (a table ignores a 1px height and overflow: hidden), and because it is positioned out of the
// flow it then lengthens the page with empty room to scroll.
export function ChartTable({ caption, head, rows }: { caption?: string; head?: [string, string]; rows: [string, string][] }) {
  return (
    <div className="sr-only">
      <table>
        {caption && <caption>{caption}</caption>}
        {head && (
          <thead>
            <tr>
              <th scope="col">{head[0]}</th>
              <th scope="col">{head[1]}</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map(([name, value], i) => (
            <tr key={`${i}-${name}`}>
              <td>{name}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
