/**
 * 小数第 2 位への丸め。旧 FastAPI 版の Python round(x, 2) と同じ結果にする。
 * Python は二進の実値を基準に、ちょうど中間（例: 53.625）のときは偶数側へ丸める（銀行丸め）。
 * JavaScript の toFixed は中間を切り上げるため、ここで実値の小数展開から判定し直す。
 */

/** 二進の実値を小数第 60 桁まで展開して判定に使う（通常の金額の大きさでは実値をそのまま表せる桁数）。 */
const EXACT_DIGITS = 60;

export function roundTo2(value: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const sign = value < 0 ? "-" : "";
  const expansion = Math.abs(value).toFixed(EXACT_DIGITS);
  const [integerPart = "0", fractionPart = ""] = expansion.split(".");
  const kept = fractionPart.slice(0, 2).padEnd(2, "0");
  const dropped = fractionPart.slice(2);

  const keptUnits = BigInt(integerPart + kept);
  const roundUp = shouldRoundUp(dropped, Number(kept[1]));
  const units = (roundUp ? keptUnits + 1n : keptUnits).toString().padStart(3, "0");
  const rounded = `${units.slice(0, -2)}.${units.slice(-2)}`;
  return Number(sign + rounded);
}

/** 落とす桁（小数第 3 位以下）から切り上げかどうかを決める。中間のときは直前の桁が奇数なら切り上げる。 */
function shouldRoundUp(dropped: string, lastKeptDigit: number): boolean {
  const first = dropped.charAt(0);
  if (first === "" || first < "5") {
    return false;
  }
  if (first > "5") {
    return true;
  }
  const hasMore = /[1-9]/.test(dropped.slice(1));
  if (hasMore) {
    return true;
  }
  return lastKeptDigit % 2 === 1;
}
