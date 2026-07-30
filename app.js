/* Whiteboard v3 */

// --- TOUCH & PEN SUPPORT INITIALIZATION ---
// Prevent default touch behaviors for better drawing experience
document.addEventListener('touchmove', (e) => {
  // Allow touch events within the board
  if (e.target.closest('#board')) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchstart', (e) => {
  // Allow touch events within the board
  if (e.target.closest('#board')) {
    // Don't prevent default, let pointer events handle it
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  // Allow touch events within the board
  if (e.target.closest('#board')) {
    // Don't prevent default, let pointer events handle it
  }
}, { passive: false });

// Detect input type (touch, pen, mouse)
function getInputType(e) {
  if (e.pointerType === 'pen') return 'pen';
  if (e.pointerType === 'touch') return 'touch';
  if (e.pointerType === 'mouse') return 'mouse';
  return 'unknown';
}

// Get pressure value from pointer event (useful for pen input)
function getPressure(e) {
  return e.pressure !== undefined ? e.pressure : (e.pointerType === 'pen' ? 0.5 : 0);
}

// Utility: Check if device is mobile/tablet
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detect if device supports pressure-sensitive input (pen)
function supportsPressure() {
  return window.PointerEvent && 'pressure' in PointerEvent.prototype;
}

// Mobile-friendly UI adjustments on load
window.addEventListener('load', () => {
  // Prevent double-tap zoom on touch devices
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent iOS bounce scroll
  if (isMobileDevice()) {
    document.body.style.overscrollBehavior = 'none';
    const boardWrap = el('.board-wrap');
    if (boardWrap) {
      boardWrap.style.overscrollBehavior = 'none';
    }
  }
});

// --- Utility functions ---
const el = (q, ctx=document)=>ctx.querySelector(q);
const id = (prefix='id')=> prefix + '-' + Math.random().toString(36).slice(2,9);

// --- NEW: Color helper functions ---
function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  // 3 digits
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
}

// Converts r,g,b values to a hex string like #rrggbb
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toLowerCase();
}

// Parses an rgba() or rgb() string and returns an object with r, g, b, a components. If input is 'transparent', returns white with 0 alpha.
function parseRgba(rgbaString) {
  if (!rgbaString || rgbaString === 'transparent') {
    return { r: 255, g: 255, b: 255, a: 0 };
  }
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 }; // Default to black if parse fails
}


/// --- NEW: Update custom cursor position and appearance based on current tool and stroke settings
let lastMouseEvent = null;

// Helper to extract screen-space coordinates from pointer/touch event
function getEventScreenCoords(e) {
  if (!e) return { x: 0, y: 0 };
  let clientX = e.clientX;
  let clientY = e.clientY;
  if (clientX === undefined && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  }
  return { x: clientX || 0, y: clientY || 0 };
}

// Helper to calculate exact custom cursor position in screen-space, considering snapping
function getCustomCursorScreenCoords() {
  if (!lastMouseEvent) return null;
  const coords = getEventScreenCoords(lastMouseEvent);
  
  if (drawing && currentPath && straightLineState && (lastMouseEvent.ctrlKey || lastMouseEvent.metaKey)) {
    const anchorX = straightLineState.lastX ?? straightLineState.startX;
    const anchorY = straightLineState.lastY ?? straightLineState.startY;
    const pt = getBoardPointFromEvent(lastMouseEvent);
    const snapped = snapToAngle(anchorX, anchorY, pt.x, pt.y, 15);
    const boardRect = board.getBoundingClientRect();
    return {
      x: snapped.x * state.scale + boardRect.left,
      y: snapped.y * state.scale + boardRect.top
    };
  }
  
  return coords;
}

window.addEventListener('pointermove', e => {
  lastMouseEvent = e;

  if (state.tool === 'draw' && !isPanning) {
    const isOverBoard = e.target && (e.target === board || board.contains(e.target));
    const customCursor = document.getElementById('custom-cursor');
    const guides = document.getElementById('drawing-guides');

    if (isOverBoard || drawing) {
      board.style.cursor = 'none';
      updateCustomCursorPosition();
      if (customCursor && customCursor.style.display === 'none') {
        customCursor.style.display = 'block';
      }
    } else {
      if (customCursor && customCursor.style.display !== 'none') {
        customCursor.style.display = 'none';
      }
      if (guides && guides.style.display !== 'none') {
        guides.style.display = 'none';
      }
    }
  }

  const screenCoords = getCustomCursorScreenCoords();
  const guides = document.getElementById('drawing-guides');
  if (guideH && guideV && guides && guides.style.display !== 'none' && screenCoords) {
    guideH.setAttribute('y1', screenCoords.y);
    guideH.setAttribute('y2', screenCoords.y);
    guideV.setAttribute('x1', screenCoords.x);
    guideV.setAttribute('x2', screenCoords.x);
  }
});

// --- MODIFIED: Unified z-index system ---
const Z_FLOOR = 1;

let state = {
  tool: 'select',
  selectionMode: 'rectangular', // 'rectangular' or 'lasso'
  selectedIds: new Set(),
  pointer: {x:0,y:0},
  scale: 1,
  nextZ: 10,  // Unified z-index for all items
  stroke: {
    color: '#111111',
    width: 2,
    startArrow: false,
    endArrow: false,
    arrowSize: 10,
    rounded: false,
    circleTransform: false
  },
  text: {
    bold: false,
    italic: false,
    underline: false,
    crossed: false,
    fontSize: 16,
    color: '#111111',
    bgColor: '#ffffff',
    bgAlpha: 0.0,
    align: 'center',
    fontFamily: 'inherit'
  }
};

// --- NEW: Stroke drawing state ---
let currentStrokeGroup = null; // This is the <g> element
let currentSvgWrapper = null; // --- NEW: This is the <svg> wrapper ---
let isLassoing = false;
let lassoPoints = [];
let lassoPath = null;
let isSelectingRect = false; // For rectangular selection
let rectSelectStartX = 0;
let rectSelectStartY = 0;
let rectSelectPath = null; // SVG path for displaying the rectangle
let straightLineState = null; // For polyline drawing

// --- Undo/Redo system ---
const HISTORY_LIMIT = 50;
let undoStack = [];
let redoStack = [];
let isRestoringHistory = false; // Guard to avoid recording history while restoring
// Slider history guard: record snapshot at slider start and final at end
let sliderChanging = false;
let isDeleting = false;
let ignoreNextBlurHistory = false;

window.addEventListener('resize', () => {
    updateCachedBoardRect();
    // We don't want to check for overflow while resizing is in progress
    if(document.body.classList.contains('dragging')) return;
    checkToolbarOverflow();
});

// Call this at the start of a slider change to record the initial state, and set a guard to avoid recording intermediate states until finalized
function startSliderHistory(){
  if(sliderChanging) return;
  if(isRestoringHistory) return;
  sliderChanging = true;
  // push initial snapshot so undo will return to this state
  const snap = createSnapshot();
  undoStack.push(snap);
  if(undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

// Call this at the end of slider change, or if slider change is cancelled (e.g. by pressing Esc), to finalize the history state
function endSliderHistory(){
  if(!sliderChanging){
    // if not started via startSliderHistory, just push final state
    pushHistory();
    return;
  }
  sliderChanging = false;
  // push the final state
  const finalSnap = createSnapshot();
  // avoid pushing duplicate snapshot equal to the last one we just pushed
  function isSnapshotEqual(s1, s2) {
    if (!s1 || !s2) return false;
    if (!s1.items || !s2.items || s1.items.length !== s2.items.length) return false;
    for (let i = 0; i < s1.items.length; i++) {
      const a = s1.items[i], b = s2.items[i];
      if (a.id !== b.id || a.type !== b.type || a.left !== b.left || a.top !== b.top || a.z !== b.z) return false;
      if (a.width !== b.width || a.height !== b.height) return false;
      if (a.opacity !== b.opacity || a.text !== b.text || a.d !== b.d || a.stroke !== b.stroke) return false;
    }
    return true;
  }

  const last = undoStack[undoStack.length-1];
  try{
    if(last && isSnapshotEqual(last, finalSnap)){
      // no-op, identical
      updateUndoRedoButtons();
      return;
    }
  }catch(e){}
  undoStack.push(finalSnap);
  if(undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

// --- NEW: Get current board coordinates from mouse event, accounting for scale and position
const board = el('#board');
const svg = el('#strokes-svg'); // This is the main SVG for lasso
const layerList = el('#layer-list');
const TOOL_BTN = document.querySelectorAll('.tool-btn');

const drawingGuides = el('#drawing-guides');
const guideH = el('#guide-h');
const guideV = el('#guide-v');

// --- NEW: Get board coordinates from mouse event, accounting for scale and position
let cachedBoardRect = null;
function updateCachedBoardRect() {
  if (board) {
    cachedBoardRect = board.getBoundingClientRect();
  }
}

function getBoardPointFromEvent(e){
  if (!board) return { x: 0, y: 0 };
  const rect = board.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;
  if (clientX === undefined && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  }
  if (clientX === undefined) {
    clientX = 0;
    clientY = 0;
  }
  const x = (clientX - rect.left) / state.scale;
  const y = (clientY - rect.top) / state.scale;
  return { x, y };
}


// --- Finalize the current stroke group by making it selectable and refreshing layers, or removing it if empty. Also clear selection to avoid leaving the last stroke active.
function finalizeStrokeGroup() {
    if (currentPath) {
        currentPath.classList.remove('is-drawing');
    }

    if (currentStrokeGroup) {
        // Only transform if circle transform is enabled in state
        if (state.stroke.circleTransform) {
            // Keep your existing transformation logic here
            // transformToCircle(currentStrokeGroup); 
        }

        if (currentStrokeGroup.children.length === 0) {
            currentSvgWrapper.remove();
        } else {
            // For non-rounded single straight-line segments, path-level selection is
            // already set up by makePathSelectable() inside startStroke(). Calling
            // makeSvgSelectable() here would add a g-element handler that selects by
            // wrapper-id on ANY click in the element's bounding box, causing the whole
            // connected path to appear selected. Skip it for individual segments.
            const strokes = currentStrokeGroup.querySelectorAll('.stroke');
            const isSingleStraightSegment =
                strokes.length === 1 &&
                strokes[0].dataset.straightLine === 'true' &&
                !state.stroke.rounded;
            if (!isSingleStraightSegment) {
                makeSvgSelectable(currentStrokeGroup);
            }
            refreshLayers();
        }
        currentStrokeGroup = null;
        currentSvgWrapper = null;
        currentPath = null;
    }
    // NOTE: straightLineState is intentionally NOT cleared here.
    // Callers that manage connected-line chains update it themselves.
    clearSelection();
}

/// --- Create snapshot of current board state for undo/redo and export
function createSnapshot() {
  const items = [];

  // --- Capture images & text
  board.querySelectorAll('.item').forEach(n => {
    // Read from computed style if inline style is empty, to ensure we get the current position
    const left = n.style.left ? parseFloat(n.style.left) : n.offsetLeft;
    const top = n.style.top ? parseFloat(n.style.top) : n.offsetTop;
    const width = n.style.width ? parseFloat(n.style.width) : n.offsetWidth;
    const height = n.style.height ? parseFloat(n.style.height) : n.offsetHeight;
    
    const obj = {
      id: n.dataset.id,
      type: n.dataset.type,
      left: left,
      top: top,
      z: parseInt(n.style.zIndex || 0)
    };

    // For text items, exclude width/height from snapshots to prevent resizing from creating undo history
    if (n.dataset.type !== 'text') {
      obj.width = parseFloat(width);
      obj.height = parseFloat(height);
    }

    if (n.dataset.type === 'image') {
      const img = n.querySelector('img');
      const w = parseFloat(width);
      const h = parseFloat(height);
      obj.src = img?.src || '';
      obj.opacity = parseFloat(img?.style.opacity || '1');
      obj.transform = img?.style.transform || '';
      obj.width = Math.max(20, isNaN(w) ? 240 : w);
      obj.height = Math.max(20, isNaN(h) ? 180 : h);
    } else if (n.dataset.type === 'text') {
      const p = n.querySelector('.text-item');
      obj.text = p?.innerText || '';
      obj.width = parseFloat(width);
      obj.height = parseFloat(height);
      obj.style = {
        fontSize: p?.style.fontSize || null,
        bold: p?.style.fontWeight === 'bold',
        italic: p?.style.fontStyle === 'italic',
        underline: p?.style.textDecoration.includes('underline'),
        color: p?.style.color || null,
        backgroundColor: p?.style.backgroundColor || null,
        textAlign: p?.style.textAlign || 'left',
        fontFamily: p?.style.fontFamily || 'inherit'
      };
    }

    items.push(obj);
  });

  // --- Capture strokes 
  board.querySelectorAll('.stroke-wrapper').forEach(svgWrapper => {
    const g = svgWrapper.querySelector('g');
    if (!g) return;

    // FIX: Capture the wrapper's physical position
    const left = parseFloat(svgWrapper.style.left) || 0;
    const top = parseFloat(svgWrapper.style.top) || 0;
    const wrapperId = svgWrapper.dataset.id; // Track which wrapper these strokes belong to

    g.querySelectorAll('.stroke').forEach(p => {
      const pathId = p.dataset.id;
      const strokeColor = p.getAttribute('stroke');
      const hasStartArrow = !!p.getAttribute('marker-start');
      const hasEndArrow = !!p.getAttribute('marker-end');
      const arrowSize = parseFloat(p.dataset.arrowSize || state.stroke.arrowSize || 6);

      items.push({
        id: pathId,
        type: 'stroke',
        d: p.getAttribute('d'),
        stroke: strokeColor,
        width: parseFloat(p.getAttribute('stroke-width') || 2),
        z: parseInt(svgWrapper.style.zIndex || 0) || 0,
        hasStartArrow,
        hasEndArrow,
        arrowSize,
        transform: g.getAttribute('transform') || '',
        // FIX: Keep track of positions in history
        left: left,
        top: top,
        straightLine: p?.dataset?.straightLine === 'true',
        wrapperId: wrapperId  // NEW: Track group membership
      });
    });
  });

  // --- Return serializable snapshot
  return {
    date: Date.now(),
    state: {
      scale: state.scale,
      nextZ: state.nextZ,
      stroke: { ...state.stroke },
      text: { ...state.text }
    },
    items
  };
}

/// --- Restore from snapshot (used for undo/redo and import)
function restoreSnapshot(snapshot) {
  if (!snapshot) return;
  isRestoringHistory = true;

  // --- BUGFIX: Clear active drawing/selection states so the next user action doesn't reuse detached DOM elements ---
  if (typeof finalizeStrokeGroup === 'function') finalizeStrokeGroup(); 
  drawing = false;
  isLassoing = false;
  isSelectingRect = false;
  dragState = null;  // --- NEW: Clear drag state to prevent using stale node references ---
  resizeState = null;  // --- NEW: Clear resize state to prevent using stale node references ---
  if (typeof lassoPath !== 'undefined' && lassoPath) { lassoPath.remove(); lassoPath = null; }
  if (typeof rectSelectPath !== 'undefined' && rectSelectPath) { rectSelectPath.remove(); rectSelectPath = null; }
  state.selectedIds.clear();  // --- NEW: Clear selected IDs since those DOM elements are being recreated ---
  // -------------------------------------------------------------------------------------------------------

  // Clear existing items (including previously imported ones)
  const existingItems = board.querySelectorAll('.item, .stroke-wrapper');
  existingItems.forEach(n => {
    try { n.remove(); } catch(e) { console.warn('Failed to remove item:', e); }
  });

  // --- NEW: Group strokes by wrapper ID to preserve group structure during restore ---
  const strokesByWrapper = {};
  const nonStrokeItems = [];
  
  for (const it of snapshot.items || []) {
    if (it.type === 'stroke') {
      const wrapperId = it.wrapperId || it.id; // Use wrapperId if available, fallback to pathId for backwards compat
      if (!strokesByWrapper[wrapperId]) {
        strokesByWrapper[wrapperId] = [];
      }
      strokesByWrapper[wrapperId].push(it);
    } else {
      nonStrokeItems.push(it);
    }
  }
  
  // --- Restore non-stroke items first (images, text) ---
  for (const it of nonStrokeItems) {
    if (it.type === 'image') {
      const existing = board.querySelector(`.item[data-id="${it.id}"]`);
      if (existing) { try { existing.remove(); } catch(e) {} }
      
      const item = createImageItem(it.src || '', it.left ?? 80, it.top ?? 80, it.width ?? 240, {
        id: it.id, skipRefresh: true, skipSelect: true, skipFocus: true, skipHistory: true, opacity: it.opacity ?? 1
      });
      item.style.zIndex = it.z || 0;
      
      const imgWidth = Math.max(20, it.width || 240);
      item.style.width = imgWidth + 'px';
      if (it.height && it.height > 0) {
        item.style.height = Math.max(20, it.height) + 'px';
      }
      
      const img = item.querySelector('img');
      if (img && it.transform) {
        img.style.transform = it.transform;
      }
    }

    else if (it.type === 'text') {
      const existing = board.querySelector(`.item[data-id="${it.id}"]`);
      if (existing) { try { existing.remove(); } catch(e) {} }
      
      const item = createTextItem(it.text || '', it.left ?? 80, it.top ?? 80, {
        id: it.id, skipRefresh: true, skipSelect: true, skipFocus: true, skipHistory: true
      });
      item.style.zIndex = it.z || 0;

      const w = it.width || 200;
      const h = it.height || 100;
      item.style.width = w + 'px';
      item.style.height = h + 'px';

      const p = item.querySelector('.text-item');
      if (p && it.style) {
        p.style.fontSize = it.style.fontSize || '';
        p.style.color = it.style.color || '';
        p.style.backgroundColor = it.style.backgroundColor || '';
        p.style.fontWeight = it.style.bold ? 'bold' : 'normal';
        p.style.fontStyle = it.style.italic ? 'italic' : 'normal';
        p.style.textDecoration = it.style.underline ? 'underline' : 'none';
        p.style.textAlign = it.style.textAlign || 'left';
        p.style.fontFamily = it.style.fontFamily || 'inherit';

        if (typeof fitText === 'function') fitText(p, w, h);
      }
    }
  }
  
  // --- Restore stroke groups (all strokes from same wrapper in one SVG) ---
  for (const wrapperId in strokesByWrapper) {
    const strokes = strokesByWrapper[wrapperId];
    if (strokes.length === 0) continue;
    
    // Get first stroke to determine wrapper-level properties
    const firstStroke = strokes[0];
    
    const existing = board.querySelector(`.stroke-wrapper[data-id="${wrapperId}"]`);
    if (existing) { try { existing.remove(); } catch(e) {} }
    
    const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgWrapper.classList.add('stroke-wrapper');
    svgWrapper.dataset.type = 'stroke-group'; 
    svgWrapper.dataset.id = wrapperId;
    svgWrapper.style.zIndex = firstStroke.z || 0;
    svgWrapper.style.left = (firstStroke.left ?? 0) + 'px';
    svgWrapper.style.top = (firstStroke.top ?? 0) + 'px';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (firstStroke.transform) g.setAttribute('transform', firstStroke.transform);
    svgWrapper.appendChild(g);
    
    // --- Create markers (defs) once for the entire group ---
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    let hasMarkers = false;
    
    // --- Restore all strokes in this group ---
    for (const it of strokes) {
      let markerStart = '', markerEnd = '';
      if (it.hasStartArrow || it.hasEndArrow) {
        const mid = `arrow-${it.id}`;
        const arrowSize = parseFloat(it.arrowSize) || 6;
        
        if (!document.getElementById(mid)) {
          const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
          marker.id = mid;
          marker.setAttribute('markerWidth', arrowSize);
          marker.setAttribute('markerHeight', arrowSize);
          marker.setAttribute('refX', arrowSize);
          marker.setAttribute('refY', arrowSize / 2);
          marker.setAttribute('markerUnits', 'strokeWidth');
          marker.setAttribute('orient', 'auto-start-reverse');
          marker.setAttribute('viewBox', `0 0 ${arrowSize * 1.5} ${arrowSize}`);

          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          poly.setAttribute('points', `0,0 ${arrowSize * 1.2},${arrowSize / 2} 0,${arrowSize}`);
          poly.setAttribute('fill', it.stroke || '#000');

          marker.appendChild(poly);
          defs.appendChild(marker);
          hasMarkers = true;
        }
        
        if (it.hasStartArrow) markerStart = `url(#${mid})`;
        if (it.hasEndArrow) markerEnd = `url(#${mid})`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.classList.add('stroke');
      path.dataset.id = it.id;
      path.dataset.type = 'stroke';
      if (it.straightLine) path.dataset.straightLine = 'true';
      path.setAttribute('d', it.d || '');
      path.setAttribute('stroke', it.stroke || '#000');
      path.setAttribute('stroke-width', it.width || 2);
      path.dataset.arrowSize = it.arrowSize || 6;
      if (markerStart) path.setAttribute('marker-start', markerStart);
      if (markerEnd) path.setAttribute('marker-end', markerEnd);

      g.appendChild(path);
      makePathSelectable(path);
    }
    
    if (hasMarkers) g.insertBefore(defs, g.firstChild);
    board.appendChild(svgWrapper);
    makeSvgSelectable(g);
  }

  applyScale();
  updateSelectionModeUI();
  refreshLayers();
  isRestoringHistory = false;
}

// Enable or disable Undo/Redo buttons based on stack state
function updateUndoRedoButtons(){
  const undoBtn = el('#undo-btn'); const redoBtn = el('#redo-btn');
  if(undoBtn) undoBtn.disabled = undoStack.length <= 1; // <-- MODIFIED
  if(redoBtn) redoBtn.disabled = redoStack.length === 0;
}


// Quick check to see if two snapshots are effectively the same in terms of items, to avoid pushing redundant history states
function snapshotItemsEqual(items1, items2) {
  if (!items1 || !items2 || items1.length !== items2.length) return false;
  
  for (let i = 0; i < items1.length; i++) {
    const a = items1[i];
    const b = items2[i];
    // Quick reference check for same object
    if (a === b) continue;
    // Compare key fields without full deep comparison
    if (a.id !== b.id || a.type !== b.type || a.z !== b.z) return false;
    if (a.left !== b.left || a.top !== b.top) return false;
    if (a.width !== b.width || a.height !== b.height) return false;
    if (a.d !== b.d || a.stroke !== b.stroke) return false;
    if (a.text !== b.text || a.transform !== b.transform) return false;
    
    // Ensure arrow states and straight-line metadata are tracked
    if (!!a.hasStartArrow !== !!b.hasStartArrow) return false;
    if (!!a.hasEndArrow !== !!b.hasEndArrow) return false;
    if (a.arrowSize !== b.arrowSize) return false;
    if (!!a.straightLine !== !!b.straightLine) return false;
  }
  return true;
}

// Call this after any user action that modifies the board state and should be undoable
function pushHistory() {
  if (isRestoringHistory) return;
  
  const snap = createSnapshot();
  const last = undoStack[undoStack.length - 1];

  if (last && snapshotItemsEqual(last.items, snap.items)) {
    // Items haven't changed, don't push
    updateUndoRedoButtons();
    return;
  }

  // Push the new state to the stack
  undoStack.push(snap);
  
  // Keep the stack within limits
  if (undoStack.length > HISTORY_LIMIT) {
    undoStack.shift();
  }

  // Any new action clears the Redo path
  redoStack = [];
  updateUndoRedoButtons();
}

// Call this to undo the last action
function undo(){
  if(undoStack.length <= 1) return;
  
  const currentState = undoStack.pop(); // Pop the state we are leaving
  redoStack.push(currentState); // Push it to the redo stack
  
  // Peek at the new "top" state to restore it
  const stateToRestore = undoStack[undoStack.length - 1]; 
  
  restoreSnapshot(stateToRestore);
  
  // FIX: Clear selection after restoring the state
  clearSelection(); 

  updateUndoRedoButtons();
}

// Call this to redo the last undone action
function redo(){
  if(redoStack.length === 0) return;

  const stateToRestore = redoStack.pop(); // Pop the state we want to restore
  undoStack.push(stateToRestore); // Push it back onto the undo stack
  
  restoreSnapshot(stateToRestore);

  // FIX: Clear selection after restoring the state
  clearSelection();

  updateUndoRedoButtons();
}
//----------------- END HISTORY HELPERS -----------------

/// --- TOOL SELECTION ---
function setTool(t){
  if (state.tool === 'draw' && t !== 'draw') {
    finalizeStrokeGroup();
    straightLineState = null;
  }

  // Check if any images are selected before changing tool
  const hasSelectedImages = Array.from(state.selectedIds).some(id => {

    const node = findNodeById(id);

    return node && node.dataset.type === 'image';
  });

  state.tool = t;

  TOOL_BTN.forEach(b => {

    if (!b.closest('.tool-btn-group')) {
      b.classList.toggle('active', b.dataset.tool === t);
    }
  });

  // Hide opacity slider when switching away from select tool
  const transparencyDiv = el('#image-transparency');
  if (t !== 'select') {
    if (transparencyDiv && transparencyDiv.style.display !== 'none') {
      transparencyDiv.style.display = 'none';
    }
  }

  const selectGroup = el('#select-tool-group');
  if (t === 'select') {
    selectGroup.classList.add('active');
  } else {
    selectGroup.classList.remove('active');
  }

  const drawGroup = el('#draw-tool-group');

  if (t === 'draw' || t === 'stroke-settings') {
    drawGroup.classList.add('active');
  } else {
    drawGroup.classList.remove('active');
  }

  const textGroup = el('#text-tool-group');

  if (t === 'text' || t === 'text-settings') {
    textGroup.classList.add('active');
  } else {
    textGroup.classList.remove('active');
  }

  if (t === 'select') {
    svg.style.pointerEvents = 'auto'; // SVG is needed for lasso
  } else {
    svg.style.pointerEvents = 'auto'; // Also needed for drawing
  }

  const customCursor = el('#custom-cursor');

  if(t === 'draw') {
    board.style.cursor = 'none';
    if (customCursor) {
      customCursor.style.display = 'block';
      // Show cursor for all input types (mouse, touch, pen)
    }
        if (toolbarStroke) {
            toolbarStroke.style.display = 'flex';
            const quickColors = el('#quick-stroke-colors');
            if (quickColors) {
                quickColors.style.display = 'flex'; // Show all quick actions together
            }
            try { updateToolbarStrokeUI(); } catch (e) { }
        }
    updateCustomCursor();
  } else {
    if (customCursor) customCursor.style.display = 'none';
    if(t === 'text') {
      board.style.cursor = 'text';
    } else {
      board.style.cursor = 'default';
    }
    if (toolbarStroke) toolbarStroke.style.display = 'none';
  }

  // Show/hide text toolbar when text tool is active
  const toolbarText = el('#text-toolbar');
          if (toolbarText) {
              toolbarText.style.display = (t === 'text') ? 'flex' : 'none';
              if (t === 'text') setTimeout(()=>{ try{ updateToolbarTextUI(); }catch(e){} }, 0);
          }
              checkToolbarOverflow();
              }
              function checkToolbarOverflow() {
                  const toolbar = el('.toolbar');
                  if (!toolbar) return;
                  setTimeout(() => {
                      if (document.body.classList.contains('dragging')) return;

                      // --- Create an off-screen clone to pre-determine the final state ---
                      const clone = toolbar.cloneNode(true);
                      clone.style.position = 'absolute';
                      clone.style.left = '-9999px';
                      clone.style.top = '-9999px';
                      clone.style.visibility = 'hidden';
                      clone.style.width = toolbar.clientWidth + 'px';
                      document.body.appendChild(clone);

                      const mainToolsFull = { '#tool-select': 'Select', '#tool-draw': 'Draw', '#tool-text': 'Text' };

                      const mainToolsShort = { '#tool-select': 'S', '#tool-draw': 'D', '#tool-text': 'T' };

                      // --- Use the clone to determine the required condensation level ---
                      let condensationLevel = 0;

                      // Reset clone to full expansion to get a baseline
                      clone.classList.remove('toolbar-condensed', 'toolbar-super-condensed');
                      for (const id in mainToolsFull) { clone.querySelector(id).innerText = mainToolsFull[id]; }

                      // Ensure quick colors and toolbars are properly visible for accurate space calculation
                      const quickColorsClone = clone.querySelector('#quick-stroke-colors');
                      const strokeToolbarClone = clone.querySelector('#stroke-toolbar');
                      const textToolbarClone = clone.querySelector('#text-toolbar');
                      
                      // Show stroke toolbar & colors if they're visible in the real toolbar
                      if (strokeToolbarClone && el('#stroke-toolbar').style.display !== 'none') {
                          strokeToolbarClone.style.display = 'flex';
                          if (quickColorsClone) quickColorsClone.style.display = 'flex';
                      }
                      
                      // Show text toolbar if visible in the real toolbar
                      if (textToolbarClone && el('#text-toolbar').style.display !== 'none') {
                          textToolbarClone.style.display = 'flex';
                      }

                      // Check overflow on the clone in stages
                      if (clone.scrollWidth > clone.clientWidth + 1) {
                          condensationLevel = 1;
                          clone.classList.add('toolbar-condensed');
                      }

                      // At level 2, hide quick colors if still overflowing
                      if (clone.scrollWidth > clone.clientWidth + 1) {
                          condensationLevel = 2;
                          if (quickColorsClone) quickColorsClone.style.display = 'none';
                      }
                      
                      // At level 3, full super-condensed mode
                      if (clone.scrollWidth > clone.clientWidth + 1) {
                          condensationLevel = 3;
                          clone.classList.add('toolbar-super-condensed');
                          for (const id in mainToolsShort) { clone.querySelector(id).innerText = mainToolsShort[id]; }
                      }

                      // --- Apply the final determined state to the REAL toolbar in one go ---
                      toolbar.classList.toggle('toolbar-condensed', condensationLevel >= 1);
                      toolbar.classList.toggle('toolbar-super-condensed', condensationLevel >= 3);

                      if (condensationLevel >= 3) {
                          for (const id in mainToolsShort) { el(id).innerText = mainToolsShort[id]; }
                      } else {
                          for (const id in mainToolsFull) { el(id).innerText = mainToolsFull[id]; }
                      }

                      // Apply color picker visibility based on space availability and stroke toolbar state
                      const quickColors = el('#quick-stroke-colors');
                      const strokeToolbar = el('#stroke-toolbar');

                      if (quickColors && strokeToolbar && strokeToolbar.style.display !== 'none') {
                          quickColors.style.display = (condensationLevel >= 2) ? 'none' : 'flex';
                      }

                      // --- Cleanup ---
                      document.body.removeChild(clone);
                  }, 50);
              }
      function updateCustomCursor() {
  const customCursor = document.getElementById('custom-cursor');
  if (!customCursor) return;

  const brushCircle = document.getElementById('cursor-brush-size');
  const fixedGroup = document.getElementById('cursor-fixed-size-group');

  if (!brushCircle || !fixedGroup) return;

  const brushRadius = state.stroke.width / 2;
  const color = state.stroke.color || '#000';

  // 1. Update the brush size circle - scale with zoom level to represent actual brush size on the screen
  brushCircle.setAttribute('r', Math.max(0.5, brushRadius * state.scale));
  brushCircle.setAttribute('fill', color);
  brushCircle.style.opacity = 0.5;

  // 2. Clear scale transform on the fixed-size group as it is in screen space and doesn't need scaling
  fixedGroup.removeAttribute('transform');
  
  // 3. Update cursor position based on last mouse position
  updateCustomCursorPosition();
}

function updateCustomCursorPosition() {
  if (!lastMouseEvent) return;
  const customCursor = document.getElementById('custom-cursor');
  if (!customCursor || isPanning) return;
  
  const screenCoords = getCustomCursorScreenCoords();
  if (screenCoords) {
    customCursor.setAttribute('transform', `translate(${screenCoords.x}, ${screenCoords.y})`);
  }
}

function updateGuidelinesAndCursor() {
  if (!lastMouseEvent) return;
  
  const screenCoords = getCustomCursorScreenCoords();
  if (screenCoords) {
    if (guideH && guideV) {
      guideH.setAttribute('y1', screenCoords.y);
      guideH.setAttribute('y2', screenCoords.y);
      guideV.setAttribute('x1', screenCoords.x);
      guideV.setAttribute('x2', screenCoords.x);
    }
  }
  
  // Update custom cursor
  updateCustomCursorPosition();
}

/// --- MODIFIED: Added options parameter for import and to control history/selection behavior ---
function createImageItem(src, x=80, y=80, w=240, options = {}){
  finalizeStrokeGroup();
  const wrapper = document.createElement('div');
  const uid = options.id || id('img'); // MODIFIED: Allow passing ID
  wrapper.className = 'item';
  wrapper.dataset.id = uid;
  wrapper.dataset.type = 'image';
  wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px';
  wrapper.style.zIndex = state.nextZ++; // --- MODIFIED: Use unified Z ---
  
  // Pre-set dimensions to prevent flickering during undo/redo
  if (w) {
    wrapper.style.width = w + 'px';
  }
  
  const img = document.createElement('img');
  img.src = src;
  if (options.opacity !== undefined) {
    img.style.opacity = options.opacity;
  }
  
  // Track if we need to push history after image loads (to avoid intermediate states)
  let shouldPushHistoryOnLoad = !options.skipHistory && options.deferHistory;
  
  img.onload = ()=> {
    // Allow initial width to be the requested width (w) even if it's larger than the image's natural size
    if (!wrapper.style.width) wrapper.style.width = (w ? w : (img.naturalWidth || 240)) + 'px';
    // Set height based on image aspect ratio if not already set
    if (!wrapper.style.height && img.naturalHeight && img.naturalWidth) {
      const width = parseFloat(wrapper.style.width || w || 240);
      wrapper.style.height = (width * img.naturalHeight / img.naturalWidth) + 'px';
    }
    if (!options.skipRefresh) refreshLayers();
    // Update pixelation indicator depending on whether the displayed size exceeds natural size
    try{ updateImagePixelation(wrapper); }catch(err){}
    
    // Push history after image dimensions are finalized
    if (shouldPushHistoryOnLoad) {
      pushHistory();
    }
  };
  wrapper.appendChild(img);
  attachItemBehaviors(wrapper);
  board.appendChild(wrapper);
  if (!options.skipRefresh) refreshLayers();
  if (!options.skipSelect) selectItem(uid);
  // Toggle pixelation based on size vs natural resolution
  try{ updateImagePixelation(wrapper); }catch(e){}
  if (!options.skipHistory && !options.deferHistory) pushHistory();
  return wrapper;
}

// --- NEW: Function to toggle pixelation class based on displayed size vs natural size ---
function updateImagePixelation(wrapper){
  if(!wrapper) return;

  const img = wrapper.querySelector?.('img');
  if(!img || !img.complete) return;

  const natural = img.naturalWidth || 0;

  let intended = parseFloat(wrapper.style.width);
  if(!intended || isNaN(intended)){
    intended = (wrapper.getBoundingClientRect().width || 0) / (state.scale || 1);
  }

  const isUpscaled = natural > 0 && intended > natural;

  if(isUpscaled){
    img.classList.add('pixelated');
    img.classList.add('enhanced');
  } else {
    img.classList.remove('pixelated');
    img.classList.remove('enhanced');
  }
}


// --- MODIFIED: Added options parameter for import ---
function createTextItem(text='', x=100, y=100, options = {}){
  finalizeStrokeGroup();
  const wrapper = document.createElement('div');
  const uid = options.id || id('txt'); // MODIFIED: Allow passing ID
  wrapper.className = 'item';
  wrapper.dataset.id = uid;
  wrapper.dataset.type = 'text';
  wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px';
  wrapper.style.zIndex = state.nextZ++; // --- MODIFIED: Use unified Z ---
  wrapper.style.minWidth = '80px';
  wrapper.style.minHeight = '28px';

  const p = document.createElement('div');
  p.className = 'text-item';
  p.contentEditable = 'true';
  p.innerText = text || 'Type...';
  p.spellcheck = false;
  
  p.style.fontWeight = state.text.bold ? 'bold' : 'normal';
  p.style.fontStyle = state.text.italic ? 'italic' : 'normal';
  const td = [];
  if(state.text.underline) td.push('underline');
  if(state.text.crossed) td.push('line-through');
  p.style.textDecoration = td.length ? td.join(' ') : 'none';
  p.style.textAlign = state.text.align;
  p.style.fontSize = (typeof state.text.fontSize === 'number' ? state.text.fontSize + 'px' : state.text.fontSize || '16px');
  p.style.fontFamily = state.text.fontFamily || 'inherit';
  // Store fontFamily in data attribute for reliable retrieval
  wrapper.dataset.fontFamily = state.text.fontFamily || 'inherit';
  p.style.color = state.text.color;
const rgb = hexToRgbCached(state.text.bgColor);
  p.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.text.bgAlpha})`;
  
  wrapper.appendChild(p);
  
  p.addEventListener('focus', ()=>{
    if(p.innerText === 'Type...'){ p.innerText = ''; }
  });
  p.addEventListener('blur', () => {
    if (isDeleting) return; // <-- UPDATED: Guard against blur-on-delete
    if (ignoreNextBlurHistory) {
      ignoreNextBlurHistory = false;
      return;
    }
    delete wrapper.dataset.isNew;
    if (p.innerText.trim() === '') p.innerText = 'Type...';
    pushHistory(); // capture text edit in history
  });

  p.addEventListener('input', () => {
    const wrapper = p.closest('.item');
    if (wrapper) {
      const currentWidth = wrapper.offsetWidth;
      const newWidth = Math.max(currentWidth, p.scrollWidth, 80);
      const newHeight = Math.max(28, p.scrollHeight);
      wrapper.style.width = newWidth + 'px';
      wrapper.style.height = newHeight + 'px';
    }
  });
  
  attachItemBehaviors(wrapper);
  board.appendChild(wrapper);
  if (!options.skipRefresh) refreshLayers();
  if (!options.skipSelect) selectItem(uid);
  
  // --- MODIFIED: Skip focus during import ---
  if (!options.skipFocus) {
    wrapper.dataset.isNew = 'true';
    setTimeout(() => {
      p.focus();
      document.execCommand('selectAll', false, null);
      document.getSelection().collapseToEnd();
    }, 0);
  }
  // --- END MODIFICATION ---
  if (!options.skipHistory) pushHistory();
  return wrapper;
}

/* SVG Stroke creation */
function startStroke(x, y, pointerEvent = null) {
  const uid = id('stroke-group');
  currentSvgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  currentSvgWrapper.classList.add('stroke-wrapper');
  currentSvgWrapper.style.zIndex = state.nextZ++;
  currentSvgWrapper.dataset.id = uid;
  currentSvgWrapper.dataset.type = 'stroke-group';
  // Store input type for reference (useful for pressure-sensitive operations)
  if (pointerEvent) {
    currentSvgWrapper.dataset.inputType = getInputType(pointerEvent);
  }
  board.appendChild(currentSvgWrapper);

  currentStrokeGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
  currentStrokeGroup.dataset.id = uid;
  currentStrokeGroup.dataset.type = 'stroke-group-g';
  currentSvgWrapper.appendChild(currentStrokeGroup);

  clearSelection();

  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.classList.add('stroke');
  path.classList.add('is-drawing'); 

  path.dataset.type = 'stroke';
  path.dataset.id = id('stroke');
  
  // FIXED: Added "L x y" to create an immediate visible dot on click
  const xf = x.toFixed(1);
  const yf = y.toFixed(1);
  path.points = [{x, y}];
  path.setAttribute('d', `M ${xf} ${yf} L ${xf} ${yf}`);
  
  path.setAttribute('stroke', state.stroke.color);
  path.setAttribute('stroke-width', state.stroke.width);
  // Ensure round caps are set so the dot is visible as a circle
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  currentStrokeGroup.appendChild(path);
  makePathSelectable(path);
  return path;
}

/**
 * Highly optimized incremental path drawing
 * Enhanced to support pressure-sensitive input from pen/stylus
 */
function addPointToPath(path, x, y, pointerEvent = null) {
  if (!path) return;
  
  // Calculate effective stroke width based on pointer pressure (for pen input)
  let effectiveWidth = state.stroke.width;
  if (pointerEvent && pointerEvent.pointerType === 'pen' && pointerEvent.pressure) {
    // Pressure ranges from 0 to 1, use it to modulate stroke width
    // Minimum 30% of normal width, maximum 150% of normal width
    const pressureMultiplier = 0.3 + (pointerEvent.pressure * 1.2);
    effectiveWidth = Math.max(0.5, state.stroke.width * pressureMultiplier);
  }
  
  if (!path._drawState) {
    const xf = x.toFixed(1);
    const yf = y.toFixed(1);
    path._drawState = {
      lastX: x,
      lastY: y,
      lastPressure: pointerEvent ? getPressure(pointerEvent) : 1,
      // FIXED: Match the initial "dot" state so it doesn't flicker/disappear on first move
      baseD: `M ${xf} ${yf} L ${xf} ${yf}`,
      pointsCount: 1
    };
    path.points = [{ x, y, pressure: pointerEvent ? getPressure(pointerEvent) : 1 }];
    path.setAttribute('d', path._drawState.baseD);
    path.setAttribute('stroke-width', effectiveWidth);
    return;
  }

  const s = path._drawState;
  const dx = x - s.lastX;
  const dy = y - s.lastY;
  const distSq = dx * dx + dy * dy;

  // 1. Squared Distance Threshold: (1.5 * 1.5 = 2.25)
  if (distSq < 2.25) return;

  // 2. Optimized Dynamic Weight
  const dist = Math.sqrt(distSq);
  const weight = Math.max(0.4, Math.min(0.98, dist / 30));
  
  const smoothedX = s.lastX + dx * weight;
  const smoothedY = s.lastY + dy * weight;

  // 3. Incremental Bezier Logic
  if (s.pointsCount >= 2) {
    const midX = (s.lastX + smoothedX) * 0.5;
    const midY = (s.lastY + smoothedY) * 0.5;
    
    // Append segments using template literals for speed
    s.baseD += ` Q ${s.lastX.toFixed(1)} ${s.lastY.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }

  // Update State
  s.lastX = smoothedX;
  s.lastY = smoothedY;
  const currentPressure = pointerEvent ? getPressure(pointerEvent) : 1;
  s.lastPressure = currentPressure;
  s.pointsCount++;
  
  if (path.points) path.points.push({ x: smoothedX, y: smoothedY, pressure: currentPressure });

  // 4. Draw the live "tail"
  // This appends the live line-to following the cursor to the smoothed base path
  path.setAttribute('d', `${s.baseD} L ${smoothedX.toFixed(1)} ${smoothedY.toFixed(1)}`);
  
  // Update stroke width based on pressure
  path.setAttribute('stroke-width', effectiveWidth);
}

// Snap a point (mx,my) relative to anchor (sx,sy) to the nearest angle step (degrees)
function snapToAngle(sx, sy, mx, my, stepDeg = 15) {
  const dx = mx - sx;
  const dy = my - sy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: mx, y: my };
  let ang = Math.atan2(dy, dx); // radians
  const angDeg = ang * 180 / Math.PI;
  const snappedDeg = Math.round(angDeg / stepDeg) * stepDeg;
  const snappedRad = snappedDeg * Math.PI / 180;
  return { x: sx + Math.cos(snappedRad) * len, y: sy + Math.sin(snappedRad) * len };
}

// Build a polyline path string with optional rounded corners. Rounding is applied by generating quadratic Bezier arcs at each corner point.
function buildPolylinePath(points, useRounding = false, radiusMultiplier = 1.5) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  
  let commands = [];
  commands.push(`M ${points[0].x} ${points[0].y}`);
  commands.push(`L ${points[1].x} ${points[1].y}`);
  
  // Process remaining points - apply rounding to corners
  for (let i = 2; i < points.length; i++) {
    const incomingPt = points[i - 2];
    const cornerPt = points[i - 1];
    const outgoingPt = points[i];
    
    if (useRounding) {
      const arc = generateCornerArc(incomingPt, cornerPt, outgoingPt, radiusMultiplier);
      if (arc) {
        // Remove the last "L cornerPt" command that was added
        commands.pop();
        // Add arc commands instead
        commands.push(`L ${arc.start.x} ${arc.start.y}`);
        commands.push(`Q ${arc.control.x} ${arc.control.y} ${arc.end.x} ${arc.end.y}`);
        commands.push(`L ${outgoingPt.x} ${outgoingPt.y}`);
      } else {
        // Arc failed, just add straight line to current point
        commands.push(`L ${outgoingPt.x} ${outgoingPt.y}`);
      }
    } else {
      // No rounding, straight line
      commands.push(`L ${outgoingPt.x} ${outgoingPt.y}`);
    }
  }
  
  return commands.join(' ');
}

// Generate a smooth arc between two line segments at their corner point
// p1: point before corner, p2: corner point, p3: point after corner
function generateCornerArc(p1, p2, p3, radiusMultiplier = 1.5) {
  // Calculate distances
  const d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
  
  if (d1 === 0 || d2 === 0) return null; // Degenerate case
  
  // Radius is proportional to the average line length
  // Longer lines = larger radius, shorter lines = smaller radius
  const avgLength = (d1 + d2) / 2;
  const baseRadius = avgLength * 0.25 * radiusMultiplier; // 25% of average line length, scaled by multiplier
  
  // Pull back from corner, but cap at 40% of each line's length
  const pullback1 = Math.min(baseRadius, d1 * 0.4);
  const pullback2 = Math.min(baseRadius, d2 * 0.4);
  
  // Unit vectors along the lines
  const u1x = (p2.x - p1.x) / d1;
  const u1y = (p2.y - p1.y) / d1;
  const u2x = (p3.x - p2.x) / d2;
  const u2y = (p3.y - p2.y) / d2;
  
  // Arc endpoints pulled back from the corner
  const arcStartX = p2.x - u1x * pullback1;
  const arcStartY = p2.y - u1y * pullback1;
  const arcEndX = p2.x + u2x * pullback2;
  const arcEndY = p2.y + u2y * pullback2;
  
  // Control point at the corner for smooth transition
  return { 
    start: { x: arcStartX, y: arcStartY }, 
    end: { x: arcEndX, y: arcEndY }, 
    control: { x: p2.x, y: p2.y } 
  };
}

// --- Added addToSelection parameter to control whether to clear existing selection ---
function selectItem(idToSelect, addToSelection = false) {
  // 1. Manage selection state
  if (!addToSelection) {
    clearSelection();
  }
  if (!idToSelect) return;

  const node = findNodeById(idToSelect);
  if (!node) return;

  state.selectedIds.add(idToSelect);
  node.classList.add('selected');

  // 2. Handle Resize Handles (Item-specific UI)
  if (node.dataset.type === 'image') {
    if (!node.querySelector('.handle')) {
      const h = document.createElement('div');
      h.className = 'handle';
      h.dataset.resizeDir = 'se';
      node.appendChild(h);
      h.addEventListener('pointerdown', startResizePointer);
    }
  } else if (node.dataset.type === 'text') {
    // Remove default corner handle if it exists from older logic
    const cornerHandle = node.querySelector('.handle:not(.handle-e):not(.handle-s)');
    if (cornerHandle) cornerHandle.remove();

    // Add Side Handle (East)
    if (!node.querySelector('.handle-e')) {
      const h_e = document.createElement('div');
      h_e.className = 'handle handle-e';
      h_e.dataset.resizeDir = 'e';
      node.appendChild(h_e);
      h_e.addEventListener('pointerdown', startResizePointer);
    }
    // Add Bottom Handle (South)
    if (!node.querySelector('.handle-s')) {
      const h_s = document.createElement('div');
      h_s.className = 'handle handle-s';
      h_s.dataset.resizeDir = 's';
      node.appendChild(h_s);
      h_s.addEventListener('pointerdown', startResizePointer);
    }
  }

  // 3. Sync State properties if single-selecting a text item
  if (!addToSelection && node.dataset.type === 'text') {
    const textDiv = node.querySelector('.text-item');
    if (textDiv) {
      const styles = window.getComputedStyle(textDiv);
      state.text.bold = styles.fontWeight === 'bold' || parseInt(styles.fontWeight) >= 700;
      state.text.italic = styles.fontStyle === 'italic';
      state.text.underline = styles.textDecoration.includes('underline');
      state.text.crossed = styles.textDecoration.includes('line-through');
      state.text.fontSize = parseFloat(styles.fontSize) || state.text.fontSize;
      
      const colorRgb = parseRgba(styles.color);
      state.text.color = rgbToHex(colorRgb.r, colorRgb.g, colorRgb.b);
      
      const bgRgb = parseRgba(styles.backgroundColor);
      state.text.bgColor = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
      state.text.bgAlpha = bgRgb.a;
      state.text.align = styles.textAlign || 'left';
      state.text.fontFamily = node.dataset.fontFamily || textDiv.style.fontFamily || 'inherit';

      updateTextPopupUI();
    }
  }

  // 4. QUICKBAR VISIBILITY LOGIC (Prioritization)
  const transparencyDiv = el('#image-transparency');
  const textToolbar = el('#text-toolbar');
  const strokeToolbar = el('#stroke-toolbar');

  // Gather current selection types
  const selectedNodes = Array.from(state.selectedIds)
    .map(id => findNodeById(id))
    .filter(n => n !== null);

  const hasText = selectedNodes.some(n => n.dataset.type === 'text');
  const hasImage = selectedNodes.some(n => n.dataset.type === 'image');
  const hasStroke = selectedNodes.some(n => n.dataset.type === 'stroke' || n.dataset.type === 'stroke-wrapper');

  // Mutual Exclusion logic: Only one toolbar should show at a time
  if (hasText) {
    // Show Text UI, hide Image & Stroke
    if (textToolbar) textToolbar.style.display = 'flex';
    if (transparencyDiv) transparencyDiv.style.display = 'none';
    if (strokeToolbar) strokeToolbar.style.display = 'none';
    updateToolbarTextUI();
  } else if (hasImage) {
    // Show Image UI, hide Text & Stroke
    if (transparencyDiv) transparencyDiv.style.display = 'flex';
    if (textToolbar) textToolbar.style.display = 'none';
    if (strokeToolbar) strokeToolbar.style.display = 'none';
    
    // Sync slider to the first selected image
    const firstImgNode = selectedNodes.find(n => n.dataset.type === 'image');
    const img = firstImgNode ? firstImgNode.querySelector('img') : null;
    const opacity = img ? parseFloat(img.style.opacity || '1') * 100 : 100;
    const transparencySlider = el('#transparency-slider');
    if (transparencySlider) {
      transparencySlider.value = opacity;
      el('#transparency-value').textContent = Math.round(opacity) + '%';
    }
  } else if (hasStroke) {
    // Show Stroke UI, hide Text & Image
    if (strokeToolbar) strokeToolbar.style.display = 'flex';
    if (textToolbar) textToolbar.style.display = 'none';
    if (transparencyDiv) transparencyDiv.style.display = 'none';
    updateToolbarStrokeUI();
  } else {
    // Hide all
    if (textToolbar) textToolbar.style.display = 'none';
    if (transparencyDiv) transparencyDiv.style.display = 'none';
    if (strokeToolbar) strokeToolbar.style.display = 'none';
  }

  refreshLayers();
  checkToolbarOverflow();
}

function clearSelection(){
  // --- Cache selectors to avoid repeated querySelectorAll ---
  const selectedElements = board.querySelectorAll('.item.selected, .stroke-wrapper.selected, .stroke.selected');
  selectedElements.forEach(n=>{
    if (n.classList.contains('selected')) {
      n.classList.remove('selected');
    }
  });
  state.selectedIds.clear();
  // Hide transparency slider when no images are selected
  const transparencyDiv = el('#image-transparency');
  if (transparencyDiv.style.display !== 'none') transparencyDiv.style.display = 'none';
  // Hide text toolbar when no text is selected
  const textToolbar = el('#text-toolbar');
  if(textToolbar && textToolbar.style.display !== 'none') textToolbar.style.display = 'none';
  checkToolbarOverflow();
}

// Parse a transform string to extract the first translate(tx,ty) if present.
function parseTransform(transformStr){
  const res = { tx: 0, ty: 0, rest: (transformStr||'').trim() };
  if (!transformStr) return res;
  // Match translate(x,y) where separator may be comma or whitespace
  const m = transformStr.match(/translate\(\s*(-?\d+\.?\d*)(?:[,\s]+)(-?\d+\.?\d*)\s*\)/i);
  if (m) {
    res.tx = parseFloat(m[1]) || 0;
    res.ty = parseFloat(m[2]) || 0;
    // remove only the first translate occurrence
    res.rest = transformStr.replace(m[0], '').trim();
  }
  return res;
}

function applyTransformToPath(pathData, tx, ty) {
  if (!pathData || (tx === 0 && ty === 0)) return pathData;
  
  // Parse path data and transform all coordinates
  // This regex matches numbers in path commands (including negative and decimal)
  const transformed = pathData.replace(/(-?\d+\.?\d*)/g, (match) => {
    const num = parseFloat(match);
    // We need to be smarter about which numbers to transform
    // In SVG paths: M/L/H/V/C/S/Q/T/A are commands
    // We want to transform X coordinates (after M, L, C first and third args, etc)
    // For now, just return as-is and use a better approach
    return match;
  });
  
  // Better approach: parse and rebuild the path
  const commands = [];
  let i = 0;
  while (i < pathData.length) {
    const char = pathData[i];
    
    // Skip whitespace and commas
    while (i < pathData.length && /[\s,]/.test(pathData[i])) i++;
    
    // Check if this is a command letter
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(char)) {
      commands.push({ cmd: char, args: [] });
      i++;
    } else if (/[-\d.]/.test(char)) {
      // Parse number
      let num = '';
      while (i < pathData.length && /[-\d.eE]/.test(pathData[i])) {
        num += pathData[i];
        i++;
      }
      if (commands.length > 0) {
        commands[commands.length - 1].args.push(parseFloat(num));
      }
    } else {
      i++;
    }
  }
  
  // Now we have an array of commands with their arguments. We can transform the coordinates based on the command type.
  let result = '';
  commands.forEach(({ cmd, args }) => {
    result += cmd;
    const isRelative = cmd === cmd.toLowerCase() && cmd !== 'z';
    
    // Transform absolute coordinates
    if (cmd === 'M' || cmd === 'm') {
      // Moveto: x, y
      for (let i = 0; i < args.length; i += 2) {
        if (i > 0) result += ' ';
        result += (args[i] + (isRelative ? 0 : tx)) + ',' + (args[i + 1] + (isRelative ? 0 : ty));
      }
    } else if (cmd === 'L' || cmd === 'l') {
      // Lineto: x, y
      for (let i = 0; i < args.length; i += 2) {
        if (i > 0) result += ' ';
        result += (args[i] + (isRelative ? 0 : tx)) + ',' + (args[i + 1] + (isRelative ? 0 : ty));
      }
    } else if (cmd === 'H' || cmd === 'h') {
      // Horizontal lineto: x
      for (let i = 0; i < args.length; i++) {
        if (i > 0) result += ' ';
        result += args[i] + (isRelative ? 0 : tx);
      }
    } else if (cmd === 'V' || cmd === 'v') {
      // Vertical lineto: y
      for (let i = 0; i < args.length; i++) {
        if (i > 0) result += ' ';
        result += args[i] + (isRelative ? 0 : ty);
      }
    } else if (cmd === 'C' || cmd === 'c') {
      // Cubic bezier: x1,y1 x2,y2 x,y
      for (let i = 0; i < args.length; i += 6) {
        if (i > 0) result += ' ';
        result += (args[i] + (isRelative ? 0 : tx)) + ',' + (args[i + 1] + (isRelative ? 0 : ty)) + ' ' +
                  (args[i + 2] + (isRelative ? 0 : tx)) + ',' + (args[i + 3] + (isRelative ? 0 : ty)) + ' ' +
                  (args[i + 4] + (isRelative ? 0 : tx)) + ',' + (args[i + 5] + (isRelative ? 0 : ty));
      }
    } else if (cmd === 'S' || cmd === 's') {
      // Smooth cubic bezier: x2,y2 x,y
      for (let i = 0; i < args.length; i += 4) {
        if (i > 0) result += ' ';
        result += (args[i] + (isRelative ? 0 : tx)) + ',' + (args[i + 1] + (isRelative ? 0 : ty)) + ' ' +
                  (args[i + 2] + (isRelative ? 0 : tx)) + ',' + (args[i + 3] + (isRelative ? 0 : ty));
      }
    } else if (cmd === 'Q' || cmd === 'q') {
      // Quadratic bezier: x1,y1 x,y
      for (let i = 0; i < args.length; i += 4) {
        if (i > 0) result += ' ';
        result += (args[i] + (isRelative ? 0 : tx)) + ',' + (args[i + 1] + (isRelative ? 0 : ty)) + ' ' +
                  (args[i + 2] + (isRelative ? 0 : tx)) + ',' + (args[i + 3] + (isRelative ? 0 : ty));
      }
    } else if (cmd === 'T' || cmd === 't') {
      // Smooth quadratic bezier: x,y
      for (let i = 0; i < args.length; i += 2) {
        if (i > 0) result += ' ';
        result += (args[i] + (isRelative ? 0 : tx)) + ',' + (args[i + 1] + (isRelative ? 0 : ty));
      }
    } else if (cmd === 'A' || cmd === 'a') {
      // Arc: rx,ry x-axis-rotation large-arc-flag sweep-flag x,y
      for (let i = 0; i < args.length; i += 7) {
        if (i > 0) result += ' ';
        result += args[i] + ',' + args[i + 1] + ' ' + args[i + 2] + ' ' + args[i + 3] + ' ' + args[i + 4] + ' ' +
                  (args[i + 5] + (isRelative ? 0 : tx)) + ',' + (args[i + 6] + (isRelative ? 0 : ty));
      }
    } else {
      // Z/z command has no args
      result += args.join(',');
    }
    result += ' ';
  });
  
  return result.trim();
}

// Find a node by its data-id, preferring the stroke-wrapper for SVG strokes to ensure proper selection and z-order handling.
function findNodeById(idstr){
  // Prefer stroke-wrapper (SVG wrapper) when present so selection and z-order operate on the wrapper
  // Fall back to any element with the data-id
  const wrapper = board.querySelector(`.stroke-wrapper[data-id="${idstr}"]`);
  if (wrapper) return wrapper;
  const n = board.querySelector(`[data-id="${idstr}"]`);
  return n;
}

// Make an SVG <g> element selectable as a whole, and also make its child <path> elements selectable individually. This allows users to select and move entire stroke groups or individual strokes within them.
function makeSvgSelectable(gElement){
  gElement.addEventListener('pointerdown', (ev)=>{
    // Get wrapper info first to check selection state
    const svgWrapper = gElement.closest('.stroke-wrapper');
    const elId = svgWrapper.dataset.id;
    const isAlreadySelected = state.selectedIds.has(elId);
    
    // --- BUGFIX: Only prevent selection if we're ACTIVELY drawing, not just in draw mode ---
    // This allows users to select/drag strokes after undo even if tool is still set to 'draw'
    if (state.tool === 'draw' && drawing && !isAlreadySelected) {
      // Prevent selection and allow the board-level draw handler to handle the event
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    ev.stopPropagation();
    
    finalizeStrokeGroup();

    const addToSelection = ev.shiftKey;

    if (isAlreadySelected && addToSelection) {
      state.selectedIds.delete(elId);
      svgWrapper.classList.remove('selected');
      refreshLayers();
      return;
    }

    if (!isAlreadySelected) {
      selectItem(elId, addToSelection);
    }

    if (state.tool === 'select' || (state.tool === 'draw' && isAlreadySelected)) {
      startDragSvg(gElement, ev); // Pass the <g> element to drag
    }
  });
  // Also make individual stroke <path> elements selectable within this group
  gElement.querySelectorAll('.stroke').forEach(p => makePathSelectable(p));
}

// Make an individual SVG <path> selectable, allowing it to be selected and dragged independently of its parent group. This is used for strokes that are not part of a group or for individual paths within a group.
function makePathSelectable(path){
  if (!path) return;
  // Create an invisible wider 'hit' path behind the real stroke so thin strokes are easier to grab.
  // This hit path will be updated alongside the visible path's 'd'.
  const svgParent = path.ownerSVGElement || svg;
  let hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  hit.classList.add('stroke-hit');
  hit.dataset.type = 'stroke-hit';
  // Compute a comfortable hit width (visible width + margin)
  const visibleWidth = parseFloat(path.getAttribute('stroke-width') || '2');
  const hitMargin = 20; // pixels extra tolerance
  hit.setAttribute('stroke-width', Math.max(visibleWidth + hitMargin, 8));
  hit.setAttribute('d', path.getAttribute('d') || '');
  // Insert hit path before the visible path so it does not occlude markers
  path.parentNode.insertBefore(hit, path);
  // Reference on the visible path so we can update it when drawing
  path._hitPath = hit;

  const onHitPointerDown = (ev) => {
    const pid = path.dataset.id;
    const isAlreadySelected = state.selectedIds.has(pid);

    // --- BUGFIX: Only prevent selection if we're ACTIVELY drawing, not just in draw mode ---
    // This allows users to select/drag strokes after undo even if tool is still set to 'draw'
    if (state.tool === 'draw' && drawing) { 
      if (!isAlreadySelected) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
    }
    
    // If the parent stroke-wrapper is already selected, prefer to drag the wrapper
    const wrapper = path.closest('.stroke-wrapper');
    if (wrapper && state.selectedIds.has(wrapper.dataset.id)) {
      ev.stopPropagation();
      if (state.tool === 'select' || (state.tool === 'draw' && isAlreadySelected)) {
        const g = wrapper.querySelector('g');
        if (g) startDragSvg(g, ev);
      }
      return;
    }
    ev.stopPropagation();
    const addToSelection = ev.shiftKey;
    if (isAlreadySelected && addToSelection) {
      state.selectedIds.delete(pid);
      path.classList.remove('selected');
      refreshLayers();
      return;
    }
    if (!isAlreadySelected) {
      if (!addToSelection) clearSelection();
      state.selectedIds.add(pid);
      path.classList.add('selected');
      refreshLayers();
    }

    if (state.tool === 'select' || (state.tool === 'draw' && state.selectedIds.has(pid))) {
      // Start drag using the underlying path element so individual strokes move separately
      startDragSvg(path, ev);
    }
  };

  // Wire pointer events to the hit path
  hit.addEventListener('pointerdown', onHitPointerDown);
  // Also accept direct hits on the visible path (for completeness)
  path.addEventListener('pointerdown', onHitPointerDown);
}


// Drag state will track the initial pointer position and the original positions of all items being dragged. For SVG items, we also store the original transform to apply additive translations.
let dragState = null;

function startDragHtml(node, e){
  if(state.tool !== 'select' && !(state.tool === 'text' && (e.ctrlKey || e.metaKey))) return;
  if (!state.selectedIds.has(node.dataset.id)) return;
  e.preventDefault();
  const pt = getBoardPointFromEvent(e);
  const startX = pt.x;
  const startY = pt.y;
  dragState = { type: 'html', startX, startY, items: [] };
  
  // --- NEW: Track processed nodes to avoid duplicates when multiple strokes from same group are selected ---
  const processedNodes = new Set();
  
  state.selectedIds.forEach(id => {
    const n = findNodeById(id);
    if (!n) return;
    
    // FIX: Check for both dataset types defensively
    if (n.dataset.type === 'stroke-group' || n.dataset.type === 'stroke-wrapper') {
      const g = n.querySelector('g'); 
      if (!processedNodes.has(g)) {
        const orig = g.getAttribute('transform') || '';
        const parsed = parseTransform(orig);
        dragState.items.push({ node: g, type: 'svg', originalTransform: orig, baseTx: parsed.tx, baseTy: parsed.ty, transformRest: parsed.rest });
        processedNodes.add(g);
      }
    } else if (n.dataset.type === 'stroke') {
      // individual path selected - get its parent g element
      const g = n.closest('g');
      if (g && !processedNodes.has(g)) {
        const orig = g.getAttribute('transform') || '';
        const parsed = parseTransform(orig);
        dragState.items.push({ node: g, type: 'svg', originalTransform: orig, baseTx: parsed.tx, baseTy: parsed.ty, transformRest: parsed.rest });
        processedNodes.add(g);
      }
    } else {
      if (!processedNodes.has(n)) {
        dragState.items.push({ node: n, type: 'html', origLeft: parseFloat(n.style.left) || 0, origTop: parseFloat(n.style.top) || 0 });
        processedNodes.add(n);
      }
    }
  });
  board.setPointerCapture(e.pointerId);
}

// --- MODIFIED: Unified drag handler for both SVG and HTML items ---
function startDragSvg(element, e){
  e.preventDefault();
  const pt = getBoardPointFromEvent(e);
  dragState = { type: 'svg', startX: pt.x, startY: pt.y, items: [] };
  
  // --- NEW: Track processed nodes to avoid duplicates when multiple strokes from same group are selected ---
  const processedNodes = new Set();
  
  state.selectedIds.forEach(id => {
    const n = findNodeById(id);
    if (!n) return;
    
    let gElement = null;
    
    // FIX: Check for both dataset types defensively
    if (n.dataset.type === 'stroke-group' || n.dataset.type === 'stroke-wrapper') {
      gElement = n.querySelector('g');
    } else if (n.dataset.type === 'stroke') {
      gElement = n.closest('g');
    } else {
      // For HTML items, check if already processed (shouldn't happen but be safe)
      if (!processedNodes.has(n)) {
        dragState.items.push({ node: n, type: 'html', origLeft: parseFloat(n.style.left) || 0, origTop: parseFloat(n.style.top) || 0 });
        processedNodes.add(n);
      }
      return;
    }
    
    if (gElement) {
      // --- NEW: De-duplicate SVG transforms to prevent the same g element from being processed multiple times ---
      if (!processedNodes.has(gElement)) {
        const orig = gElement.getAttribute('transform') || '';
        const parsed = parseTransform(orig);
        dragState.items.push({ node: gElement, type: 'svg', originalTransform: orig, baseTx: parsed.tx, baseTy: parsed.ty, transformRest: parsed.rest });
        processedNodes.add(gElement);
      }
    }
  });
  board.setPointerCapture(e.pointerId);
}

// --- MODIFIED: Unified pointer move handler that applies additive translations to SVG elements while preserving existing transforms, and style adjustments for HTML elements ---
function onPointerMove(e){
  if(!dragState) return;
  const pt = getBoardPointFromEvent(e);
  const x = pt.x;
  const y = pt.y;
  const dx = x - dragState.startX;
  const dy = y - dragState.startY;
  dragState.items.forEach(item => {
    if (item.type === 'html') {
      item.node.style.left = (item.origLeft + dx) + 'px';
      item.node.style.top  = (item.origTop + dy) + 'px';
    } else if (item.type === 'svg') {
      // Apply additive translation on the SVG element while preserving existing transforms.
      const baseTx = parseFloat(item.baseTx) || 0;
      const baseTy = parseFloat(item.baseTy) || 0;
      const newTx = baseTx + dx;
      const newTy = baseTy + dy;
      const rest = (item.transformRest || '').trim();
      const t = rest ? `${rest} translate(${newTx},${newTy})` : `translate(${newTx},${newTy})`;
      item.node.setAttribute('transform', t);
    }
  });
  if (dragState.type === 'html') {
    refreshLayers();
  }
}

// --- MODIFIED: Updated pointer up handler to finalize positions and only push history if a meaningful move occurred ---
function onPointerUp(e) {
  if (!dragState) return;

  const pt = getBoardPointFromEvent(e);
  const dx = pt.x - dragState.startX;
  const dy = pt.y - dragState.startY;

  // --- NEW: Check if a meaningful drag occurred ---
  // A tiny threshold (e.g., 1px) prevents saving history 
  // for accidental micro-drags or simple clicks.
  const hasMoved = Math.abs(dx) > 1 || Math.abs(dy) > 1;

  // --- NEW: Create snapshot BEFORE modifying items to ensure consistent state capture ---
  let stateBeforeMove = null;
  if (hasMoved) {
    stateBeforeMove = createSnapshot();
  }

  dragState.items.forEach(item => {
    if (item.type === 'svg') {
      const element = item.node;
      const baseTx = parseFloat(item.baseTx) || 0;
      const baseTy = parseFloat(item.baseTy) || 0;
      const finalTx = baseTx + dx;
      const finalTy = baseTy + dy;
      const rest = (item.transformRest || '').trim();
      const newTransform = rest ? `${rest} translate(${finalTx},${finalTy})` : `translate(${finalTx},${finalTy})`;
      element.setAttribute('transform', newTransform);

      // ✅ Ensure arrow markers (if present) stay with the stroke
      const wrapper = element.closest('.stroke-wrapper');
      if (wrapper) {
        const defs = wrapper.querySelector('defs');
        if (defs) wrapper.appendChild(defs.cloneNode(true)); // keep defs with stroke group
      }
    } 
    else if (item.type === 'html') {
      // ✅ HTML items (like text boxes)
      item.node.style.left = (item.origLeft + dx) + 'px';
      item.node.style.top = (item.origTop + dy) + 'px';
    }
  });

  try { board.releasePointerCapture?.(e.pointerId); } catch(e) {}
  
  const currentState = dragState; // Save reference before nulling
  dragState = null;

  refreshLayers();

  // ✅ MODIFICATION: Only push history if the item was actually moved
  // Compare state before and after to ensure the move actually changed something
  if (hasMoved && stateBeforeMove) {
    const stateAfterMove = createSnapshot();
    // Only record in history if the state actually changed
    if (!snapshotItemsEqual(stateBeforeMove.items, stateAfterMove.items)) {
      // BUGFIX: Push the state AFTER the move, not before
      undoStack.push(stateAfterMove);
      if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
      redoStack = [];
      updateUndoRedoButtons();
    }
  }
}


// --- UTILITY: Debounce function to limit how often a function can be called, useful for performance when resizing text boxes or updating pixelation on images during drag ---
function debounce(func, wait) {
  let timeout;
  let lastThis, lastArgs;
  return function(...args) {
    lastThis = this;
    lastArgs = args;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(lastThis, lastArgs), wait);
  };
}

// Fit text within a container by adjusting font size. Uses binary search for efficiency. Temporarily disables contentEditable to prevent cursor from affecting measurements. Adds a small tolerance to account for browser zoom fluctuations.
function fitText(textDiv, containerWidth, containerHeight) {
    if (!textDiv || containerWidth <= 20 || containerHeight <= 10) {
      if(textDiv) textDiv.style.fontSize = '8px'; 
      return;
    }

    const wasEditable = textDiv.isContentEditable;
    // Temporarily disable editing to prevent the cursor from affecting measurements
    if (wasEditable) textDiv.contentEditable = 'false';

    textDiv.style.whiteSpace = 'pre-wrap';
    textDiv.style.wordWrap = 'break-word';

    let low = 8; 
    let high = 1000; 
    let bestSize = low;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        textDiv.style.fontSize = mid + 'px';

        /**
         * FIX: ADD TOLERANCE (+1.5)
         * Browser zoom causes scrollHeight/Width to fluctuate by sub-pixels.
         * Adding 1.5px prevents the font from "jumping" or getting stuck 
         * at a tiny size when zoomed out.
         */
        const fitsHeight = textDiv.scrollHeight <= containerHeight + 1.5;
        const fitsWidth = textDiv.scrollWidth <= containerWidth + 1.5;

        if (fitsHeight && fitsWidth) {
            bestSize = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    
    textDiv.style.fontSize = bestSize + 'px';
    if (wasEditable) textDiv.contentEditable = 'true';
}


const updateFontSizeDebounced = debounce(fitText, 100);
// Cache for color conversions to reduce repeated calculations
const colorCache = new Map();

// Convert hex color to RGB with caching for performance. Supports both 3-digit (#abc) and 6-digit (#aabbcc) formats. Caches results in a Map to avoid redundant parsing on frequently used colors.
function hexToRgbCached(hex) {
  if (!colorCache.has(hex)) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    colorCache.set(hex, { r, g, b });
  }
  return colorCache.get(hex);
}

// --- RESIZING STATE ---
let resizeState = null;
function startResizePointer(e){
  e.stopPropagation(); e.preventDefault();
  const handle = e.target;
  const node = handle.closest('.item');
  const resizeDir = handle.dataset.resizeDir || 'se';
  // Keep client coordinates so we can compute deltas that respect visual scale
  const startClientX = e.clientX;
  const startClientY = e.clientY;
  const origW = node.offsetWidth;
  const origH = node.offsetHeight;
  resizeState = {node, startClientX, startClientY, origW, origH, resizeDir};
  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', onResizeUp);
}



// --- MODIFIED: Updated resize move handler to adjust for zoom level and maintain aspect ratio for images. For text, we apply the new size and then call fitText with a tolerance to prevent font-size flickering due to sub-pixel rounding at different zoom levels.
function onResizeMove(e) {
  if (!resizeState) return;

  // 1. Calculate the movement delta adjusted for the current zoom level
  const dx = (e.clientX - resizeState.startClientX) / state.scale;
  const dy = (e.clientY - resizeState.startClientY) / state.scale;
  const node = resizeState.node;
  const dir = resizeState.resizeDir;

  let newWidth = resizeState.origW;
  let newHeight = resizeState.origH;
  let newLeft = resizeState.origX;
  let newTop = resizeState.origY;

  // 2. Handle Image Resizing (Maintain Aspect Ratio)
  if (node.dataset.type === 'image') {
    const img = node.querySelector('img');
    if (!img) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    
    // Images usually resize from the bottom-right for simplicity
    newWidth = Math.max(32, resizeState.origW + dx);
    newHeight = newWidth / aspect;
    
    node.style.width = newWidth + 'px';
    node.style.height = newHeight + 'px';
    try { updateImagePixelation(node); } catch(err) {}
  } 
  
  // 3. Handle Text Resizing
  else if (node.dataset.type === 'text') {
    // Horizontal Resizing
    if (dir.includes('e')) {
      newWidth = Math.max(50, resizeState.origW + dx);
    } else if (dir.includes('w')) {
      newWidth = Math.max(50, resizeState.origW - dx);
      newLeft = resizeState.origX + (resizeState.origW - newWidth);
    }

    // Vertical Resizing
    if (dir.includes('s')) {
      newHeight = Math.max(20, resizeState.origH + dy);
    } else if (dir.includes('n')) {
      newHeight = Math.max(20, resizeState.origH - dy);
      newTop = resizeState.origY + (resizeState.origH - newHeight);
    }

    // Apply updates to the DOM
    node.style.width = newWidth + 'px';
    node.style.height = newHeight + 'px';
    node.style.left = newLeft + 'px';
    node.style.top = newTop + 'px';

    const textItem = node.querySelector('.text-item');
    if (textItem) {
      /**
       * CRITICAL FIX FOR ZOOM:
       * We pass a +1px tolerance buffer to fitText. 
       * This prevents "font-size flickering" or the font getting stuck 
       * due to sub-pixel rounding errors caused by the CSS scale transform.
       */
      fitText(textItem, newWidth + 1, newHeight + 1);
    }
  }
}

// --- MODIFIED: Updated resize up handler to only refresh layers and push history if a resize actually occurred, preventing unnecessary history entries for clicks that didn't result in size changes. ---
function onResizeUp(e) {
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeUp);
  resizeState = null;
  refreshLayers();
  pushHistory();
}

// --- SHORTCUT KEYS --- Added keyboard shortcuts for tools (V for select, D for draw, T for text). These shortcuts are ignored if an input field is focused to prevent interference with typing. Also ignores shortcuts if Ctrl or Meta key is held to avoid conflicts with browser shortcuts.
window.addEventListener('keydown', (e) => {
  // Ignore key events if an input field is focused
  const isInputFocused = document.activeElement && (document.activeElement.isContentEditable || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
  if (isInputFocused) return;

  // Added for shortcut keys
  if(e.ctrlKey || e.metaKey) return;
  
  switch(e.key.toLowerCase()) {
    case 'v':
      setTool('select');
      break;
    case 'd':
      setTool('draw');
      break;
    case 't':
      setTool('text');
      break;
  }
});

// --- DRAWING STATE ---
let currentPath = null;
let drawing = false;

function isPointInPolygon(point, polygon) {
  let isInside = false;
  const { x, y } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

// --- DRAWING HANDLERS --- Handles pointer down events on the board for drawing and selection. For the draw tool, it supports freehand drawing, straight lines with Shift, and single straight lines with Shift+Alt. For the select tool, it initiates lasso or rectangular selection based on the current selection mode. It also handles text tool interactions, allowing users to create new text boxes or select existing ones. The function ensures that drawing actions do not interfere with selection and vice versa, and it manages the state for straight line drawing, including handling interruptions when switching between straight line and freehand modes. It also prevents selection of underlying elements when interacting with the text tool.
function onBoardPointerDown(e) {
  if (e.button !== 0) return;
  
  // Block immediately if multi-touch (pinch zoom attempt)
  if (e.touches && e.touches.length >= 2) return;
  
  // Prevent any action if pinch zoom is in progress
  if (pinchState) return;
  
  // Prevent any action during grace period after pinch ends
  if (isPinchGracePeriod) return;
  
  const pt = getBoardPointFromEvent(e);
  const x = pt.x, y = pt.y;
  state.pointer.x = x; state.pointer.y = y;

  // --- DRAW TOOL ---
  if (state.tool === 'draw') {

    if (!e.shiftKey) finalizeStrokeGroup();

    if (e.shiftKey) {
      const isSingleLineMode = e.altKey;
      if (straightLineState && straightLineState.isInterrupted && !isSingleLineMode) {
        finalizeStrokeGroup();
        straightLineState = null;
      }

      if (straightLineState && !isSingleLineMode) {
        drawing = true;
        board.setPointerCapture?.(e.pointerId);

        if (state.stroke.rounded) {
          // ROUNDED: keep building up the same single path — do NOT start a new stroke.
          // currentPath / currentStrokeGroup remain active from the previous segment.
          if (!straightLineState.points) {
            straightLineState.points = [
              { x: straightLineState.startX, y: straightLineState.startY }
            ];
          }
          // nothing else needed — pointerMove will preview the full accumulated polyline
        } else {
          // NON-ROUNDED: each segment is its own independent stroke item.
          const startX = straightLineState.lastX ?? straightLineState.startX ?? x;
          const startY = straightLineState.lastY ?? straightLineState.startY ?? y;
          const isSingle = straightLineState.isSingle;
          finalizeStrokeGroup(); // saves previous segment; does NOT clear straightLineState
          currentPath = startStroke(startX, startY, e);
          currentPath.dataset.straightLine = 'true';
          const d = `M ${startX} ${startY} L ${x} ${y}`;
          currentPath.setAttribute('d', d);
          if (currentPath._hitPath) currentPath._hitPath.setAttribute('d', d);
          // Re-establish state so the chain anchor stays correct
          straightLineState = {
            startX, startY, lastX: startX, lastY: startY,
            isSingle, isInterrupted: false,
            points: [{ x: startX, y: startY }]
          };
        }
      } else {
        // Brand-new straight-line chain
        drawing = true;
        board.setPointerCapture?.(e.pointerId);
        finalizeStrokeGroup();
        currentPath = startStroke(x, y, e);
        currentPath.dataset.straightLine = 'true';

        const d = `M ${x} ${y} L ${x} ${y}`;
        currentPath.setAttribute('d', d);
        if (currentPath._hitPath) currentPath._hitPath.setAttribute('d', d);

        straightLineState = {
          startX: x, startY: y, lastX: x, lastY: y,
          isSingle: isSingleLineMode, isInterrupted: false,
          points: [{ x, y }]  // seed for rounded-mode accumulation
        };
      }
    } else {
      // Free-hand drawing
      if (straightLineState) finalizeStrokeGroup();
      straightLineState = null;
      drawing = true;
      board.setPointerCapture?.(e.pointerId);
      
      const wasStartArrow = state.stroke.startArrow;
      const wasEndArrow = state.stroke.endArrow;
      state.stroke.startArrow = false;
      state.stroke.endArrow = false;

      currentPath = startStroke(x, y, e);
      
      // MODIFIED: M x y L x y creates a visible "dot" immediately for free-hand
      const d = `M ${x} ${y} L ${x} ${y}`;
      currentPath.setAttribute('d', d);
      
      // Update hit-path for free-hand dot selection
      const hitPath = currentPath.parentNode ? currentPath.parentNode.querySelector('.stroke-hit') : null;
      if (hitPath) hitPath.setAttribute('d', d);

      state.stroke.startArrow = wasStartArrow;
      state.stroke.endArrow = wasEndArrow;
    }
  }

  // --- TEXT TOOL ---
  else if (state.tool === 'text') {
    const clickedOnTextItem = e.target.closest('.text-item');
    const clickedOnHandle = e.target.closest('.handle');
    const clickedOnOtherItem = e.target.closest('.item, .stroke-wrapper, .stroke, .stroke-hit');

    if (clickedOnHandle) return;

    if (clickedOnTextItem) {
      const wrapper = clickedOnTextItem.closest('.item');
      selectItem(wrapper.dataset.id);
      return;
    }

    if (clickedOnOtherItem) e.stopPropagation();

    const activeText = document.activeElement && document.activeElement.contentEditable === 'true';
    if (activeText) {
      document.activeElement.blur();
      return;
    }

    clearSelection();
    createTextItem('', x, y);
    return;
  }

  // --- SELECT TOOL / OTHER TOOLS ---
  else {
    if (straightLineState) finalizeStrokeGroup();

    const clickedOnItem = e.target.closest('.item, .stroke-wrapper, .stroke, .stroke-hit');

    // Block move logic: if the user clicks inside the bounding box of the current selection, treat it as a group drag.
    if (!clickedOnItem && state.tool === 'select' && state.selectedIds.size > 0) {
      const selBounds = calculateSelectedBounds();
      if (selBounds && pt.x >= selBounds.minX && pt.x <= selBounds.maxX && 
          pt.y >= selBounds.minY && pt.y <= selBounds.maxY) {
        const firstId = state.selectedIds.values().next().value;
        const anchor = findNodeById(firstId);
        if (anchor) {
          startDragHtml(anchor, e);
          return;
        }
      }
    }

    if (!clickedOnItem && state.tool === 'select') {
      if (state.selectionMode === 'lasso') {
        isLassoing = true;
        lassoPoints = [{ x, y }];
        lassoPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        lassoPath.setAttribute('d', `M ${x} ${y}`);
        lassoPath.classList.add('lasso-path');
        el('#guide-layer').appendChild(lassoPath);
        clearSelection();
        refreshLayers();
        board.setPointerCapture?.(e.pointerId);
      } else {
        isSelectingRect = true;
        rectSelectStartX = x;
        rectSelectStartY = y;
        rectSelectPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rectSelectPath.setAttribute('fill', 'rgba(43, 108, 176, 0.08)');
        rectSelectPath.setAttribute('stroke', 'var(--accent)');
        rectSelectPath.setAttribute('stroke-width', '1.5');
        rectSelectPath.setAttribute('x', x);
        rectSelectPath.setAttribute('y', y);
        rectSelectPath.setAttribute('width', '0');
        rectSelectPath.setAttribute('height', '0');
        rectSelectPath.setAttribute('style', 'pointer-events: none;');
        el('#guide-layer').appendChild(rectSelectPath);
        clearSelection();
        refreshLayers();
        board.setPointerCapture?.(e.pointerId);
      }
    } else if (!clickedOnItem) {
      clearSelection();
      refreshLayers();
    }
  }
}

// --- DRAWING POINTER MOVE HANDLER --- 
function onBoardPointerMove(e) {
  // Block immediately if multi-touch (pinch zoom attempt)
  if (e.touches && e.touches.length >= 2) return;
  
  // Prevent drawing/selection during pinch zoom
  if (pinchState) return;
  
  // Prevent drawing/selection during grace period after pinch
  if (isPinchGracePeriod) return;
  
  if (isLassoing) {
    const pt = getBoardPointFromEvent(e);
    const x = pt.x, y = pt.y;
    lassoPoints.push({ x, y });
    lassoPath.setAttribute('d', lassoPath.getAttribute('d') + ` L ${x} ${y}`);
    return;
  }

  if (isSelectingRect) {
    const pt = getBoardPointFromEvent(e);
    const x = pt.x, y = pt.y;
    const width = x - rectSelectStartX;
    const height = y - rectSelectStartY;
    rectSelectPath.setAttribute('x', Math.min(rectSelectStartX, x));
    rectSelectPath.setAttribute('y', Math.min(rectSelectStartY, y));
    rectSelectPath.setAttribute('width', Math.abs(width));
    rectSelectPath.setAttribute('height', Math.abs(height));
    return;
  }

  const guides = document.getElementById('drawing-guides');
  const guideH = document.getElementById('guide-h');
  const guideV = document.getElementById('guide-v');

  if (drawing && currentPath) {
    const pt = getBoardPointFromEvent(e);
    const x = pt.x, y = pt.y;

    if (straightLineState) {
      const anchorX = straightLineState.lastX ?? straightLineState.startX;
      const anchorY = straightLineState.lastY ?? straightLineState.startY;

      // --- GUIDING LINES LOGIC ---
      if (guides && guideH && guideV) {
        guides.style.display = 'block';
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (clientX === undefined && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        if (clientX === undefined) { clientX = 0; clientY = 0; }
        
        // Move the horizontal guide to follow the mouse Y
        guideH.setAttribute('y1', clientY);
        guideH.setAttribute('y2', clientY);
        
        // Move the vertical guide to follow the mouse X
        guideV.setAttribute('x1', clientX);
        guideV.setAttribute('x2', clientX);
      }

      let targetX = x, targetY = y;
      if (e.ctrlKey || e.metaKey) {
        const snapped = snapToAngle(anchorX, anchorY, x, y, 15);
        targetX = snapped.x; targetY = snapped.y;
        
        // Convert snapped board coordinates back to screen coordinates for the guides
        const boardRect = board.getBoundingClientRect();
        const screenSnappedX = targetX * state.scale + boardRect.left;
        const screenSnappedY = targetY * state.scale + boardRect.top;
        
        guideH.setAttribute('y1', screenSnappedY);
        guideH.setAttribute('y2', screenSnappedY);
        guideV.setAttribute('x1', screenSnappedX);
        guideV.setAttribute('x2', screenSnappedX);
      }

      let d;
      if (state.stroke.rounded && straightLineState.points && straightLineState.points.length > 0) {
        // ROUNDED: preview the full accumulated polyline plus the segment-in-progress
        const previewPts = [...straightLineState.points, { x: targetX, y: targetY }];
        d = buildPolylinePath(previewPts, true, 1.5);
      } else {
        // NON-ROUNDED (or first segment): just the current segment
        d = `M ${anchorX} ${anchorY} L ${targetX} ${targetY}`;
      }
      currentPath.setAttribute('d', d);
      if (currentPath._hitPath) currentPath._hitPath.setAttribute('d', d);
    } else {
      if (guides) guides.style.display = 'none';
      currentPath.removeAttribute('marker-start');
      currentPath.removeAttribute('marker-end');
      addPointToPath(currentPath, x, y, e);
    }
  } else {
    if (guides) guides.style.display = 'none';
  }
  onPointerMove(e);
}
function onBoardPointerUp(e){
  // Block if multi-touch (pinch zoom)
  if (e.touches && e.touches.length >= 1) return;
  
  const pt = getBoardPointFromEvent(e);
  const x = pt.x, y = pt.y;
  let didDrawOrLasso = false;

  // --- HIDE GUIDES ---
  const guides = document.getElementById('drawing-guides');
  if (guides) guides.style.display = 'none';

  if (isLassoing) {
    isLassoing = false;
    didDrawOrLasso = true; 
    lassoPath.remove();
    lassoPath = null;
    const boardRect = board.getBoundingClientRect();

    const allItems = board.querySelectorAll('.item');
    clearSelection();
    allItems.forEach(node => {
      const type = node.dataset.type;
      if (type !== 'image' && type !== 'text') return;
      const nRect = node.getBoundingClientRect();
      const itemCenterX = ((nRect.left - boardRect.left) + nRect.width / 2) / state.scale;
      const itemCenterY = ((nRect.top - boardRect.top) + nRect.height / 2) / state.scale;
      const centerPoint = { x: itemCenterX, y: itemCenterY };
      if (isPointInPolygon(centerPoint, lassoPoints)) {
        state.selectedIds.add(node.dataset.id);
        node.classList.add('selected');
      }
    });

    board.querySelectorAll('path.stroke').forEach(p => {
      const pRect = p.getBoundingClientRect();
      const px = ((pRect.left - boardRect.left) + pRect.width / 2) / state.scale;
      const py = ((pRect.top - boardRect.top) + pRect.height / 2) / state.scale;
      const ptCenter = { x: px, y: py };
      if (isPointInPolygon(ptCenter, lassoPoints)) {
        state.selectedIds.add(p.dataset.id);
        p.classList.add('selected');
      }
    });
    lassoPoints = [];
    refreshLayers();
    try { board.releasePointerCapture?.(e.pointerId); } catch(err) {}
  }

  if (isSelectingRect) {
    isSelectingRect = false;
    didDrawOrLasso = true;
    rectSelectPath.remove();
    rectSelectPath = null;
    const boardRect = board.getBoundingClientRect();

    // Calculate actual rect bounds
    const minX = Math.min(rectSelectStartX, x);
    const maxX = Math.max(rectSelectStartX, x);
    const minY = Math.min(rectSelectStartY, y);
    const maxY = Math.max(rectSelectStartY, y);

    const allItems = board.querySelectorAll('.item');
    clearSelection();
    allItems.forEach(node => {
      const type = node.dataset.type;
      if (type !== 'image' && type !== 'text') return;
      const nRect = node.getBoundingClientRect();
      const itemCenterX = ((nRect.left - boardRect.left) + nRect.width / 2) / state.scale;
      const itemCenterY = ((nRect.top - boardRect.top) + nRect.height / 2) / state.scale;
      if (itemCenterX >= minX && itemCenterX <= maxX && itemCenterY >= minY && itemCenterY <= maxY) {
        state.selectedIds.add(node.dataset.id);
        node.classList.add('selected');
      }
    });

    board.querySelectorAll('path.stroke').forEach(p => {
      const pRect = p.getBoundingClientRect();
      const px = ((pRect.left - boardRect.left) + pRect.width / 2) / state.scale;
      const py = ((pRect.top - boardRect.top) + pRect.height / 2) / state.scale;
      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        state.selectedIds.add(p.dataset.id);
        p.classList.add('selected');
      }
    });
    refreshLayers();
    try { board.releasePointerCapture?.(e.pointerId); } catch(err) {}
  }
  
  if(drawing && currentPath){
    drawing = false;
    didDrawOrLasso = true; 
    try { board.releasePointerCapture?.(e.pointerId); } catch(err) {}
    
    if (straightLineState) {
      const anchorX = straightLineState.lastX ?? straightLineState.startX;
      const anchorY = straightLineState.lastY ?? straightLineState.startY;
      let finalX = x, finalY = y;
      
      if (e.ctrlKey || e.metaKey) {
        const snapped = snapToAngle(anchorX, anchorY, x, y, 15);
        finalX = snapped.x; finalY = snapped.y;
      }

      const wasSingle = straightLineState.isSingle;

      if (state.stroke.rounded) {
        // ROUNDED: accumulate all segment endpoints into a single polyline path.
        // Only finalize (save) the whole polyline when the chain ends.
        if (!straightLineState.points) {
          straightLineState.points = [{ x: anchorX, y: anchorY }];
        }
        const lastPt = straightLineState.points[straightLineState.points.length - 1];
        if (!lastPt || lastPt.x !== finalX || lastPt.y !== finalY) {
          straightLineState.points.push({ x: finalX, y: finalY });
        }
        const d = buildPolylinePath(straightLineState.points, true, 1.5);
        currentPath.setAttribute('d', d);
        if (currentPath._hitPath) currentPath._hitPath.setAttribute('d', d);

        if (wasSingle || !e.shiftKey) {
          finalizeStrokeGroup(); // save the whole multi-segment polyline as one item
          straightLineState = null;
        } else {
          // Continue accumulating — keep currentPath alive
          straightLineState.lastX = finalX;
          straightLineState.lastY = finalY;
          straightLineState.isInterrupted = false;
        }
      } else {
        // NON-ROUNDED: finalize this segment as its own independent item.
        const d = `M ${anchorX} ${anchorY} L ${finalX} ${finalY}`;
        currentPath.setAttribute('d', d);
        if (currentPath._hitPath) currentPath._hitPath.setAttribute('d', d);

        finalizeStrokeGroup(); // saves this segment; does NOT clear straightLineState

        if (wasSingle || !e.shiftKey) {
          straightLineState = null;
        } else {
          // Keep the chain alive — update anchor to the freshly placed endpoint
          straightLineState.lastX = finalX;
          straightLineState.lastY = finalY;
          straightLineState.isInterrupted = false;
        }
      }
    } else {
      if (currentPath) addPointToPath(currentPath, x, y, e);
      finalizeStrokeGroup();
      currentPath = null; 
    }
  }

  if (didDrawOrLasso && !isRestoringHistory) {
    pushHistory();
  }
  
  onPointerUp(e); 
}

/* Drag/drop/paste */
board.addEventListener('dragover', (e)=>{ e.preventDefault(); board.style.opacity=0.95; });
board.addEventListener('dragleave', ()=>{ board.style.opacity=1; });
board.addEventListener('drop', (e)=>{
  e.preventDefault(); board.style.opacity=1;
  const items = Array.from(e.dataTransfer.files || []);
  const pt = getBoardPointFromEvent(e);
  const x = pt.x;
  const y = pt.y;
  items.forEach(file=>{
    if(file.type.startsWith('image/')){
      const url = URL.createObjectURL(file);
      // Defer history until image loads to capture final dimensions
      createImageItem(url, x, y, 260, { deferHistory: true });
    }
  });
});

window.addEventListener('paste', (ev)=>{
  if (document.activeElement && document.activeElement.isContentEditable) return;
  const items = ev.clipboardData?.items || [];
  for(const it of items){
    if(it.type.startsWith('image/')){
      const file = it.getAsFile();
      if (!file) continue;
      const url = URL.createObjectURL(file);
      
      let x, y;
      const boardRect = board.getBoundingClientRect();
      const imageWidth = 300; 

      if (lastMouseEvent) {
        let mouseX = lastMouseEvent.clientX;
        let mouseY = lastMouseEvent.clientY;

        // Clamp mouse position to be inside canvas bounds
        const clampedX = Math.max(boardRect.left, Math.min(mouseX, boardRect.right));
        const clampedY = Math.max(boardRect.top, Math.min(mouseY, boardRect.bottom));

        // Convert to board coordinates
        x = (clampedX - boardRect.left) / state.scale;
        y = (clampedY - boardRect.top) / state.scale;

      } else {
        // Fallback to center if no mouse event has been recorded
        const centerX = (boardRect.width / 2) / state.scale;
        const centerY = (boardRect.height / 2) / state.scale;
        x = centerX - 100;
        y = centerY - 80;
      }
      
      // Defer history until image loads to capture final dimensions
      createImageItem(url, x, y, imageWidth, { deferHistory: true });
      setTool('select');
      ev.preventDefault();
      return;
    }
    if(it.type === 'text/plain'){
      it.getAsString(str=>{
        let x, y;
        const boardRect = board.getBoundingClientRect();

        if (lastMouseEvent) {
          let mouseX = lastMouseEvent.clientX;
          let mouseY = lastMouseEvent.clientY;

          // Clamp mouse position to be inside canvas bounds
          const clampedX = Math.max(boardRect.left, Math.min(mouseX, boardRect.right));
          const clampedY = Math.max(boardRect.top, Math.min(mouseY, boardRect.bottom));

          // Convert to board coordinates
          x = (clampedX - boardRect.left) / state.scale;
          y = (clampedY - boardRect.top) / state.scale;

        } else {
          // Fallback to center if no mouse event has been recorded
          const centerX = (boardRect.width / 2) / state.scale;
          const centerY = (boardRect.height / 2) / state.scale;
          x = centerX - 80;
          y = centerY - 20;
        }

        createTextItem(str, x, y, { skipFocus: true });
      });
      ev.preventDefault();
      return;
    }
  }
});


/// --- ITEM INTERACTIONS --- 
function attachItemBehaviors(node){
  node.addEventListener('pointerdown', (e)=>{
    // Only handle left mouse button (button 0) for selection
    if (e.button !== 0) return;
    
    // If we're in draw mode, don't let item handlers run (prevents selection)
    if (state.tool === 'draw') {
      // Let the board handle drawing — but prevent native focus/drag side-effects
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.stopPropagation();

    const addToSelection = e.shiftKey;
    const isAlreadySelected = state.selectedIds.has(node.dataset.id);

    if (isAlreadySelected && addToSelection) {
      state.selectedIds.delete(node.dataset.id);
      node.classList.remove('selected');
      refreshLayers();
      return;
    }

    if (!isAlreadySelected) {
      selectItem(node.dataset.id, addToSelection);
    }
    
    if (state.tool === 'select' || (state.tool === 'text' && (e.ctrlKey || e.metaKey))) {
      startDragHtml(node, e);
    }
  });

  node.addEventListener('dblclick', (e)=>{
    // don't open text edit when drawing
    if (state.tool === 'draw') return;

    if(node.dataset.type === 'text' && !e.ctrlKey){
      const p = node.querySelector('.text-item');
      p.contentEditable = 'true';
      p.focus();
      if (p.innerText !== 'Type...') {
        document.execCommand('selectAll', false, null);
      }
    }
  });
}


/* Delete selected */
function deleteSelected() {
  if (state.selectedIds.size === 0) return;
  isDeleting = true; // <-- SET FLAG
  const ids = Array.from(state.selectedIds);
  ids.forEach(id => {
    const node = findNodeById(id);
    if (!node) return;
    const parentG = node.closest ? node.closest('g') : null;
    const parentWrapper = node.closest ? node.closest('.stroke-wrapper') : null;
    // If it's an individual SVG stroke path, also remove its invisible hit-path if present
    if (node.dataset.type === 'stroke') {
      try {
        if (node._hitPath && node._hitPath.remove) node._hitPath.remove();
        else {
          // fallback: remove adjacent .stroke-hit sibling
          const prev = node.previousSibling;
          const next = node.nextSibling;
          if (prev && prev.classList && prev.classList.contains('stroke-hit')) prev.remove();
          if (next && next.classList && next.classList.contains('stroke-hit')) next.remove();
        }
      } catch (err) { /* ignore */ }
    }
    node.remove(); // This works for both .item and .stroke-wrapper and .stroke path
    if (parentG && parentG.querySelectorAll('.stroke').length === 0 && parentWrapper) {
      parentWrapper.remove();
    }
  });
  clearSelection();
  refreshLayers();
  pushHistory();
  isDeleting = false; // <-- RESET FLAG
}


/* Layers panel */
function collectAllItems(){
  const items = [];
  board.querySelectorAll('.item, .stroke-wrapper').forEach(n=>{
    let title = 'Item';
    if (n.dataset.type === 'image') title = 'Image';
    else if (n.dataset.type === 'text') title = 'Text';
    // FIX: Check for both dataset types defensively
    else if (n.dataset.type === 'stroke-group' || n.dataset.type === 'stroke-wrapper') title = 'Drawing';
    
    items.push({ id: n.dataset.id, type: n.dataset.type, z: parseInt(n.style.zIndex||0), title: title });
  });
  items.sort((a,b)=> (b.z - a.z) || a.id.localeCompare(b.id));
  return items;
}

function refreshLayers(){
  if (!layerList) return; 
  const items = collectAllItems();
  layerList.innerHTML = '';
  items.forEach(it=>{
    const row = document.createElement('div'); row.className='layer-row';
    row.dataset.id = it.id;
    row.innerHTML = `<div class="meta"><div class="dot"></div><div style="font-size:13px">${it.title}</div></div>
      <div class="actions"><button class="small-btn up">↑</button><button class="small-btn down">↓</button></div>`;
    layerList.appendChild(row);
    if (state.selectedIds.has(it.id)) {
      row.style.background = '#e6f1ff'; row.style.borderColor = '#b2d6ff';
    } else {
      row.style.background = '#f7f9fc'; row.style.borderColor = '#eef3fb';
    }
    row.addEventListener('click', (e)=> { selectItem(it.id, e.shiftKey); });
    row.querySelector('.up').addEventListener('click', (e)=>{ e.stopPropagation(); changeZ(it.id, +10); });
    row.querySelector('.down').addEventListener('click', (e)=>{ e.stopPropagation(); changeZ(it.id, -10); });
  });
}

function changeZ(idstr, delta){
  const node = findNodeById(idstr);
  if(!node) return;
  const cur = parseInt(node.style.zIndex||0);
  node.style.zIndex = (cur + delta);
  // reorderSvg(); // No longer needed
  refreshLayers();
}

// function reorderSvg() {} // No longer needed

/* Export/Import .wb (zip) Whiteboard State */
async function exportWhiteboard(){
  const items = [];
  const imageBlobs = [];
  const boardRect = board.getBoundingClientRect();

  // Collect items (images/text)
  for (const n of board.querySelectorAll('.item')) {
    const t = n.dataset.type;
    
    // Get actual positions from inline styles first
    let left = parseFloat(n.style.left);
    let top = parseFloat(n.style.top);
    let width = parseFloat(n.style.width);
    let height = parseFloat(n.style.height);
    
    // If inline styles don't have these values, calculate from element's bounding rect relative to board
    if (isNaN(left) || isNaN(top)) {
      const elemRect = n.getBoundingClientRect();
      if (isNaN(left)) left = (elemRect.left - boardRect.left) / state.scale;
      if (isNaN(top)) top = (elemRect.top - boardRect.top) / state.scale;
    }
    
    if (isNaN(width) || isNaN(height)) {
      if (isNaN(width)) width = n.offsetWidth / state.scale;
      if (isNaN(height)) height = n.offsetHeight / state.scale;
    }
    
    const obj = {
      id: n.dataset.id,
      type: t,
      left: left,
      top: top,
      width: width,
      height: height,
      z: parseInt(n.style.zIndex||0)
    };

    if (t === 'image') {
      const img = n.querySelector('img');
      if (img) {
        try {
          const res = await fetch(img.src);
          const blob = await res.blob();
          const idx = imageBlobs.length;
          imageBlobs.push(blob);
          obj.imageIndex = idx;
          obj.originalSrc = img.src;
          // Save opacity and transform information
          obj.opacity = parseFloat(img.style.opacity || '1');
          obj.transform = img.style.transform || '';
        } catch (err) {
          console.warn('Could not include image in export:', err);
        }
      }
    }

    if (t === 'text') {
      const p = n.querySelector('.text-item');
      obj.text = p?.innerText || '';
      // Capture computed font size to ensure accuracy
      const computedStyle = window.getComputedStyle(p);
      obj.style = {
        bold: p.style.fontWeight === 'bold' || computedStyle.fontWeight === '700' || computedStyle.fontWeight === 'bold',
        italic: p.style.fontStyle === 'italic' || computedStyle.fontStyle === 'italic',
        underline: p.style.textDecoration.includes('underline') || computedStyle.textDecoration.includes('underline'),
        crossed: p.style.textDecoration.includes('line-through') || computedStyle.textDecoration.includes('line-through'),
        color: p.style.color || computedStyle.color,
        backgroundColor: p.style.backgroundColor || computedStyle.backgroundColor,
        fontSize: p.style.fontSize || computedStyle.fontSize,
        textAlign: p.style.textAlign || computedStyle.textAlign,
        fontFamily: p.style.fontFamily || 'inherit'
      };
    }

    items.push(obj);
  }

  // Collect strokes with markers
  board.querySelectorAll('.stroke-wrapper').forEach(svgWrapper => {
    const g = svgWrapper.querySelector('g');
    if (!g) return;
    
    const transform = g.getAttribute('transform') || '';
    const left = parseFloat(svgWrapper.style.left) || 0;
    const top = parseFloat(svgWrapper.style.top) || 0;
    
    const paths = [];
    let g_color = '#111', g_width = 2, arrowSize = null;
    g.querySelectorAll('.stroke').forEach(p => {
      const d = p.getAttribute('d') || '';
      
      // Store path data as-is AND preserve the straightLine tag
      paths.push({ 
        d: d, 
        markerStart: p.getAttribute('marker-start'), 
        markerEnd: p.getAttribute('marker-end'),
        straightLine: p.dataset.straightLine === 'true' // <-- INTEGRATED HERE
      });
      g_color = p.getAttribute('stroke') || g_color;
      g_width = p.getAttribute('stroke-width') || g_width;
      if (p.dataset.arrowSize) arrowSize = p.dataset.arrowSize;
    });

    // collect marker defs if any
    const defs = g.querySelector('defs');
    const markers = [];
    if (defs) {
      defs.querySelectorAll('marker').forEach(m => {
        const shape = m.querySelector('polygon');
        markers.push({ 
          id: m.id, 
          size: m.getAttribute('markerWidth'), 
          color: shape ? shape.getAttribute('fill') : null,
          arrowSize: arrowSize || state.stroke.arrowSize
        });
      });
    }

    // Save transform to reposition the stroke on import
    // Make sure transform is never null or "null" string
    const transformToSave = (transform && transform !== 'null' && typeof transform === 'string' && transform.trim()) ? transform : '';
    items.push({ id: svgWrapper.dataset.id, type: 'stroke-group', z: parseInt(svgWrapper.style.zIndex||0)||0, transform: transformToSave, paths, markers, color: g_color, width: g_width, left, top });
  });

  // Prepare a sanitized copy of state for serialization (convert Set to array, keep primitives)
  const serializableState = Object.assign({}, state);
  serializableState.selectedIds = Array.from(state.selectedIds instanceof Set ? state.selectedIds : []);
  serializableState.pointer = state.pointer || {x:0,y:0};
  const metaBlob = new Blob([JSON.stringify({ version: '1.0', date: new Date().toISOString(), state: serializableState, items, nextZ: state.nextZ }, null, 2)], { type: 'application/json' });

  const zip = new JSZip();
  zip.file('whiteboard.json', metaBlob);
  imageBlobs.forEach((b, i) => zip.file(`images/image-${i}`, b));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  // Format: MBoard_yymmdd_hhmm.wb
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const y = now.getFullYear().toString().slice(-2);
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const fname = `MBoard_${y}${m}${d}_${hh}${mm}.wb`;
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a'); a.href = url; a.download = fname; a.click(); URL.revokeObjectURL(url);
}

async function importWhiteboard(file) {
  const startTime = Date.now();
  const MIN_DELAY = 1000; // Enforce 1 second for professional feel

  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('overlay-hidden');
  }
  document.body.classList.add('is-loading-content');

  try {
    const zip = await JSZip.loadAsync(file);
    const txt = await zip.file('whiteboard.json').async('text');
    const data = JSON.parse(txt);

    // Clear existing
    board.querySelectorAll('.item, .stroke-wrapper').forEach(n => n.remove());
    svg.innerHTML = '';

    // Restore state
    const savedState = data.state || {};
    if (typeof savedState.tool === 'string') state.tool = savedState.tool;
    if (typeof savedState.selectionMode === 'string') state.selectionMode = savedState.selectionMode;
    if (typeof savedState.scale === 'number') state.scale = savedState.scale;
    state.nextZ = data.nextZ || savedState.nextZ || Z_FLOOR + 10;
    state.stroke = Object.assign({}, state.stroke, savedState.stroke || {});
    state.text = Object.assign({}, state.text, savedState.text || {});
    state.pointer = Object.assign({ x: 0, y: 0 }, savedState.pointer || {});
    state.selectedIds = new Set(Array.isArray(savedState.selectedIds) ? savedState.selectedIds : []);

    const importOptions = { skipSelect: true, skipFocus: true, skipRefresh: true, skipHistory: true };

    // Reconstruct items
    for (const it of (data.items || [])) {
      if (it.type === 'image') {
        const imgBlobFile = zip.file(`images/image-${it.imageIndex}`);
        let url = it.originalSrc || '';
        if (imgBlobFile) {
          const b = await imgBlobFile.async('blob');
          url = URL.createObjectURL(b);
        }
        const item = createImageItem(url, it.left ?? 80, it.top ?? 80, it.width ?? 240, {
          ...importOptions, id: it.id, opacity: it.opacity ?? 1
        });
        item.style.zIndex = it.z;
        if (it.height) item.style.height = it.height + 'px';
        const img = item.querySelector('img');
        if (img && it.transform) {
          img.style.transform = it.transform;
        }

      } else if (it.type === 'text') {
        const item = createTextItem(it.text || '', it.left ?? 80, it.top ?? 80, { ...importOptions, id: it.id });
        item.style.zIndex = it.z;
        if (it.width) item.style.width = it.width + 'px';
        if (it.height) item.style.height = it.height + 'px';
        const p = item.querySelector('.text-item');
        if (it.style) {
          p.style.fontWeight = it.style.bold ? 'bold' : 'normal';
          p.style.fontStyle = it.style.italic ? 'italic' : 'normal';
          const td = [];
          if (it.style.underline) td.push('underline');
          if (it.style.crossed) td.push('line-through');
          p.style.textDecoration = td.join(' ');
          if (it.style.color) p.style.color = it.style.color;
          if (it.style.backgroundColor) p.style.backgroundColor = it.style.backgroundColor;
          if (it.style.textAlign) p.style.textAlign = it.style.textAlign;
          if (it.style.fontFamily) p.style.fontFamily = it.style.fontFamily;
        }
        fitText(p, it.width, it.height);

      } else if (it.type === 'stroke-group') {
        // --- RESTORED: Exact, correct stroke logic ---
        const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgWrapper.classList.add('stroke-wrapper');
        svgWrapper.dataset.id = it.id;
        svgWrapper.dataset.type = 'stroke-group';
        svgWrapper.style.zIndex = it.z;
        svgWrapper.style.left = (it.left ?? 0) + 'px';
        svgWrapper.style.top = (it.top ?? 0) + 'px';
        board.appendChild(svgWrapper);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.id = it.id;

        // Restore Arrow Markers
        if (it.markers && it.markers.length) {
          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          it.markers.forEach(m => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            const arrowSize = m.arrowSize || 8;
            marker.id = m.id;
            marker.setAttribute('markerWidth', arrowSize);
            marker.setAttribute('markerHeight', arrowSize);
            marker.setAttribute('refX', arrowSize);
            marker.setAttribute('refY', arrowSize / 2);
            marker.setAttribute('markerUnits', 'strokeWidth');
            marker.setAttribute('orient', 'auto-start-reverse');
            marker.setAttribute('viewBox', `0 0 ${arrowSize * 1.5} ${arrowSize}`);
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', `0,0 ${arrowSize * 1.2},${arrowSize / 2} 0,${arrowSize}`);
            polygon.setAttribute('fill', m.color || '#000');
            marker.appendChild(polygon);
            defs.appendChild(marker);
          });
          g.appendChild(defs);
        }

        g.dataset.type = 'stroke-group-g';
        if (it.transform && it.transform !== 'null' && typeof it.transform === 'string' && it.transform.trim()) {
          g.setAttribute('transform', it.transform);
        }
        svgWrapper.appendChild(g);
        
        (it.paths || []).forEach(p => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.classList.add('stroke');
          path.dataset.type = 'stroke';
          path.dataset.id = id('stroke');
          path.setAttribute('d', p.d);
          path.setAttribute('stroke', it.color);
          path.setAttribute('stroke-width', it.width);
          
          if (p.markerStart) path.setAttribute('marker-start', p.markerStart);
          if (p.markerEnd) path.setAttribute('marker-end', p.markerEnd);
          
          // Restore the straightLine tag onto the dataset
          if (p.straightLine) path.dataset.straightLine = 'true'; // <-- INTEGRATED HERE

          const anyMarker = it.markers && it.markers.length > 0;
          if (anyMarker) {
            path.dataset.arrowSize = it.markers[0].arrowSize || 8;
          }

          g.appendChild(path);
          makePathSelectable(path);
        });
        makeSvgSelectable(g);
      }
    }

    // Finalize Layout
    clearSelection();
    refreshLayers();
    setTool('select');
    updateSelectionModeUI();
    
    // Zoom/Center perfectly behind the scenes
    refitToContent();
    setTimeout(() => refitToContent(), 50);

    // Fade out logic
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_DELAY - elapsedTime);

    setTimeout(() => {
      if (overlay) overlay.classList.add('overlay-hidden');
      document.body.classList.remove('is-loading-content');

      setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
      }, 400);
    }, remainingTime);

    undoStack = [];
    redoStack = [];
    pushHistory();

  } catch (err) {
    console.error('Import failed:', err);
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('is-loading-content');
    alert("Import failed: " + err.message);
  }
}

/* Event wiring */
board.addEventListener('pointerdown', (e) => {
  // Block immediately if this is a touch event with 2+ fingers (potential pinch)
  if (e.pointerType === 'touch' && e.touches && e.touches.length >= 2) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Prevent pointer events during pinch zoom
  if (pinchState && pinchState.isActive) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Prevent drawing/selection during grace period after pinch
  if (isPinchGracePeriod) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  onBoardPointerDown(e);
}, {capture: true});

board.addEventListener('pointermove', (e) => {
  // Block immediately if this is a touch event with 2+ fingers (potential pinch)
  if (e.pointerType === 'touch' && e.touches && e.touches.length >= 2) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Prevent pointer events during pinch zoom
  if (pinchState && pinchState.isActive) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Prevent drawing/selection during grace period after pinch
  if (isPinchGracePeriod) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  onBoardPointerMove(e);
});

board.addEventListener('pointerup', (e) => {
  // Allow pointer up even during pinch
  if (pinchState && pinchState.isActive) return;
  onBoardPointerUp(e);
});

board.addEventListener('pointermove', (e) => {
    if (state.tool === 'draw' && e.shiftKey) {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (clientX === undefined && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        if (clientX === undefined) { clientX = 0; clientY = 0; }
        
        drawingGuides.style.display = 'block';
        guideH.setAttribute('y1', clientY);
        guideH.setAttribute('y2', clientY);
        guideV.setAttribute('x1', clientX);
        guideV.setAttribute('x2', clientX);
    }
});


/* Toolbar wiring */
document.getElementById('tool-select').addEventListener('click', ()=>setTool('select'));
document.getElementById('tool-draw').addEventListener('click', ()=>setTool('draw'));
document.getElementById('tool-text').addEventListener('click', ()=>setTool('text'));

/* Selection mode menu wiring */
const selectModeBtn = document.getElementById('select-mode-btn');
const selectionModeMenu = el('#selection-mode-menu');
const modeItems = document.querySelectorAll('.selection-mode-item');

selectModeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  setTool('select');
  const rect = selectModeBtn.closest('.tool-btn-group').getBoundingClientRect();
  selectionModeMenu.style.left = rect.left + 'px';
  selectionModeMenu.style.top = rect.bottom + 4 + 'px';
  selectionModeMenu.style.display = (selectionModeMenu.style.display === 'block') ? 'none' : 'block';
  selectModeBtn.setAttribute('aria-expanded', selectionModeMenu.style.display === 'block' ? 'true' : 'false');
  el('#stroke-popup').style.display = 'none';
  el('#text-popup').style.display = 'none';
});

modeItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const mode = item.dataset.mode;
    state.selectionMode = mode;
    updateSelectionModeUI();
    setTool('select');
    
    // Close menu
    selectionModeMenu.style.display = 'none';
    selectModeBtn.setAttribute('aria-expanded', 'false');
  });
});

// Function to update UI to match current selection mode
function updateSelectionModeUI() {
  modeItems.forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`.selection-mode-item[data-mode="${state.selectionMode}"]`);
  if (activeItem) activeItem.classList.add('active');
}

// Close menu when clicking outside (similar to other popups)
document.addEventListener('click', (e) => {
  if (!selectModeBtn.contains(e.target) && !selectionModeMenu.contains(e.target)) {
    selectionModeMenu.style.display = 'none';
    selectModeBtn.setAttribute('aria-expanded', 'false');
  }
});

// Undo/Redo wiring
const undoBtnEl = el('#undo-btn'); const redoBtnEl = el('#redo-btn');
if (undoBtnEl) {
  undoBtnEl.addEventListener('pointerdown', () => {
    if (document.activeElement && document.activeElement.classList.contains('text-item')) {
      const wrapper = document.activeElement.closest('.item');
      if (wrapper && wrapper.dataset.isNew === 'true') {
        ignoreNextBlurHistory = true;
      }
    }
  });
  undoBtnEl.addEventListener('click', () => undo());
}
if (redoBtnEl) {
  redoBtnEl.addEventListener('pointerdown', () => {
    if (document.activeElement && document.activeElement.classList.contains('text-item')) {
      const wrapper = document.activeElement.closest('.item');
      if (wrapper && wrapper.dataset.isNew === 'true') {
        ignoreNextBlurHistory = true;
      }
    }
  });
  redoBtnEl.addEventListener('click', () => redo());
}
updateUndoRedoButtons();

/* Zoom controls: apply scale only to the board element (toolbar & footer unaffected) */

function applyScale(){
  // Use CSS zoom so the board's layout/scroll extents adapt to the zoom level.
  // This keeps the toolbar and footer unscaled while the board content scales and scrollbars update.
  board.style.zoom = state.scale;

  // Ensure the board is at least as large as the viewport when zoomed out to avoid large empty margins.
  const wrap = board.parentElement;
  if(wrap){
    const minW = Math.max(board.offsetWidth, Math.ceil(wrap.clientWidth / Math.max(0.0001, state.scale)));
    const minH = Math.max(board.offsetHeight, Math.ceil(wrap.clientHeight / Math.max(0.0001, state.scale)));
    board.style.minWidth = (minW) + 'px';
    board.style.minHeight = (minH) + 'px';
  }

  // --- NEW: Update guides to counteract scaling ---
  const inverseScale = 1 / state.scale;
  if (guideH && guideV) {
    guideH.setAttribute('stroke-width', inverseScale);
    guideV.setAttribute('stroke-width', inverseScale);
    guideH.setAttribute('stroke-dasharray', `${4 * inverseScale} ${2 * inverseScale}`);
    guideV.setAttribute('stroke-dasharray', `${4 * inverseScale} ${2 * inverseScale}`);
  }
}

function setScale(newScale){
  const clamped = Math.min(4, Math.max(0.2, parseFloat(newScale.toFixed(2))));
  state.scale = clamped;
  applyScale();
  updateCustomCursor();
}

const zoomResetBtn = el('#zoom-reset');
const copyPngBtn = el('#copy-png');

// Calculate bounding box of all content on the board
function calculateContentBounds() {
  const boardRect = board.getBoundingClientRect();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasContent = false;

  // Check all items (images, text)
  board.querySelectorAll('.item').forEach(item => {
    hasContent = true;
    const rect = item.getBoundingClientRect();
    const x = (rect.left - boardRect.left) / state.scale;
    const y = (rect.top - boardRect.top) / state.scale;
    const w = rect.width / state.scale;
    const h = rect.height / state.scale;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });

  // Check all stroke wrappers - use getBBox for accurate SVG bounds
  board.querySelectorAll('.stroke-wrapper').forEach(wrapper => {
    // Skip empty wrappers (all strokes deleted)
    const g = wrapper.querySelector('g');
    const paths = g?.querySelectorAll('.stroke');
    if (!paths || paths.length === 0) return;

    try {
      const rect = g.getBoundingClientRect();
      const x = (rect.left - boardRect.left) / state.scale;
      const y = (rect.top - boardRect.top) / state.scale;
      const w = rect.width / state.scale;
      const h = rect.height / state.scale;
      if (w > 0 || h > 0) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
    } catch (e) {
      // Fallback for safety, though getBoundingClientRect is reliable
      const rect = wrapper.getBoundingClientRect();
      const x = (rect.left - boardRect.left) / state.scale;
      const y = (rect.top - boardRect.top) / state.scale;
      const w = rect.width / state.scale;
      const h = rect.height / state.scale;
      if (w > 0 && h > 0) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
    }
  });

  return { hasContent, minX, minY, maxX, maxY };
}

// Calculate the collective bounding box of all currently selected items in board-space coordinates
function calculateSelectedBounds() {
  if (state.selectedIds.size === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const boardRect = board.getBoundingClientRect();

  state.selectedIds.forEach(id => {
    const node = findNodeById(id);
    if (!node) return;
    const rect = node.getBoundingClientRect();
    // Convert screen coordinates to unscaled board coordinates
    const x = (rect.left - boardRect.left) / state.scale;
    const y = (rect.top - boardRect.top) / state.scale;
    const w = rect.width / state.scale;
    const h = rect.height / state.scale;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });
  return { minX, minY, maxX, maxY };
}

// Fit the view to all content on the canvas
function refitToContent() {
  const bounds = calculateContentBounds();
  if (!bounds.hasContent) return;

  const padding = 40; // pixels of padding around content
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  
  const wrap = board.parentElement;
  const viewportWidth = wrap.clientWidth;
  const viewportHeight = wrap.clientHeight;
  
  // Calculate scale to fit content with padding
  const scaleX = (viewportWidth - padding * 2) / contentWidth;
  const scaleY = (viewportHeight - padding * 2) / contentHeight;
  const newScale = Math.min(scaleX, scaleY, 4); // clamp to max 4x
  const finalScale = Math.max(newScale, 0.2); // clamp to min 0.2x
  
  setScale(finalScale);
  
  // Center the content in the viewport
  const scaledContentWidth = contentWidth * finalScale;
  const scaledContentHeight = contentHeight * finalScale;
  const scrollLeft = (bounds.minX * finalScale) - (viewportWidth - scaledContentWidth) / 2;
  const scrollTop = (bounds.minY * finalScale) - (viewportHeight - scaledContentHeight) / 2;
  
  wrap.scrollLeft = Math.max(0, scrollLeft);
  wrap.scrollTop = Math.max(0, scrollTop);
}

// Helper function to trim excess white space from canvas
function trimCanvasWhitespace(canvas, marginPixels = 25) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let minX = canvas.width, minY = canvas.height;
  let maxX = -1, maxY = -1;
  
  // Scan all pixels to find bounds of non-whitish content
  // Using threshold of 230 for RGB to account for anti-aliasing
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      
      // Detect non-whitish pixels (treating anything darker than 230 as content)
      if (a > 200 && (r < 240 || g < 240 || b < 240)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // If no content detected, return original
  if (maxX < 0 || maxY < 0) {
    console.log('No content detected for trimming');
    return canvas;
  }
  
  console.log(`Content bounds: x[${minX},${maxX}] y[${minY},${maxY}]`);
  
  // Add margins
  const left = Math.max(0, minX - marginPixels);
  const top = Math.max(0, minY - marginPixels);
  const right = Math.min(canvas.width - 1, maxX + marginPixels);
  const bottom = Math.min(canvas.height - 1, maxY + marginPixels);
  
  const trimWidth = right - left + 1;
  const trimHeight = bottom - top + 1;
  
  console.log(`Trimming to: ${trimWidth}x${trimHeight} from ${canvas.width}x${canvas.height}`);
  
  // Create trimmed canvas
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimWidth;
  trimmedCanvas.height = trimHeight;
  const trimCtx = trimmedCanvas.getContext('2d');
  
  // Copy the trimmed portion
  trimCtx.drawImage(canvas, left, top, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);
  
  return trimmedCanvas;
}

// Copy board content as PNG to clipboard - captures only the content area dynamically sized
async function copyContentAsPNG() {
  // 1. Deselect everything before copying
  clearSelection();

  const bounds = calculateContentBounds();
  if (!bounds.hasContent) {
    console.log('No content to copy');
    return;
  }

  try {
    // 2. Save current state
    const originalScale = state.scale;
    const wrap = board.parentElement;
    const originalScrollLeft = wrap.scrollLeft;
    const originalScrollTop = wrap.scrollTop;

    // 3. Reset zoom to 1:1 for a crisp capture
    // This ensures coordinate calculations match pixel values
    setScale(1); 
    await new Promise(resolve => setTimeout(resolve, 50));

    // 4. Calculate dimensions with padding
    const padding = 30;
    const contentX = Math.max(0, bounds.minX - padding);
    const contentY = Math.max(0, bounds.minY - padding);
    const contentWidth = (bounds.maxX - bounds.minX) + (padding * 2);
    const contentHeight = (bounds.maxY - bounds.minY) + (padding * 2);

    // 5. Capture directly from the board using cropping options
    // This is much more reliable than cloning and moving to -9999px
    const canvas = await html2canvas(board, {
      scale: 2, // High DPI export
      backgroundColor: '#ffffff', // Force white background
      useCORS: true,
      
      // These 4 lines are the "Crop" logic:
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      
      // Ensure the "window" size doesn't clip the capture
      windowWidth: board.scrollWidth,
      windowHeight: board.scrollHeight
    });

    // 6. Restore original view
    setScale(originalScale);
    wrap.scrollLeft = originalScrollLeft;
    wrap.scrollTop = originalScrollTop;

    // 7. Copy to clipboard
    canvas.toBlob(async (blob) => {
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        
        const feedback = document.querySelector('#copy-feedback');
        if (feedback) {
          feedback.classList.remove('show');
          void feedback.offsetHeight; // Trigger reflow
          feedback.classList.add('show');
        }
      } catch (err) {
        console.error('Clipboard error:', err);
      }
    }, 'image/png');

  } catch (err) {
    console.error('Export failed:', err);
  }
}

if(zoomResetBtn) zoomResetBtn.addEventListener('click', refitToContent);
if(copyPngBtn) copyPngBtn.addEventListener('click', copyContentAsPNG);

// Ctrl + mouse wheel zoom. Attach to board's scrollable wrapper so we can adjust scroll to keep cursor point stable.
const boardWrap = board.parentElement; // .board-wrap
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartScrollX = 0;
let panStartScrollY = 0;

boardWrap.addEventListener('wheel', (e)=>{
  if (!e.ctrlKey && !e.metaKey) return; // only when Ctrl or Cmd is pressed
  e.preventDefault();

  const rect = board.getBoundingClientRect();
  const oldScale = state.scale;

  // Point in board-space before zoom
  const bx = (e.clientX - rect.left) / oldScale;
  const by = (e.clientY - rect.top) / oldScale;

  // Zoom step based on wheel deltaY (normalize for typical mouse)
  const delta = -Math.sign(e.deltaY);
  const factor = delta > 0 ? 1.12 : 0.88;
  const rawNewScale = Math.min(4, Math.max(0.2, oldScale * factor));
  
  setScale(rawNewScale);
  const newScale = state.scale;

  // Adjust scroll synchronously to keep the point (bx, by) stationary
  const dx = bx * (newScale - oldScale);
  const dy = by * (newScale - oldScale);
  boardWrap.scrollLeft += dx;
  boardWrap.scrollTop += dy;
  
  // Update cursor and guides position after layout updates via requestAnimationFrame
  requestAnimationFrame(() => {
    updateGuidelinesAndCursor();
  });
});

// Pinch-to-zoom support for touch devices (Android, iOS, tablets, phones)
let lastTouchDistance = 0;
let pinchState = null;
let pinchGracePeriodTimeout = null;
let isPinchGracePeriod = false; // Grace period flag to ignore drawing after pinch

boardWrap.addEventListener('touchstart', (e) => {
  // Clear any active grace period when a new touch starts
  if (pinchGracePeriodTimeout) {
    clearTimeout(pinchGracePeriodTimeout);
    pinchGracePeriodTimeout = null;
  }
  isPinchGracePeriod = false;
  
  if (e.touches.length === 2) {
    // Prevent any interference from other handlers during pinch
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any active drawing/selection state
    if (drawing) {
      drawing = false;
      finalizeStrokeGroup();
    }
    if (isLassoing || isSelectingRect) {
      isLassoing = false;
      isSelectingRect = false;
      clearSelection();
    }
    
    // Calculate initial distance between two touch points
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Store pinch center point for focal zooming
    pinchState = {
      initialScale: state.scale,
      currentScale: state.scale,
      centerX: (touch1.clientX + touch2.clientX) / 2,
      centerY: (touch1.clientY + touch2.clientY) / 2,
      lastDistance: lastTouchDistance,
      isActive: true
    };
  }
}, { passive: false });

boardWrap.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && pinchState && pinchState.isActive) {
    // Prevent any interference from other handlers during pinch
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate current distance between two touch points
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Update pinch center point to current position of the two fingers
    pinchState.centerX = (touch1.clientX + touch2.clientX) / 2;
    pinchState.centerY = (touch1.clientY + touch2.clientY) / 2;
    
    if (pinchState.lastDistance > 0) {
      // Calculate zoom factor based on incremental distance change
      const distanceRatio = currentDistance / pinchState.lastDistance;
      const oldScale = pinchState.currentScale;
      const rawNewScale = Math.min(4, Math.max(0.2, oldScale * distanceRatio));
      
      // Get board position and calculate focal point in board-space
      const rect = board.getBoundingClientRect();
      const bx = (pinchState.centerX - rect.left) / oldScale;
      const by = (pinchState.centerY - rect.top) / oldScale;
      
      // Apply the zoom
      setScale(rawNewScale);
      const newScale = state.scale;
      
      // Adjust scroll to keep pinch center point stationary
      const scrollAdjX = bx * (newScale - oldScale);
      const scrollAdjY = by * (newScale - oldScale);
      boardWrap.scrollLeft += scrollAdjX;
      boardWrap.scrollTop += scrollAdjY;
      
      // Update state for next frame
      pinchState.currentScale = newScale;
      pinchState.lastDistance = currentDistance;
      
      // Update cursor and guides position after layout updates
      requestAnimationFrame(() => {
        updateGuidelinesAndCursor();
      });
    }
  }
}, { passive: false });

boardWrap.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) {
    // Properly cleanup pinch state
    if (pinchState) {
      e.preventDefault();
      e.stopPropagation();
      
      // Start grace period to prevent drawing/selection right after pinch ends
      isPinchGracePeriod = true;
      if (pinchGracePeriodTimeout) clearTimeout(pinchGracePeriodTimeout);
      pinchGracePeriodTimeout = setTimeout(() => {
        isPinchGracePeriod = false;
        pinchGracePeriodTimeout = null;
      }, 200); // 200ms grace period
    }
    lastTouchDistance = 0;
    pinchState = null;
  }
}, { passive: false });

boardWrap.addEventListener('touchcancel', (e) => {
  // Cancel pinch if touch is interrupted
  lastTouchDistance = 0;
  pinchState = null;
  // Clear grace period on cancel
  if (pinchGracePeriodTimeout) {
    clearTimeout(pinchGracePeriodTimeout);
    pinchGracePeriodTimeout = null;
  }
  isPinchGracePeriod = false;
}, { passive: false });

boardWrap.addEventListener('pointerenter', (e) => {
  if (!isPanning) {
    lastMouseEvent = e;
    // Set cursor based on current tool
    if (state.tool === 'draw') {
      board.style.cursor = 'none';
      const customCursor = el('#custom-cursor');
      if (customCursor) {
        updateCustomCursorPosition();
        customCursor.style.display = 'block';
      }
    } else if (state.tool === 'text') {
      board.style.cursor = 'text';
    } else {
      board.style.cursor = 'default';
    }
  }
});

// Middle mouse button (button 1) panning - use capture phase to intercept before item handlers
boardWrap.addEventListener('pointerdown', (e) => {
  if (e.button === 1) { // middle mouse button
    e.preventDefault();
    e.stopPropagation();
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartScrollX = boardWrap.scrollLeft;
    panStartScrollY = boardWrap.scrollTop;
    // Show grabbing cursor by setting it on board element
    if (state.tool === 'draw') {
      board.style.cursor = 'grabbing';
      // Hide custom draw cursor during panning
      const customCursor = el('#custom-cursor');
      if (customCursor) customCursor.style.display = 'none';
    } else {
      board.style.cursor = 'grabbing';
    }
    // Deactivate selection during panning
    clearSelection();
  }
}, true); // capture phase

boardWrap.addEventListener('pointermove', (e) => {
  if (!isPanning) return;
  
  const dx = e.clientX - panStartX;
  const dy = e.clientY - panStartY;
  
  boardWrap.scrollLeft = panStartScrollX - dx;
  boardWrap.scrollTop = panStartScrollY - dy;
});

boardWrap.addEventListener('pointerup', (e) => {
  if (isPanning) {
    isPanning = false;
    // Restore appropriate cursor based on tool
    if (state.tool === 'draw') {
      board.style.cursor = 'none';
      // Show custom draw cursor again
      const customCursor = el('#custom-cursor');
      if (customCursor) customCursor.style.display = 'block';
    } else if (state.tool === 'text') {
      board.style.cursor = 'text';
    } else {
      board.style.cursor = 'default';
    }
  }
});

boardWrap.addEventListener('pointerleave', (e) => {
  if (isPanning) {
    isPanning = false;
  }
  board.style.cursor = 'default';
  if (!drawing) {
    const customCursor = el('#custom-cursor');
    if (customCursor) customCursor.style.display = 'none';
    const guides = document.getElementById('drawing-guides');
    if (guides) guides.style.display = 'none';
  }
});

document.addEventListener('mouseleave', () => {
  if (!drawing) {
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) customCursor.style.display = 'none';
    const guides = document.getElementById('drawing-guides');
    if (guides) guides.style.display = 'none';
  }
});

// Update cursor position when scrolling (includes wheel, shift+wheel, and middle-click pan)
boardWrap.addEventListener('scroll', (e) => {
  requestAnimationFrame(() => {
    updateGuidelinesAndCursor();
  });
}, { passive: true });

// --- Stroke Popup Wiring ---
const strokePopup = el('#stroke-popup');
const strokeSettingsBtn = el('#stroke-settings');
const strokeColorInput = el('#stroke-color');
const strokeWidthInput = el('#stroke-width');
const strokeWidthLabel = el('#stroke-width-label');

strokeSettingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  setTool('stroke-settings');
  const rect = strokeSettingsBtn.closest('.tool-btn-group').getBoundingClientRect();
  strokePopup.style.left = rect.left + 'px';
  strokePopup.style.top = rect.bottom + 4 + 'px';
  strokePopup.style.display = (strokePopup.style.display === 'block') ? 'none' : 'block';
  el('#text-popup').style.display = 'none';
  el('#selection-mode-menu').style.display = 'none';
});
strokeColorInput.addEventListener('input', (e) => { state.stroke.color = e.target.value; });
strokeWidthInput.addEventListener('input', (e) => {
  const sliderPos = parseFloat(e.target.value);
  const width = sliderToWidth(sliderPos).toFixed(1);
  state.stroke.width = width;
  strokeWidthLabel.innerText = width;
});
strokeColorInput.value = state.stroke.color;
strokeWidthInput.value = widthToSlider(state.stroke.width);
strokeWidthLabel.innerText = state.stroke.width;

// --- Stroke toolbar wiring (top-bar quick controls) ---
// Convert linear slider value (0-100) to logarithmic width (1-25) with 0.5 increments
function sliderToWidth(sliderVal) {
  const rawWidth = Math.exp((sliderVal / 100) * Math.log(25));
  // Quantize to nearest 0.5
  return Math.round(rawWidth * 2) / 2;
}
// Convert width (1-25) to linear slider value (0-100)
function widthToSlider(width) {
  return (Math.log(width) / Math.log(25)) * 100;
}

const toolbarStroke = el('#stroke-toolbar');
const toolbarStrokeSlider = el('#toolbar-stroke-width');
const toolbarStrokeValue = el('#toolbar-stroke-value');
const toolbarStrokePreview = el('#stroke-width-preview');
const quickStrokeColors = el('#quick-stroke-colors');
const quickStartArrow = el('#quick-start-arrow');
const quickEndArrow = el('#quick-end-arrow'); // <-- NEW: Quick arrow ref

function updateToolbarStrokeUI(){
  if(!toolbarStroke) return;
  const targetSliderPos = widthToSlider(state.stroke.width);
  if (toolbarStrokeSlider.value != targetSliderPos) toolbarStrokeSlider.value = targetSliderPos;
  const widthStr = parseFloat(state.stroke.width).toFixed(1);
  if (toolbarStrokeValue.textContent !== widthStr) toolbarStrokeValue.textContent = widthStr;
  const line = toolbarStrokePreview.querySelector('line');
  if(line){
    const currentWidth = line.getAttribute('stroke-width');
    const currentColor = line.getAttribute('stroke');
    if (currentWidth !== state.stroke.width) line.setAttribute('stroke-width', state.stroke.width);
    if (currentColor !== state.stroke.color) line.setAttribute('stroke', state.stroke.color);
  }
  // update active color button
  if(quickStrokeColors){
    const mainBtn = quickStrokeColors.querySelector('#quick-stroke-colors-main');
    const dropdownButtons = Array.from(quickStrokeColors.querySelectorAll('.quick-stroke-colors-dropdown button'));
    // Update main button background
    if(mainBtn) mainBtn.style.background = state.stroke.color;
    // Update active state for dropdown buttons
    dropdownButtons.forEach(b=>{
      const isActive = b.dataset.color === state.stroke.color;
      if (b.classList.contains('active') !== isActive) {
        b.classList.toggle('active', isActive);
      }
      // add subtle outline when active
      b.style.boxShadow = isActive ? 'inset 0 0 0 2px rgba(255,255,255,0.12)' : '';
    });
  }
  // <-- NEW: Sync quick arrow checkbox -->
  if(quickStartArrow) {
    if (quickStartArrow.classList.contains('active') !== state.stroke.startArrow) {
      quickStartArrow.classList.toggle('active', state.stroke.startArrow);
    }
  }
  if(quickEndArrow) {
    if (quickEndArrow.classList.contains('active') !== state.stroke.endArrow) {
      quickEndArrow.classList.toggle('active', state.stroke.endArrow);
    }
  }
  // Sync rounded corners button
  const quickRoundedBtn = el('#quick-rounded-lines');
  if(quickRoundedBtn) {
    if (quickRoundedBtn.classList.contains('active') !== state.stroke.rounded) {
      quickRoundedBtn.classList.toggle('active', state.stroke.rounded);
    }
  }
  // Sync circle transform button
  const quickCircleBtnSync = el('#quick-circle-transform');
  if(quickCircleBtnSync) {
    if (quickCircleBtnSync.classList.contains('active') !== state.stroke.circleTransform) {
      quickCircleBtnSync.classList.toggle('active', state.stroke.circleTransform);
    }
  }
}

// --- Text toolbar wiring ---
const toolbarText = el('#text-toolbar');
const toolbarTextBgAlpha = el('#toolbar-text-bg-alpha');
const toolbarTextBgAlphaValue = el('#toolbar-text-bg-alpha-value');
const quickTextStyles = el('#quick-text-styles');

function updateToolbarTextUI(){
  if(!toolbarText) return;
  // bg alpha
  const a = (typeof state.text.bgAlpha === 'number') ? state.text.bgAlpha : 0;
  // Multiply by 100 for the 0-100 slider
  if(toolbarTextBgAlpha && toolbarTextBgAlpha.value !== (a * 100)) toolbarTextBgAlpha.value = a * 100;
  
  // Format as percentage string
  const alphaStr = Math.round(a * 100) + '%';
  if(toolbarTextBgAlphaValue && toolbarTextBgAlphaValue.textContent !== alphaStr) toolbarTextBgAlphaValue.textContent = alphaStr;
  // styles
  if(quickTextStyles){
    quickTextStyles.querySelectorAll('button').forEach(b=>{
      let shouldBeActive = false;
      if(b.id === 'tb-text-bold') shouldBeActive = state.text.bold;
      else if(b.id === 'tb-text-italic') shouldBeActive = state.text.italic;
      else if(b.id === 'tb-text-underline') shouldBeActive = state.text.underline;
      else if(b.id === 'tb-text-crossed') shouldBeActive = state.text.crossed;
      
      if (b.classList.contains('active') !== shouldBeActive) {
        b.classList.toggle('active', shouldBeActive);
      }
      // set aria-pressed for accessibility
      const ariaVal = shouldBeActive ? 'true' : 'false';
      if (b.getAttribute('aria-pressed') !== ariaVal) {
        b.setAttribute('aria-pressed', ariaVal);
      }
    });
  }
}

if(toolbarTextBgAlpha){
  toolbarTextBgAlpha.addEventListener('pointerdown', (e)=>{ startSliderHistory(); });
  toolbarTextBgAlpha.addEventListener('input', (e)=>{
    const sliderVal = parseFloat(e.target.value);
    const v = sliderVal / 100; // Convert 0-100 back to 0-1 for the state
    state.text.bgAlpha = v;
    
    if(toolbarTextBgAlphaValue) toolbarTextBgAlphaValue.textContent = Math.round(sliderVal) + '%';

    state.selectedIds.forEach(id => {
      const node = findNodeById(id);
      if(node && node.dataset.type === 'text'){
        const td = node.querySelector('.text-item'); if(td){ const rgb = hexToRgb(state.text.bgColor); td.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.text.bgAlpha})`; }
      }
    });
  });
  toolbarTextBgAlpha.addEventListener('change', ()=>{ endSliderHistory(); });
}

if(quickTextStyles){
  const map = { 'tb-text-bold': 'bold', 'tb-text-italic': 'italic', 'tb-text-underline': 'underline', 'tb-text-crossed': 'crossed' };
  quickTextStyles.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const key = map[b.id];
      state.text[key] = !state.text[key];
      updateTextPopupUI();
      applyTextSettingsToSelection();
      updateToolbarTextUI();
      pushHistory();
    });
  });
}

// Live update while dragging: update state and preview but don't record history until change event
if(toolbarStrokeSlider){
  // MODIFICATION: Removed history tracking from tool setting
  // toolbarStrokeSlider.addEventListener('pointerdown', (e)=>{ startSliderHistory(); });
  toolbarStrokeSlider.addEventListener('input', (e)=>{
    const sliderPos = parseFloat(e.target.value);
    const v = sliderToWidth(sliderPos);
    state.stroke.width = v;
    toolbarStrokeValue.textContent = v.toFixed(1);
    const line = toolbarStrokePreview.querySelector('line'); if(line){ line.setAttribute('stroke-width', v); }
    // keep popup in sync
    strokeWidthInput.value = v;
    strokeWidthLabel.innerText = v.toFixed(1);
    updateCustomCursor();
  });
  toolbarStrokeSlider.addEventListener('change', (e)=>{
    // MODIFICATION: Removed history tracking from tool setting
    // endSliderHistory();
  });
}

// Quick color buttons (including dropdown)
if(quickStrokeColors){
  const mainBtn = quickStrokeColors.querySelector('#quick-stroke-colors-main');
  const dropdownButtons = Array.from(quickStrokeColors.querySelectorAll('.quick-stroke-colors-dropdown button'));
  const dropdownContainer = quickStrokeColors.querySelector('.quick-stroke-colors-dropdown');
  
  // Toggle dropdown on main button click
  if(mainBtn) {
    mainBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isHidden = dropdownContainer.style.display === 'none';
      dropdownContainer.style.display = isHidden ? 'flex' : 'none';
    });
  }
  
  // Handle color selection
  let dropdownHideTimeout;
  
  dropdownButtons.forEach(b=>{
    b.addEventListener('click', (ev)=>{
      const color = b.dataset.color;
      state.stroke.color = color;
      strokeColorInput.value = color;
      // update main button background
      if(mainBtn) mainBtn.style.background = color;
      // update preview
      const line = toolbarStrokePreview.querySelector('line'); if(line){ line.setAttribute('stroke', color); }
      // mark active
      dropdownButtons.forEach(x=> x.classList.remove('active'));
      b.classList.add('active');
      updateCustomCursor();
      // Close dropdown
      dropdownContainer.style.display = 'none';
      if(dropdownHideTimeout) clearTimeout(dropdownHideTimeout);
      // MODIFICATION: Removed history tracking from tool setting
      // pushHistory();
    });
  });
  
  // Add delay before hiding dropdown on mouseleave
  quickStrokeColors.addEventListener('mouseleave', () => {
    dropdownHideTimeout = setTimeout(() => {
      dropdownContainer.style.display = 'none';
    }, 400);
  });
  
  // Clear timeout on mouseenter to prevent hiding
  quickStrokeColors.addEventListener('mouseenter', () => {
    if(dropdownHideTimeout) clearTimeout(dropdownHideTimeout);
    // Show dropdown on hover
    dropdownContainer.style.display = 'grid';
  });
}

// Quick arrow toggles
if (quickStartArrow) {
  quickStartArrow.addEventListener('click', () => {
    const isActive = quickStartArrow.classList.toggle('active');
    state.stroke.startArrow = isActive;
    // Sync with the popup
    const popupStartArrow = el('#start-arrow');
    if (popupStartArrow) popupStartArrow.checked = isActive;
  });
}
if (quickEndArrow) {
  quickEndArrow.addEventListener('click', () => {
    const isActive = quickEndArrow.classList.toggle('active');
    state.stroke.endArrow = isActive;
    // Sync with the popup
    const popupEndArrow = el('#end-arrow');
    if (popupEndArrow) popupEndArrow.checked = isActive;
  });
}

// Stroke popup controls
strokeColorInput.addEventListener('input', (e) => { state.stroke.color = e.target.value; updateToolbarStrokeUI(); updateCustomCursor(); });
if(strokeWidthInput){
  // MODIFICATION: Removed history tracking from tool setting
  // strokeWidthInput.addEventListener('pointerdown', ()=>{ startSliderHistory(); });
  strokeWidthInput.addEventListener('input', (e) => {
    const sliderPos = parseFloat(e.target.value);
    const width = sliderToWidth(sliderPos);
    state.stroke.width = width;
    strokeWidthLabel.innerText = width.toFixed(1);
    updateToolbarStrokeUI();
    updateCustomCursor();
  });
  // MODIFICATION: Removed history tracking from tool setting
  // strokeWidthInput.addEventListener('change', ()=> endSliderHistory());
}
// MODIFICATION: Removed history tracking from tool setting
// strokeColorInput.addEventListener('change', ()=> pushHistory());
// initialize toolbar UI
updateToolbarStrokeUI();

// Arrow controls
const startArrowInput = el('#start-arrow');
const endArrowInput = el('#end-arrow');
const arrowSizeInput = el('#arrow-size');
const arrowSizeLabel = el('#arrow-size-label');

startArrowInput.addEventListener('change', (e) => {
  state.stroke.startArrow = e.target.checked;
  if (quickStartArrow) quickStartArrow.classList.toggle('active', e.target.checked);
});
endArrowInput.addEventListener('change', (e) => {
  state.stroke.endArrow = e.target.checked;
  // <-- NEW: Sync to quick toggle
  if (quickEndArrow) quickEndArrow.classList.toggle('active', e.target.checked);
});
if(arrowSizeInput){
  // MODIFICATION: Removed history tracking from tool setting
  // arrowSizeInput.addEventListener('pointerdown', ()=>{ startSliderHistory(); });
  arrowSizeInput.addEventListener('input', (e) => {
    state.stroke.arrowSize = parseInt(e.target.value);
    arrowSizeLabel.innerText = e.target.value;
  });
  // MODIFICATION: Removed history tracking from tool setting
  // arrowSizeInput.addEventListener('change', ()=>{ endSliderHistory(); });
}

// Initialize arrow controls based on state
startArrowInput.checked = state.stroke.startArrow;
endArrowInput.checked = state.stroke.endArrow;
arrowSizeInput.value = state.stroke.arrowSize;
arrowSizeLabel.innerText = state.stroke.arrowSize;

// Rounded corners control
const roundedLinesInput = el('#rounded-lines');
if (roundedLinesInput) {
  roundedLinesInput.addEventListener('change', (e) => {
    state.stroke.rounded = e.target.checked;
    const quickRoundedBtn = el('#quick-rounded-lines');
    if (quickRoundedBtn) quickRoundedBtn.classList.toggle('active', e.target.checked);
  });
  roundedLinesInput.checked = state.stroke.rounded;
}

// <-- Quick toggle for rounded corners -->
const quickRoundedBtn = el('#quick-rounded-lines');
if (quickRoundedBtn) {
  quickRoundedBtn.addEventListener('click', (e) => {
    state.stroke.rounded = !state.stroke.rounded;
    if (roundedLinesInput) roundedLinesInput.checked = state.stroke.rounded;
    quickRoundedBtn.classList.toggle('active', state.stroke.rounded);
  });
}

// Circle transform control
const circleTransformInput = el('#circle-transform');
if (circleTransformInput) {
  circleTransformInput.addEventListener('change', (e) => {
    state.stroke.circleTransform = e.target.checked;
    const quickCircleBtn = el('#quick-circle-transform');
    if (quickCircleBtn) quickCircleBtn.classList.toggle('active', e.target.checked);
  });
  circleTransformInput.checked = state.stroke.circleTransform || false;
}

// Global toggle state
// Function to synchronize the UI elements with the state
function syncCircleTransformUI() {
  const quickCircleBtn = el('#quick-circle-transform');
  const circleTransformInput = el('#circle-transform');

  if (quickCircleBtn) {
    quickCircleBtn.classList.toggle('active', state.stroke.circleTransform);
  }
  if (circleTransformInput) {
    circleTransformInput.checked = state.stroke.circleTransform;
  }
}

if (circleTransformInput) {
  circleTransformInput.addEventListener('change', (e) => {
    state.stroke.circleTransform = e.target.checked;
    syncCircleTransformUI(); // Sync quick action button
    if (state.stroke.circleTransform && state.selectedIds.size > 0) {
      applyCircleTransformToSelected();
      clearSelection();
    }
  });
}

/**
 * NEW: The "Magic" function. 
 * We need to call this whenever a stroke is finished.
 */
function transformToCircle(path) {
    if (!path) return;
    
    const length = path.getTotalLength();
    if (length < 5) return; // Ignore dots

    // 1. Sample points
    const numSamples = Math.max(15, Math.min(60, Math.floor(length / 4)));
    let sumX = 0, sumY = 0;
    const points = [];
    for (let i = 0; i < numSamples; i++) {
        const pt = path.getPointAtLength((i / numSamples) * length);
        points.push(pt);
        sumX += pt.x; sumY += pt.y;
    }

    // 2. Calculate Center (Centroid)
    const cx = sumX / numSamples;
    const cy = sumY / numSamples;

    // 3. Calculate Average Radius
    let sumR = 0;
    for (const pt of points) {
        sumR += Math.hypot(pt.x - cx, pt.y - cy);
    }
    const r = Math.max(1, sumR / numSamples);

    // 4. Create Circle Path Data
    const newD = `M ${cx.toFixed(1)} ${(cy - r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${cx.toFixed(1)} ${(cy + r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${cx.toFixed(1)} ${(cy - r).toFixed(1)}`;
    
    // 5. Update Path and Hitbox
    path.setAttribute('d', newD);
    const hitPath = path.parentNode.querySelector('.stroke-hit');
    if (hitPath) hitPath.setAttribute('d', newD);
}

// Helper to handle existing selection
function applyCircleTransformToSelected() {
    state.selectedIds.forEach(id => {
        const node = findNodeById(id);
        if (node) {
            const paths = node.querySelectorAll('path.stroke');
            paths.forEach(p => {
                // Ignore paths drawn with SHIFT
                if (p.dataset.straightLine !== 'true') {
                    transformToCircle(p);
                }
            });
        }
    });
    pushHistory();
}

/**
 * INTEGRATION: Improved Hook
 */
const originalFinalize = finalizeStrokeGroup;
finalizeStrokeGroup = function() {
    // 1. Keep a reference to the stroke we are currently finishing
    // In your index.html, 'currentStrokeGroup' is the <g> being drawn
    const targetStroke = currentStrokeGroup;

    // 2. Run the original code (this attaches the stroke to the board)
    originalFinalize.apply(this, arguments);

    // 3. Transform ONLY the stroke that was just finished, 
    // and only if the mode is active.
    if (state.stroke.circleTransform && targetStroke) {
      const paths = targetStroke.querySelectorAll('path.stroke');
      paths.forEach(p => {
          // Ignore paths drawn with SHIFT
          if (p.dataset.straightLine !== 'true') {
              transformToCircle(p);
          }
      });
        
      // Push to history after transformation so 'Undo' works correctly
      pushHistory(); 
    }

    // Optional: Clear selection to prevent the "red" highlight 
    // from interfering with the next drawing
    clearSelection();
};

const quickCircleBtn = document.getElementById('quick-circle-transform');

if (quickCircleBtn) {
    quickCircleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        state.stroke.circleTransform = !state.stroke.circleTransform;
        syncCircleTransformUI(); // Sync popup toggle

        if (state.stroke.circleTransform && state.selectedIds.size > 0) {
            applyCircleTransformToSelected();
            clearSelection();
        }
    });
};

// --- Text Popup Wiring ---
const textPopup = el('#text-popup');
const textSettingsBtn = el('#text-settings');
const textBoldBtn = el('#text-bold');
const textItalicBtn = el('#text-italic');
const textUnderlineBtn = el('#text-underline');
const textColorInput = el('#text-color');
const textBgColorInput = el('#text-bg-color');
const textBgAlphaInput = el('#text-bg-alpha');
const textBgAlphaLabel = el('#text-bg-alpha-label');

textSettingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  setTool('text-settings');
  const rect = textSettingsBtn.closest('.tool-btn-group').getBoundingClientRect();
  textPopup.style.left = rect.left + 'px';
  textPopup.style.top = rect.bottom + 4 + 'px';
  textPopup.style.display = (textPopup.style.display === 'block') ? 'none' : 'block';
  el('#stroke-popup').style.display = 'none';
  el('#selection-mode-menu').style.display = 'none';
  // Sync popup UI with current state when opening
  if (textPopup.style.display === 'block') updateTextPopupUI();
});


// Update text popup buttons based on current state (called when opening popup and when state changes via toolbar)
function updateTextPopupUI() {
  if (textBoldBtn.classList.contains('active') !== state.text.bold) textBoldBtn.classList.toggle('active', state.text.bold);
  if (textItalicBtn.classList.contains('active') !== state.text.italic) textItalicBtn.classList.toggle('active', state.text.italic);
  if (textUnderlineBtn.classList.contains('active') !== state.text.underline) textUnderlineBtn.classList.toggle('active', state.text.underline);
  // crossed/strikethrough
  const textCrossedBtn = el('#text-crossed');
  if(textCrossedBtn && textCrossedBtn.classList.contains('active') !== state.text.crossed) {
    textCrossedBtn.classList.toggle('active', state.text.crossed);
  }
  
  // --- Handle alignment buttons ---
  const alignBtns = textPopup.querySelectorAll('[data-align]');
  alignBtns.forEach(btn => {
    const shouldBeActive = state.text.align === btn.dataset.align;
    if (btn.classList.contains('active') !== shouldBeActive) {
      btn.classList.toggle('active', shouldBeActive);
    }
  });

  // sync toolbar if present
  try{ updateToolbarTextUI(); }catch(e){}
  
  if (textColorInput.value !== state.text.color) textColorInput.value = state.text.color;
  if (textBgColorInput.value !== state.text.bgColor) textBgColorInput.value = state.text.bgColor;
  // Convert 0-1 state to 0-100 slider range
  const bgAlphaPercent = Math.round(state.text.bgAlpha * 100);
  if (textBgAlphaInput.value !== bgAlphaPercent) textBgAlphaInput.value = bgAlphaPercent;
  const alphaLabel = bgAlphaPercent + '%';
  if (textBgAlphaLabel.innerText !== alphaLabel) textBgAlphaLabel.innerText = alphaLabel;
  
  // Sync font family dropdown - ensure value matches an option
  if (textFontFamilySelect) {
    const fontValue = state.text.fontFamily || 'inherit';
    if (textFontFamilySelect.value !== fontValue) {
      textFontFamilySelect.value = fontValue;
    }
    // If value still doesn't match (no matching option), highlight first option
    if (!textFontFamilySelect.value || textFontFamilySelect.value !== fontValue) {
      textFontFamilySelect.selectedIndex = 0;
    }
  }
}

// Apply current text settings to all selected text items
function applyTextSettingsToSelection() {
  const rgb = hexToRgbCached(state.text.bgColor);
  const bgColorString = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.text.bgAlpha})`;

  state.selectedIds.forEach(id => {
    const node = findNodeById(id);
    if (node && node.dataset.type === 'text') {
      const textDiv = node.querySelector('.text-item');
      const boldStyle = state.text.bold ? 'bold' : 'normal';
      const italicStyle = state.text.italic ? 'italic' : 'normal';
      const dec = [];
      if(state.text.underline) dec.push('underline');
      if(state.text.crossed) dec.push('line-through');
      const decorationStyle = dec.length ? dec.join(' ') : 'none';
      
      // Batch style updates to reduce reflows
      if (textDiv.style.fontWeight !== boldStyle) textDiv.style.fontWeight = boldStyle;
      if (textDiv.style.fontStyle !== italicStyle) textDiv.style.fontStyle = italicStyle;
      if (textDiv.style.textDecoration !== decorationStyle) textDiv.style.textDecoration = decorationStyle;
      if (textDiv.style.color !== state.text.color) textDiv.style.color = state.text.color;
      if (textDiv.style.backgroundColor !== bgColorString) textDiv.style.backgroundColor = bgColorString;
      if (textDiv.style.textAlign !== state.text.align) textDiv.style.textAlign = state.text.align;
      const fontFamilyValue = state.text.fontFamily || 'inherit';
      if (textDiv.style.fontFamily !== fontFamilyValue) textDiv.style.fontFamily = fontFamilyValue;
      // Update data attribute to track font family
      if (node.dataset.fontFamily !== fontFamilyValue) node.dataset.fontFamily = fontFamilyValue;
    }
  });
  pushHistory();
}

textBoldBtn.addEventListener('click', (e) => {
  e.preventDefault();
  state.text.bold = !state.text.bold;
  updateTextPopupUI();
  applyTextSettingsToSelection();
});
textItalicBtn.addEventListener('click', (e) => {
  e.preventDefault();
  state.text.italic = !state.text.italic;
  updateTextPopupUI();
  applyTextSettingsToSelection();
});
textUnderlineBtn.addEventListener('click', (e) => {
  e.preventDefault();
  state.text.underline = !state.text.underline;
  updateTextPopupUI();
  applyTextSettingsToSelection();
});

// <-- Strikethrough button wiring -->
const textCrossedBtn = el('#text-crossed');
if(textCrossedBtn){
  textCrossedBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    state.text.crossed = !state.text.crossed;
    updateTextPopupUI();
    applyTextSettingsToSelection();
  });
}

// Alignment buttons in popup
const alignBtns = textPopup.querySelectorAll('[data-align]');
alignBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    state.text.align = btn.dataset.align;
    updateTextPopupUI();
    applyTextSettingsToSelection();
  });
});

textColorInput.addEventListener('input', (e) => {
  state.text.color = e.target.value;
  applyTextSettingsToSelection();
});
textBgColorInput.addEventListener('input', (e) => {
  state.text.bgColor = e.target.value;
  applyTextSettingsToSelection();
});

// Font family selector
const textFontFamilySelect = el('#text-font-family');
if (textFontFamilySelect) {
  textFontFamilySelect.addEventListener('change', (e) => {
    state.text.fontFamily = e.target.value;
    applyTextSettingsToSelection();
  });
}

if(textBgAlphaInput){
  textBgAlphaInput.addEventListener('pointerdown', ()=>{ startSliderHistory(); });
  textBgAlphaInput.addEventListener('input', (e) => {
    const sliderVal = parseFloat(e.target.value);
    state.text.bgAlpha = sliderVal / 100; // Convert 0-100 to 0-1 for state
    textBgAlphaLabel.innerText = Math.round(sliderVal) + '%';
    applyTextSettingsToSelection();
  });
  textBgAlphaInput.addEventListener('change', ()=>{ endSliderHistory(); });
}
updateTextPopupUI();

// --- Image Flip Functions ---
function flipImageHorizontally() {
  state.selectedIds.forEach(id => {
    const node = findNodeById(id);
    if (node && node.dataset.type === 'image') {
      const img = node.querySelector('img');
      if (img) {
        const currentTransform = img.style.transform || '';
        const scaleMatch = currentTransform.match(/scaleX\(([^)]+)\)/);
        const currentScaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const newScaleX = currentScaleX === 1 ? -1 : 1;
        const newTransform = currentTransform.replace(/scaleX\([^)]+\)/, '').trim() + ` scaleX(${newScaleX})`;
        img.style.transform = newTransform.trim();
      }
    }
  });
  pushHistory();
}

function flipImageVertically() {
  state.selectedIds.forEach(id => {
    const node = findNodeById(id);
    if (node && node.dataset.type === 'image') {
      const img = node.querySelector('img');
      if (img) {
        const currentTransform = img.style.transform || '';
        const scaleMatch = currentTransform.match(/scaleY\(([^)]+)\)/);
        const currentScaleY = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const newScaleY = currentScaleY === 1 ? -1 : 1;
        const newTransform = currentTransform.replace(/scaleY\([^)]+\)/, '').trim() + ` scaleY(${newScaleY})`;
        img.style.transform = newTransform.trim();
      }
    }
  });
  pushHistory();
}

// --- Flip Button Event Listeners ---
const flipHorizontalBtn = el('#flip-horizontal-btn');
if (flipHorizontalBtn) {
  flipHorizontalBtn.addEventListener('click', flipImageHorizontally);
}

const flipVerticalBtn = el('#flip-vertical-btn');
if (flipVerticalBtn) {
  flipVerticalBtn.addEventListener('click', flipImageVertically);
}

// --- Transparency Slider Wiring ---
const transparencySliderEl = el('#transparency-slider');
if(transparencySliderEl){
  transparencySliderEl.addEventListener('pointerdown', (e)=>{ startSliderHistory(); });
  transparencySliderEl.addEventListener('input', (e) => {
    const opacity = e.target.value / 100;
    el('#transparency-value').textContent = Math.round(e.target.value) + '%';
    state.selectedIds.forEach(id => {
      const node = findNodeById(id);
      if (node && node.dataset.type === 'image') {
        const img = node.querySelector('img');
        if (img) img.style.opacity = opacity;
      }
    });
  });
  transparencySliderEl.addEventListener('change', (e)=>{ endSliderHistory(); });
}

// --- Global Click Listener to Close Popups ---
document.addEventListener('click', (e) => {
  if (!strokePopup.contains(e.target) && e.target !== strokeSettingsBtn && !e.target.closest('#stroke-settings')) {
    strokePopup.style.display = 'none';
    if (state.tool === 'stroke-settings') setTool('draw');
  }
  if (!textPopup.contains(e.target) && e.target !== textSettingsBtn && !e.target.closest('#text-settings')) {
    textPopup.style.display = 'none';
    if (state.tool === 'text-settings') setTool('text');
  }
});

// --- Translation Extension Detection and Warning ---
function hideKnownTranslateUI(){
  const selectors = [
    '#google_translate_element',
    '.goog-te-banner-frame',
    '.goog-te-combo',
    '.goog-te-banner',
    '#gtx-trans',
    '.goog-gt-tt'
  ];
  selectors.forEach(s=>{
    document.querySelectorAll(s).forEach(n=>{ try{ n.style.display='none'; }catch(e){} });
  });
  document.querySelectorAll('iframe').forEach(iframe=>{
    try{
      const src = iframe.src || '';
      if(src.includes('translate.google') || src.includes('translate.googleusercontent') || src.includes('translate.goog')){
        iframe.style.display = 'none';
      }
    }catch(e){}
  });
}

// Detects presence of translation extensions by checking for known DOM elements, global variables, and iframes associated with popular translation tools. Wrapped in try-catch to avoid errors from cross-origin access or unexpected DOM structures.
function detectTranslateExtension(){
  try{
    const hasDomMarker = !!document.querySelector('#google_translate_element') || !!document.querySelector('.goog-te-banner-frame') || !!document.querySelector('.goog-te-banner');
    const hasGlobal = !!window.google && (typeof window.google.translate === 'object' || typeof window.googleTranslateElementInit === 'function');
    const hasIframe = Array.from(document.querySelectorAll('iframe')).some(f=> (f.src||'').includes('translate.google'));
    return hasDomMarker || hasGlobal || hasIframe;
  }catch(e){ return false; }
}

// Show the warning message about translation extensions interfering with the whiteboard functionality
function showExtensionWarning(){
  const w = document.getElementById('ext-warning');
  if(!w) return;
  w.style.display = 'flex';
}

// Hide the warning message
function hideExtensionWarning(){
  const w = document.getElementById('ext-warning'); if(!w) return; w.style.display = 'none';
}

// Listen for clicks on the warning buttons to hide the warning and attempt to restore functionality by hiding known translate UI elements.
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'ext-warning-hide') {
    hideKnownTranslateUI();
    hideExtensionWarning();
  }
  if (e.target && e.target.id === 'ext-warning-close') {
    hideExtensionWarning();
  }
});

// Run detection on init and for a short period after to catch extensions that load late
function scheduleExtensionDetection(){
  try{
    if (detectTranslateExtension()) {
      showExtensionWarning();
      hideKnownTranslateUI();
    }
  }catch(e){}
  // Only check a few times (3 checks at 2-second intervals = 6 seconds total) to avoid performance issues from long-running intervals, while still catching extensions that load after a delay.
  let checks = 0;
  const maxChecks = 3;
  const timerId = setInterval(()=>{
    if (checks++ >= maxChecks) {
      clearInterval(timerId);
      return;
    }
    try{
      if (detectTranslateExtension()) {
        showExtensionWarning();
        hideKnownTranslateUI();
        clearInterval(timerId);
      }
    }catch(e){}
  }, 2000);
}

// Run on init
function getActionNodeById(id) {
  return findNodeById(id); // Simplified
}
function getZ(node){ return (node ? parseInt(node.style.zIndex || 0) : 0); }
function setZ(node, z){
  if(!node || node.style.zIndex === z) return;
  node.style.zIndex = z;
}

// Get highest and lowest Z values among all items, excluding specified IDs (used to keep selected items' relative order intact)
function getZExtremes(excludeIds = new Set()){
  const items = collectAllItems();
  let highest = -Infinity, lowest = +Infinity;

  items.forEach(it => {
    if (excludeIds.has(it.id)) return;
    highest = Math.max(highest, it.z);
    lowest = Math.min(lowest, it.z);
  });
  
  return { 
    highest: (highest === -Infinity ? Z_FLOOR : highest), 
    lowest: (lowest === +Infinity ? Z_FLOOR : lowest) 
  };
}

// --- MODIFIED: Simplified for unified Z and fixed to ensure selected items maintain relative order and are placed just above all unselected items ---
document.getElementById('bring-forward').addEventListener('click', ()=>{
  if(state.selectedIds.size === 0) return;
  const nodes = Array.from(state.selectedIds).map(id => getActionNodeById(id)).filter(Boolean);
  const exclude = new Set(nodes.map(n => n.dataset.id));
  
  let targetZ = getZExtremes(exclude).highest + 10;
  
  nodes.sort((a,b)=> getZ(a) - getZ(b)).forEach(n => {
    setZ(n, targetZ++);
  });
  
  state.nextZ = targetZ + 10;
  
  // reorderSvg(); // No longer needed
  refreshLayers();
  pushHistory();
});

// Similar logic for send backward, but we place items just below all unselected items while maintaining their relative order
document.getElementById('send-back').addEventListener('click', ()=>{
  if(state.selectedIds.size === 0) return;
  
  const nodes = Array.from(state.selectedIds).map(id => getActionNodeById(id)).filter(Boolean);
  const exclude = new Set(nodes.map(n => n.dataset.id));

  const sortedNodes = nodes.sort((a,b)=> getZ(b) - getZ(a));
  
  let targetZ = Z_FLOOR;
  
  sortedNodes.forEach(n => setZ(n, targetZ++));
  
  const allOtherItems = collectAllItems()
    .filter(it => exclude.has(it.id) === false)
    .sort((a,b) => a.z - b.z); // Sort low-to-high

  allOtherItems.forEach(item => {
      const node = getActionNodeById(item.id);
      if (getZ(node) < targetZ) {
        setZ(node, targetZ++);
      }
  });
  
  state.nextZ = Math.max(state.nextZ, targetZ + 10);

  // reorderSvg(); // No longer needed
  refreshLayers();
  pushHistory();
});

// --- Delete Wiring ---
document.getElementById('delete-item').addEventListener('click', () => {
  isDeleting = true; // <-- SET FLAG
  Array.from(state.selectedIds).forEach(id => {
    const node = findNodeById(id);
    if (node) node.remove();
  });
  clearSelection();
  refreshLayers();
  pushHistory(); // capture deletion
  isDeleting = false; // <-- RESET FLAG
});

// --- Export/Import Wiring ---
const exportBtn = document.getElementById('export-json');
const importBtn = document.getElementById('import-json');
if (exportBtn) exportBtn.addEventListener('click', ()=> exportWhiteboard());
if (importBtn) importBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.wb';
  inp.onchange = () => {
    if (inp.files.length > 0) {
      // 1. Show the loading screen and hide the board jumpiness
      const overlay = document.getElementById('loading-overlay');
      overlay.style.display = 'flex';
      document.body.classList.add('is-loading-content');

      // 2. Start the import
      importWhiteboard(inp.files[0]);
    }
  };
  inp.click();
});

// --- Drag and Drop to load .wb files ---
board.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Check if dragged items contain a .wb file
  if (e.dataTransfer.types.includes('Files')) {
    e.dataTransfer.dropEffect = 'copy';
  }
});

board.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

board.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    // Check if the dropped file is a .wb file
    if (file.name.endsWith('.wb')) {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
      }
      document.body.classList.add('is-loading-content');
      await importWhiteboard(file);
    }
  }
});

// --- Copy selected items to clipboard ---
async function copySelected() {
  if (state.selectedIds.size === 0) return;

  const selectedItems = Array.from(state.selectedIds)
    .map(id => findNodeById(id))
    .filter(node => node);

  if (selectedItems.length === 0) return;

  try {
    // Handle single image - copy as PNG blob
    if (selectedItems.length === 1 && selectedItems[0].dataset.type === 'image') {
      const imgElement = selectedItems[0].querySelector('img');
      if (imgElement && imgElement.src) {
        const blob = await imageToBlob(imgElement);
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showCopyFeedback('Image copied to clipboard');
          return;
        }
      }
    }

    // Handle text items - copy text content only
    const textParts = [];
    selectedItems.forEach(node => {
      if (node.dataset.type === 'text') {
        const textEl = node.querySelector('.text-item');
        if (textEl) textParts.push(textEl.innerText);
      }
    });

    if (textParts.length > 0) {
      await navigator.clipboard.writeText(textParts.join('\n'));
      showCopyFeedback(textParts.length > 1 ? 'Text items copied to clipboard' : 'Text copied to clipboard');
      return;
    }

    // Handle multiple items with images - try to copy the first image as PNG
    if (selectedItems.length > 1) {
      const firstImage = selectedItems.find(n => n.dataset.type === 'image');
      if (firstImage) {
        const imgElement = firstImage.querySelector('img');
        if (imgElement && imgElement.src) {
          const blob = await imageToBlob(imgElement);
          if (blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            showCopyFeedback('Image copied to clipboard');
            return;
          }
        }
      }
    }
  } catch (err) {
    console.error('Copy failed:', err);
    showCopyFeedback('Copy failed');
  }
}

// Helper function to convert an img element to a PNG blob
async function imageToBlob(imgElement) {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth || imgElement.width || 240;
      canvas.height = imgElement.naturalHeight || imgElement.height || 180;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      
      ctx.drawImage(imgElement, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    } catch (err) {
      console.error('Error converting image to blob:', err);
      resolve(null);
    }
  });
}

function showCopyFeedback(message = 'Copied!') {
  const feedback = document.querySelector('#copy-feedback');
  if (feedback) {
    // Update the message content
    feedback.textContent = message;
    feedback.classList.remove('show');
    void feedback.offsetHeight; // Trigger reflow
    feedback.classList.add('show');
  }
}

// --- Keyboard Shortcuts ---
window.addEventListener('keydown', (e)=>{
  const isInputFocused = !!document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName));

  if (e.key === 'Shift' && state.tool === 'draw' && !isInputFocused) {
    drawingGuides.style.display = 'block';
    if (lastMouseEvent) {
        let clientX = lastMouseEvent.clientX;
        let clientY = lastMouseEvent.clientY;
        if (clientX === undefined && lastMouseEvent.touches && lastMouseEvent.touches.length > 0) {
            clientX = lastMouseEvent.touches[0].clientX;
            clientY = lastMouseEvent.touches[0].clientY;
        }
        if (clientX === undefined && lastMouseEvent.changedTouches && lastMouseEvent.changedTouches.length > 0) {
            clientX = lastMouseEvent.changedTouches[0].clientX;
            clientY = lastMouseEvent.changedTouches[0].clientY;
        }
        if (clientX === undefined) { clientX = 0; clientY = 0; }
        
        guideH.setAttribute('y1', clientY);
        guideH.setAttribute('y2', clientY);
        guideV.setAttribute('x1', clientX);
        guideV.setAttribute('x2', clientX);
    }
  }

  if (e.key === 'Escape') {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.isContentEditable) {
      activeEl.blur();
    }
    clearSelection();
    document.activeElement?.blur();
    setTool('select');
    return;
  }

  // Handle Ctrl+C even when text is focused (to copy imported content)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c'){
    // Only proceed if something is selected (not just editing text)
    if (state.selectedIds.size > 0) {
      e.preventDefault(); 
      copySelected();
      return;
    }
  }

  const isUndoRedoShortcut = (e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase());
  let shouldBypassInputCheck = false;
  if (isUndoRedoShortcut && document.activeElement && document.activeElement.classList.contains('text-item')) {
    const wrapper = document.activeElement.closest('.item');
    if (wrapper && wrapper.dataset.isNew === 'true') {
      shouldBypassInputCheck = true;
    } else {
      const text = document.activeElement.innerText.trim();
      if (text === '' || text === 'Type...') {
        shouldBypassInputCheck = true;
      }
    }
  }

  if (isInputFocused && !shouldBypassInputCheck) return;
  if(e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
  if(e.key === 's') { document.activeElement?.blur(); setTool('select'); }
  if(e.key === 'd') { document.activeElement?.blur(); setTool('draw'); }
  if(e.key === 't') { document.activeElement?.blur(); setTool('text'); }
  // Refit keyboard shortcut
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f'){
    e.preventDefault(); refitToContent();
  }
  // Undo/redo keyboard shortcuts
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){
    e.preventDefault(); if (e.shiftKey) redo(); else undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){
    e.preventDefault(); redo();
  }
});

// Hide guides when Shift is released, and mark straight line as interrupted if it was in progress
window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        drawingGuides.style.display = 'none';
        // For rounded mode, finalize any accumulated multi-point polyline path that
        // was being built across multiple segments (user released Shift between segments).
        if (state.stroke.rounded && straightLineState && currentPath && currentStrokeGroup && !drawing) {
            finalizeStrokeGroup();
            pushHistory();
        }
        straightLineState = null;
    }
});

// Debounce function to limit how often a function can run during rapid events (like scroll or zoom)
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Use debounce for scroll and zoom events to prevent excessive updates
setTool('select');
updateSelectionModeUI();
syncCircleTransformUI(); // Initial sync for circle transform buttons
applyScale();
refreshLayers();
// Capture initial state for undo/redo
undoStack = []; redoStack = []; pushHistory();
// Start extension detection
scheduleExtensionDetection();

// License Modal Handler
document.getElementById('footer-hint-clickable').addEventListener('click', () => {
  document.getElementById('license-modal').classList.add('show');
});

document.getElementById('license-modal-close').addEventListener('click', () => {
  document.getElementById('license-modal').classList.remove('show');
});

document.getElementById('license-modal').addEventListener('click', (e) => {
  if (e.target.id === 'license-modal') {
    document.getElementById('license-modal').classList.remove('show');
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('license-modal').classList.remove('show');
  }
});