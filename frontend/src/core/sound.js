// src/core/sound.js

const soundCache = {};

export function playSound(src, volume = 1.0) {
  if (!soundCache[src]) {
    const audio = new Audio(src);
    audio.volume = volume;
    soundCache[src] = audio;
  }

  const sound = soundCache[src].cloneNode(); // prevent cutting off
  sound.volume = volume;
  sound.play().catch(() => {});
}
