export class InputManager {
  constructor(canvas) {
    this.state = { left: false, right: false, up: false, down: false, action: false };
    this.canvas = canvas;
    this.activeTouches = new Map();
    this._actionJustPressed = false;
    this._upJustPressed = false;
    this._downJustPressed = false;
    this._lastActionPos = null;

    // Keyboard
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Touch
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });

    // Mouse (for desktop testing)
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  onKeyDown(e) {
    if (e.repeat) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') this.state.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') this.state.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w') { this.state.up = true; this._upJustPressed = true; }
    if (e.key === 'ArrowDown' || e.key === 's') { this.state.down = true; this._downJustPressed = true; }
    if (e.key === 'Enter' || e.key === ' ') {
      this.state.action = true;
      this._actionJustPressed = true;
    }
    e.preventDefault();
  }

  onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.state.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') this.state.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w') this.state.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') this.state.down = false;
    if (e.key === 'Enter' || e.key === ' ') this.state.action = false;
  }

  onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      this.activeTouches.set(touch.identifier, touch);
      this._lastActionPos = { x: touch.clientX, y: touch.clientY };
    }
    this.updateTouchState();
    this._actionJustPressed = true;
  }

  onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      this.activeTouches.delete(touch.identifier);
    }
    this.updateTouchState();
  }

  onMouseDown(e) {
    const midX = window.innerWidth / 2;
    if (e.clientX < midX) {
      this.state.left = true;
    } else {
      this.state.right = true;
    }
    this.state.action = true;
    this._actionJustPressed = true;
    this._lastActionPos = { x: e.clientX, y: e.clientY };
  }

  onMouseUp(e) {
    this.state.left = false;
    this.state.right = false;
    this.state.action = false;
  }

  updateTouchState() {
    this.state.left = false;
    this.state.right = false;
    this.state.action = false;
    const midX = window.innerWidth / 2;
    for (const [, touch] of this.activeTouches) {
      if (touch.clientX < midX) this.state.left = true;
      else this.state.right = true;
    }
    if (this.activeTouches.size > 0) {
      this.state.action = true;
    }
  }

  // Returns true once per press, then resets
  consumeAction() {
    if (this._actionJustPressed) {
      this._actionJustPressed = false;
      return true;
    }
    return false;
  }

  consumeUp() {
    if (this._upJustPressed) {
      this._upJustPressed = false;
      return true;
    }
    return false;
  }

  consumeDown() {
    if (this._downJustPressed) {
      this._downJustPressed = false;
      return true;
    }
    return false;
  }

  // Get and consume the last action position (for touch/click targeting)
  getLastActionPos() {
    const pos = this._lastActionPos;
    this._lastActionPos = null;
    return pos;
  }
}
