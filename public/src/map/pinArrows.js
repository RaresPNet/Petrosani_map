import { onModeChange, getActivePin, Mode } from "../appState.js";
import { cycleType, updatePinVisual, updatePinLabel } from "./pins.js";

export function initPinArrows() {
  const prevBtn = document.getElementById("arrow-prev");
  const nextBtn = document.getElementById("arrow-next");

  function handleClick(delta) {
    const pin = getActivePin();
    if (!pin) return;
    cycleType(pin, delta);
    updatePinVisual(pin);
    updatePinLabel(pin);
    document.dispatchEvent(new CustomEvent("pin-type-changed", { detail: pin }));
  }

  function pulse(btn) {
    btn.classList.remove("pin-type-arrow--pulsing");
    void btn.offsetWidth; // reflow to restart animation
    btn.classList.add("pin-type-arrow--pulsing");
    btn.addEventListener("animationend", () => btn.classList.remove("pin-type-arrow--pulsing"), { once: true });
  }

  prevBtn.addEventListener("click", () => { handleClick(-1); pulse(prevBtn); });
  nextBtn.addEventListener("click", () => { handleClick(+1); pulse(nextBtn); });

  onModeChange(mode => {
    const visible = mode === Mode.EDITING;
    prevBtn.style.display = visible ? "block" : "none";
    nextBtn.style.display = visible ? "block" : "none";
  });
}