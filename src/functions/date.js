export function lessThanTenMin(timestamp) {
  const tenMinInMs = 3 * 60 * 1000;

  const now = Date.now();

  const isLessThanOneDayOld = now - timestamp < tenMinInMs;
  console.log(
    isLessThanOneDayOld ? "Less than 1 day old" : "More than 1 day old"
  );
  return isLessThanOneDayOld;
}
