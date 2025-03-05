export function hasTwentySecondsPassed(date1, date2) {
  return Math.abs(date2 - date1) >= 20000;
}
