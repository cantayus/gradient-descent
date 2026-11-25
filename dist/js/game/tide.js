// Tide and surf: water whose level rises and falls with time. Called once per physics step by the game and by the tests, so both see the same sea.
// A long period and a large rise is a tide; a few seconds and a small rise is surf running up a beach.
export function tides(T, t) { for (const w of T.waters) if (w.tide) w.y = w.y0 + w.tide.amp * Math.sin((t / w.tide.per) * 2 * Math.PI + (w.tide.ph || 0)); }
