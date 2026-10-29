// Positions are device-local preferences; never portfolio content.
export function clampPosition(x, y, width, height, iconWidth = 100, iconHeight = 96) {
  return { x: Math.max(0, Math.min(Number.isFinite(x) ? x : 0, Math.max(0, width - iconWidth))), y: Math.max(0, Math.min(Number.isFinite(y) ? y : 0, Math.max(0, height - iconHeight))) };
}
export function defaultPosition(index, width, height) {
  const rows = Math.max(1, Math.floor(height / 106));
  return clampPosition(8 + Math.floor(index / rows) * 112, 6 + (index % rows) * 106, width, height);
}

export function createDesktop(area, mobileQuery) {
  const key = `fg-desktop-layout-v1:${location.pathname}`;
  let positions = {}, drag = null, suppressed = null;
  try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) positions = saved; } catch {}
  const save = () => { try { localStorage.setItem(key, JSON.stringify(positions)); } catch {} };
  const bounds = () => ({ width: area.clientWidth, height: Math.max(0, area.clientHeight - 38) });
  const place = (button, position) => { button.style.left = `${position.x}px`; button.style.top = `${position.y}px`; };
  function remember(button, position) {
    const { width, height } = bounds();
    positions[button.dataset.section] = { x: position.x / Math.max(1, width - button.offsetWidth), y: position.y / Math.max(1, height - button.offsetHeight) };
    save();
  }
  function layout() {
    if (area.hidden || mobileQuery.matches || drag) return;
    const { width, height } = bounds();
    area.querySelectorAll('.desktop-shortcut').forEach((button, index) => {
      const saved = positions[button.dataset.section];
      const position = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
        ? clampPosition(saved.x * (width - button.offsetWidth), saved.y * (height - button.offsetHeight), width, height, button.offsetWidth, button.offsetHeight)
        : defaultPosition(index, width, height);
      place(button, position);
    });
  }
  area.addEventListener('pointerdown', event => {
    const button = event.target.closest('.desktop-shortcut');
    if (!button || mobileQuery.matches || event.button !== 0 || event.isPrimary === false) return;
    drag = { button, id: event.pointerId, x: event.clientX, y: event.clientY, left: button.offsetLeft, top: button.offsetTop, moved: false };
    button.setPointerCapture(event.pointerId);
  });
  area.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    drag.button.classList.add('dragging');
    const { width, height } = bounds();
    place(drag.button, clampPosition(drag.left + dx, drag.top + dy, width, height, drag.button.offsetWidth, drag.button.offsetHeight));
    event.preventDefault();
  });
  function finish(event, cancelled = false) {
    if (!drag || drag.id !== event.pointerId) return;
    const { button, moved, left, top } = drag;
    drag = null;
    button.classList.remove('dragging');
    if (cancelled) place(button, { x: left, y: top });
    else if (moved) { remember(button, { x: button.offsetLeft, y: button.offsetTop }); suppressed = { id: button.dataset.section, until: Date.now() + 600 }; }
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    if (moved) button.focus({ preventScroll: true });
  }
  area.addEventListener('pointerup', event => finish(event));
  area.addEventListener('pointercancel', event => finish(event, true));
  area.addEventListener('lostpointercapture', event => finish(event, true));
  area.addEventListener('click', event => {
    const button = event.target.closest('.desktop-shortcut');
    if (button && suppressed?.id === button.dataset.section && Date.now() < suppressed.until && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); suppressed = null; }
    if (event.target.closest('[data-action="reset-icons"]')) { positions = {}; save(); layout(); }
  }, true);
  area.addEventListener('keydown', event => {
    const button = event.target.closest('.desktop-shortcut');
    const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
    if (!button || !event.altKey || !delta) return;
    event.preventDefault();
    const { width, height } = bounds();
    const next = clampPosition(button.offsetLeft + delta[0], button.offsetTop + delta[1], width, height, button.offsetWidth, button.offsetHeight);
    place(button, next); remember(button, next);
  });
  new ResizeObserver(layout).observe(area);
  return { layout };
}
