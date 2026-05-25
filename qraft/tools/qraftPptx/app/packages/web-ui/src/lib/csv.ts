export function parseCsv(csv: string) {
  const [head = "", ...lines] = csv.trim().split(/\r?\n/);
  const headers = head.split(",").map((item) => item.trim());
  return lines.filter(Boolean).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return Object.fromEntries(headers.map((header, idx) => [header, Number.isFinite(Number(values[idx])) && values[idx] !== "" ? Number(values[idx]) : values[idx] ?? ""]));
  });
}
