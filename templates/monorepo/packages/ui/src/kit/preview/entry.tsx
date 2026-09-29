// Kit preview entry. /landing?d=D9 renders the sample landing in one
// direction; the compare board (compare.html) frames three of them.
import { createRoot } from "@kit-preview/react-dom-client";
import { DIRECTIONS, type DirectionId } from "../Page";
import { Landing } from "./Landing";

const param = new URLSearchParams(location.search).get("d") ?? "D1";
const direction = (param in DIRECTIONS ? param : "D1") as DirectionId;
document.documentElement.dataset.direction = direction;
document.title = `Kit preview, ${direction} ${DIRECTIONS[direction]}`;

const mount = document.getElementById("root");
if (mount) {
  createRoot(mount).render(<Landing direction={direction} />);
  // The page renders after the browser tried the hash, so land on it once mounted.
  if (location.hash) {
    const target = location.hash.slice(1);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView()));
  }
}
