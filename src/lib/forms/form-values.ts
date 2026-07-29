export function parseFormBoolean(value: unknown) {
  return value === true
    || value === "true"
    || value === "on"
    || value === "1";
}
