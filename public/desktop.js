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

export function createWindow(frame, workspace, mobileQuery) {
  const bar = frame.querySelector('.titlebar');
  const control = frame.querySelector('[data-action="maximize"]');
  let position = { x: 1, y: .35 }, drag = null;
  const bounds = () => ({ width: workspace.clientWidth, height: workspace.clientHeight });
  function place(x, y) {
    const { width, height } = bounds();
    const point = clampPosition(x, y, width, height, frame.offsetWidth, frame.offsetHeight);
    frame.style.left = `${point.x}px`; frame.style.top = `${point.y}px`;
    return point;
  }
  function remember() {
    const { width, height } = bounds();
    position = { x: frame.offsetLeft / Math.max(1, width - frame.offsetWidth), y: frame.offsetTop / Math.max(1, height - frame.offsetHeight) };
  }
  function layout() {
    if (drag) finish(true);
    if (mobileQuery.matches) { frame.style.removeProperty('left'); frame.style.removeProperty('top'); return; }
    if (frame.hidden) return;
    const { width, height } = bounds();
    if (frame.classList.contains('maximized')) place(0, 0);
    else place(position.x * (width - frame.offsetWidth), position.y * (height - frame.offsetHeight));
  }
  function toggleMaximize() {
    if (mobileQuery.matches) return;
    frame.classList.toggle('maximized');
    control.setAttribute('aria-pressed', String(frame.classList.contains('maximized')));
    control.textContent = frame.classList.contains('maximized') ? '❐' : '□';
    layout();
  }
  function finish(cancelled = false) {
    if (!drag) return;
    const old = drag; drag = null;
    if (cancelled) place(old.left, old.top); else remember();
    frame.classList.remove('moving');
    if (bar.hasPointerCapture(old.id)) bar.releasePointerCapture(old.id);
  }
  bar.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || mobileQuery.matches || frame.classList.contains('maximized') || event.button !== 0 || !event.isPrimary) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: frame.offsetLeft, top: frame.offsetTop };
    bar.setPointerCapture(event.pointerId); bar.focus({ preventScroll: true }); event.preventDefault();
  });
  bar.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    frame.classList.add('moving');
    place(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  });
  bar.addEventListener('pointerup', event => { if (drag?.id === event.pointerId) finish(); });
  bar.addEventListener('pointercancel', () => finish(true));
  bar.addEventListener('lostpointercapture', () => finish(true));
  bar.addEventListener('dblclick', event => { if (!event.target.closest('button')) toggleMaximize(); });
  bar.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) { finish(true); event.preventDefault(); }
    const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
    if (event.target !== bar || !event.altKey || !delta || mobileQuery.matches || frame.classList.contains('maximized')) return;
    event.preventDefault(); place(frame.offsetLeft + delta[0], frame.offsetTop + delta[1]); remember();
  });
  new ResizeObserver(layout).observe(workspace);
  return { layout, toggleMaximize };
}
