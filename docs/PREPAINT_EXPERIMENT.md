# M0 Pre-paint Experiment

M0 compares three explicitly selectable strategies in the debug panel:

- **A — NO_GUARD**: observe without visual suppression.
- **B — SCOPED_GUARD**: temporarily hide only structural candidate nodes until a detector decision is ready.
- **C — TEMPORARY_PLACEHOLDER**: temporarily replace only structural candidate nodes with a neutral placeholder until a detector decision is ready.

No strategy hides the full Facebook document or feed globally.

## Measurements

For each candidate the probe can record numeric durations only:

1. DOM insertion → candidate detection,
2. DOM insertion → decision ready,
3. decision ready → next `requestAnimationFrame` callback.

The final value is a **next-frame proxy**, not proof of the exact compositor paint time for that element. Human-visible flash and browser behavior must therefore be validated on a real logged-in Facebook session before `FLASH-01` can pass.

## Product gate handling

`FLASH-01` remains a proposed product gate: ≥95% of elements interceptable before full paint or no more than one frame of exposure. M0 must report measured values separately from this proposed gate and must not silently redefine the gate after seeing results.
