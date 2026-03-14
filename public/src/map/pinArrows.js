import { onModeChange, getActivePin, Mode } from "../appState.js";
import { cycleType, updatePinVisual, updatePinLabel } from "./pins.js";

export function initPinArrows() {
  const upBtn   = document.getElementById("arrow-up");
  const downBtn = document.getElementById("arrow-down");

  function handleClick(direction) {
    const pin = getActivePin();
    if (!pin) return;
    cycleType(pin, direction === "up" ? -1 : +1);
    updatePinVisual(pin);
    updatePinLabel(pin);
    document.dispatchEvent(new CustomEvent("pin-type-changed", { detail: pin }));
  }

  upBtn.addEventListener("click",   () => handleClick("up"));
  downBtn.addEventListener("click", () => handleClick("down"));

  onModeChange(mode => {
    const visible = mode === Mode.EDITING;
    upBtn.style.display   = visible ? "block" : "none";
    downBtn.style.display = visible ? "block" : "none";
  });
}