import { useState, useEffect, useCallback, useRef } from 'react';
import { X, GripHorizontal } from 'lucide-react';

type Mode = 'normal' | 'hp12c';

const CalculadoraPopup = ({ onClose }: { onClose: () => void }) => {
  const [mode, setMode] = useState<Mode>('normal');

  // Normal mode
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  // HP-12C RPN mode (X is display, Y/Z/T are stack)
  const [stack, setStack] = useState<number[]>([0, 0, 0]); // Y, Z, T
  const [hpEntry, setHpEntry] = useState(true); // entering new number after ENTER/op

  // Drag state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calcRef.current) return;
    const rect = calcRef.current.getBoundingClientRect();
    setPos({ x: (window.innerWidth - rect.width) / 2, y: (window.innerHeight - rect.height) / 2 });
  }, []);

  const onDragStart = (clientX: number, clientY: number) => {
    if (!pos) return;
    dragging.current = true;
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
  };
  const onDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current || !calcRef.current) return;
    const rect = calcRef.current.getBoundingClientRect();
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - rect.width, clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - rect.height, clientY - dragOffset.current.y)),
    });
  }, []);
  const onDragEnd = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    const mm = (e: MouseEvent) => onDragMove(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => { if (e.touches[0]) onDragMove(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  const fmt = (n: number) => String(parseFloat(n.toFixed(8)));

  // ===== NORMAL MODE =====
  const nNumber = (n: string) => {
    if (reset) { setDisplay(n); setReset(false); return; }
    setDisplay(display === '0' ? n : display + n);
  };
  const nOp = (o: string) => { setPrev(parseFloat(display)); setOp(o); setReset(true); };
  const nEqual = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    let r = 0;
    if (op === '+') r = prev + cur;
    else if (op === '-') r = prev - cur;
    else if (op === '×') r = prev * cur;
    else if (op === '÷') r = cur !== 0 ? prev / cur : 0;
    setDisplay(fmt(r)); setPrev(null); setOp(null); setReset(true);
  };
  const nClear = () => { setDisplay('0'); setPrev(null); setOp(null); };
  const nDot = () => { if (!display.includes('.')) setDisplay(display + '.'); };
  const nPercent = () => setDisplay(String(parseFloat(display) / 100));

  // ===== HP-12C RPN MODE =====
  const hpNumber = (n: string) => {
    if (hpEntry) { setDisplay(display === '0' && n !== '.' ? n : display + n); return; }
    setDisplay(n); setHpEntry(true);
  };
  const hpDot = () => { if (!display.includes('.')) { setDisplay(display + '.'); setHpEntry(true); } };
  const hpEnter = () => {
    const x = parseFloat(display);
    setStack([x, stack[0], stack[1]]); // push: new Y=X, Z=oldY, T=oldZ
    setHpEntry(false);
  };
  const hpOp = (o: string) => {
    const x = parseFloat(display);
    const y = stack[0];
    let r = 0;
    if (o === '+') r = y + x;
    else if (o === '-') r = y - x;
    else if (o === '×') r = y * x;
    else if (o === '÷') r = x !== 0 ? y / x : 0;
    // pop: new Y=Z, Z=T, T=T
    setStack([stack[1], stack[2], stack[2]]);
    setDisplay(fmt(r));
    setHpEntry(false);
  };
  const hpSwap = () => { // x<>y
    const x = parseFloat(display);
    setDisplay(fmt(stack[0]));
    setStack([x, stack[1], stack[2]]);
    setHpEntry(false);
  };
  const hpRoll = () => { // R↓
    const x = parseFloat(display);
    setDisplay(fmt(stack[0]));
    setStack([stack[1], stack[2], x]);
    setHpEntry(false);
  };
  const hpChs = () => setDisplay(fmt(-parseFloat(display)));
  const hpClx = () => { setDisplay('0'); setHpEntry(true); };
  const hpClear = () => { setDisplay('0'); setStack([0, 0, 0]); setHpEntry(true); };
  const hpPercent = () => { // %: X% of Y → result replaces X
    const x = parseFloat(display); const y = stack[0];
    setDisplay(fmt((y * x) / 100)); setHpEntry(false);
  };
  const hpRecip = () => { const x = parseFloat(display); setDisplay(fmt(x !== 0 ? 1 / x : 0)); setHpEntry(false); };
  const hpSqrt = () => { setDisplay(fmt(Math.sqrt(parseFloat(display)))); setHpEntry(false); };

  // Keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') return onClose();
    if (mode === 'normal') {
      if (e.key >= '0' && e.key <= '9') nNumber(e.key);
      else if (e.key === '.') nDot();
      else if (e.key === '+') nOp('+');
      else if (e.key === '-') nOp('-');
      else if (e.key === '*') nOp('×');
      else if (e.key === '/') { e.preventDefault(); nOp('÷'); }
      else if (e.key === 'Enter' || e.key === '=') nEqual();
      else if (e.key === 'Backspace') setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
      else if (e.key.toLowerCase() === 'c') nClear();
      else if (e.key === '%') nPercent();
    } else {
      if (e.key >= '0' && e.key <= '9') hpNumber(e.key);
      else if (e.key === '.') hpDot();
      else if (e.key === '+') hpOp('+');
      else if (e.key === '-') hpOp('-');
      else if (e.key === '*') hpOp('×');
      else if (e.key === '/') { e.preventDefault(); hpOp('÷'); }
      else if (e.key === 'Enter') { e.preventDefault(); hpEnter(); }
      else if (e.key === 'Backspace') setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
      else if (e.key.toLowerCase() === 'c') hpClear();
      else if (e.key === '%') hpPercent();
    }
  }, [mode, display, prev, op, reset, stack, hpEntry, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const btn = (label: string, action: () => void, cls = '') => (
    <button onClick={action} className={`rounded-lg text-xs font-bold py-2.5 transition-all active:scale-95 ${cls}`}>
      {label}
    </button>
  );

  const isHp = mode === 'hp12c';

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      <div
        ref={calcRef}
        className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl w-72 p-4 absolute"
        style={pos ? { left: pos.x, top: pos.y } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={e => onDragStart(e.clientX, e.clientY)}
          onTouchStart={e => { if (e.touches[0]) onDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Calculadora</span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-2 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setMode('normal')}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${mode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            NORMAL
          </button>
          <button
            onClick={() => setMode('hp12c')}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${mode === 'hp12c' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            HP-12C (RPN)
          </button>
        </div>

        {/* Display */}
        <div className="bg-muted rounded-lg px-3 py-2 mb-2 text-right">
          {isHp && (
            <div className="text-[9px] text-muted-foreground font-mono leading-tight">
              T: {fmt(stack[2])}<br/>Z: {fmt(stack[1])}<br/>Y: {fmt(stack[0])}
            </div>
          )}
          <span className="text-2xl font-bold text-foreground font-mono">{display}</span>
          {isHp && <div className="text-[9px] text-muted-foreground">X (display)</div>}
        </div>

        {/* Buttons */}
        {!isHp ? (
          <div className="grid grid-cols-4 gap-1.5">
            {btn('C', nClear, 'bg-destructive/20 text-destructive')}
            {btn('±', () => setDisplay(String(-parseFloat(display))), 'bg-muted text-foreground')}
            {btn('%', nPercent, 'bg-muted text-foreground')}
            {btn('÷', () => nOp('÷'), 'bg-primary text-primary-foreground')}
            {['7','8','9'].map(n => btn(n, () => nNumber(n), 'bg-muted text-foreground'))}
            {btn('×', () => nOp('×'), 'bg-primary text-primary-foreground')}
            {['4','5','6'].map(n => btn(n, () => nNumber(n), 'bg-muted text-foreground'))}
            {btn('-', () => nOp('-'), 'bg-primary text-primary-foreground')}
            {['1','2','3'].map(n => btn(n, () => nNumber(n), 'bg-muted text-foreground'))}
            {btn('+', () => nOp('+'), 'bg-primary text-primary-foreground')}
            <button onClick={() => nNumber('0')} className="col-span-2 rounded-lg text-xs font-bold py-2.5 bg-muted text-foreground active:scale-95">0</button>
            {btn('.', nDot, 'bg-muted text-foreground')}
            {btn('=', nEqual, 'bg-accent text-accent-foreground')}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {btn('√x', hpSqrt, 'bg-muted text-foreground')}
            {btn('1/x', hpRecip, 'bg-muted text-foreground')}
            {btn('%', hpPercent, 'bg-muted text-foreground')}
            {btn('x↔y', hpSwap, 'bg-muted text-foreground')}
            {btn('R↓', hpRoll, 'bg-muted text-foreground')}

            {btn('CLx', hpClx, 'bg-destructive/20 text-destructive')}
            {btn('C', hpClear, 'bg-destructive/30 text-destructive')}
            {btn('CHS', hpChs, 'bg-muted text-foreground')}
            {btn('÷', () => hpOp('÷'), 'bg-primary text-primary-foreground')}
            {btn('×', () => hpOp('×'), 'bg-primary text-primary-foreground')}

            {['7','8','9'].map(n => btn(n, () => hpNumber(n), 'bg-muted text-foreground'))}
            {btn('-', () => hpOp('-'), 'bg-primary text-primary-foreground')}
            {btn('+', () => hpOp('+'), 'bg-primary text-primary-foreground')}

            {['4','5','6'].map(n => btn(n, () => hpNumber(n), 'bg-muted text-foreground'))}
            <button onClick={hpEnter} className="row-span-2 rounded-lg text-[11px] font-bold bg-accent text-accent-foreground active:scale-95">ENTER</button>
            {btn('.', hpDot, 'bg-muted text-foreground')}

            {['1','2','3'].map(n => btn(n, () => hpNumber(n), 'bg-muted text-foreground'))}
            {btn('0', () => hpNumber('0'), 'bg-muted text-foreground')}

          </div>
        )}

        {isHp && (
          <p className="text-[9px] text-muted-foreground mt-2 text-center">
            RPN: digite valor → ENTER → próximo valor → operador
          </p>
        )}
      </div>
    </div>
  );
};

export default CalculadoraPopup;
