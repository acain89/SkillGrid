// src/core/roundCountdown.js

export function runRoundCountdown(roundNumber, setCountdown, onFinish) {
  const sequence = ["5", "4", "3", "2", "1", "GO!"];
  let index = 0;

  function nextStep() {
    if (index < sequence.length) {
      setCountdown(sequence[index]);
      index++;
      setTimeout(nextStep, index === sequence.length ? 300 : 800);
    } else {
      setCountdown(null);
      if (onFinish) onFinish();
    }
  }

  setCountdown(`ROUND ${roundNumber}`);
  setTimeout(() => nextStep(), 900);
}
