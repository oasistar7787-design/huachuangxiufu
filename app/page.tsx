"use client";

import { useMemo, useRef, useState } from "react";

type Mat = [[number, number], [number, number]];
type PieceState = { x: number; y: number; matrix: Mat };
type TranslateCommand = { id: number; type: "translate"; direction: "up" | "down" | "left" | "right"; distance: number };
type RotateCommand = { id: number; type: "rotate"; center: string; direction: "cw" | "ccw"; angle: number };
type ReflectCommand = { id: number; type: "reflect"; axis: string };
type Command = TranslateCommand | RotateCommand | ReflectCommand;

const POINTS = "ABCDEFGHIJKLMNOP".split("");
const POINT_COORDS = Object.fromEntries(POINTS.map((p, i) => [p, { x: i % 4, y: Math.floor(i / 4) }]));
const START: PieceState = { x: 2.5, y: 0.5, matrix: [[1, 0], [0, 1]] };
const TARGET: PieceState = { x: 0.5, y: 2.5, matrix: [[0, 1], [1, 0]] };
const AXES: Record<string, { label: string; apply: (p: PieceState) => PieceState }> = {
  "BFJN": { label: "直线 BFJN（竖直）", apply: p => reflect(p, [[-1, 0], [0, 1]], 2, 0) },
  "CGKO": { label: "直线 CGKO（竖直）", apply: p => reflect(p, [[-1, 0], [0, 1]], 4, 0) },
  "EFGH": { label: "直线 EFGH（水平）", apply: p => reflect(p, [[1, 0], [0, -1]], 0, 2) },
  "IJKL": { label: "直线 IJKL（水平）", apply: p => reflect(p, [[1, 0], [0, -1]], 0, 4) },
  "AFKP": { label: "直线 AFKP（斜线）", apply: p => reflect(p, [[0, 1], [1, 0]], 0, 0, true) },
};

function multiply(a: Mat, b: Mat): Mat {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

function reflect(p: PieceState, matrix: Mat, offsetX: number, offsetY: number, swap = false): PieceState {
  const x = swap ? p.y : matrix[0][0] * p.x + matrix[0][1] * p.y + offsetX;
  const y = swap ? p.x : matrix[1][0] * p.x + matrix[1][1] * p.y + offsetY;
  return { x, y, matrix: multiply(matrix, p.matrix) };
}

function applyCommand(p: PieceState, command: Command): PieceState {
  if (command.type === "translate") {
    const delta = {
      up: [0, -command.distance], down: [0, command.distance],
      left: [-command.distance, 0], right: [command.distance, 0],
    }[command.direction];
    return { ...p, x: p.x + delta[0], y: p.y + delta[1] };
  }
  if (command.type === "reflect") return AXES[command.axis].apply(p);
  const center = POINT_COORDS[command.center];
  const radians = command.angle * Math.PI / 180 * (command.direction === "cw" ? 1 : -1);
  const cos = Math.round(Math.cos(radians));
  const sin = Math.round(Math.sin(radians));
  const rotation: Mat = [[cos, -sin], [sin, cos]];
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + rotation[0][0] * dx + rotation[0][1] * dy,
    y: center.y + rotation[1][0] * dx + rotation[1][1] * dy,
    matrix: multiply(rotation, p.matrix),
  };
}

function isTarget(p: PieceState) {
  const close = (a: number, b: number) => Math.abs(a - b) < 0.01;
  return close(p.x, TARGET.x) && close(p.y, TARGET.y) && p.matrix.flat().every((v, i) => close(v, TARGET.matrix.flat()[i]));
}

function commandCopy(command: Command) {
  if (command.type === "translate") {
    const names = { up: "向上", down: "向下", left: "向左", right: "向右" };
    return { mark: "移", title: "平移", detail: `${names[command.direction]}${command.distance}格` };
  }
  if (command.type === "rotate") {
    return { mark: "转", title: "旋转", detail: `以${command.center}为中心 · ${command.direction === "cw" ? "顺时针" : "逆时针"}${command.angle}°` };
  }
  return { mark: "对", title: "轴对称", detail: `沿${AXES[command.axis].label}` };
}

function WindowQuarter({ className = "", style, movable = false }: { className?: string; style?: React.CSSProperties; movable?: boolean }) {
  return <div className={`quarter ${className}`} style={style} aria-hidden={!movable}>
    <span className="lattice lattice-a" /><span className="lattice lattice-b" /><span className="lattice lattice-c" />
  </div>;
}

export default function Home() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [piece, setPiece] = useState<PieceState>(START);
  const [direction, setDirection] = useState<TranslateCommand["direction"]>("down");
  const [distance, setDistance] = useState(1);
  const [center, setCenter] = useState("K");
  const [rotationDirection, setRotationDirection] = useState<RotateCommand["direction"]>("ccw");
  const [angle, setAngle] = useState(90);
  const [axis, setAxis] = useState("IJKL");
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState("先编排指令，再一键执行修复");
  const [showHint, setShowHint] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  const mastery = useMemo(() => ({
    translate: commands.some(c => c.type === "translate"),
    rotate: commands.some(c => c.type === "rotate"),
    reflect: commands.some(c => c.type === "reflect"),
  }), [commands]);

  function add(command: Omit<TranslateCommand, "id"> | Omit<RotateCommand, "id"> | Omit<ReflectCommand, "id">) {
    if (commands.length >= 8) { setNotice("指令栏已满，请删减后再试"); return; }
    setCommands(prev => [...prev, { ...command, id: idRef.current++ } as Command]);
    setNotice("指令已加入队列");
  }

  function remove(id: number) { setCommands(prev => prev.filter(c => c.id !== id)); }
  function clear() { setCommands([]); setPiece(START); setSuccess(false); setNotice("已清空，花窗回到起点"); }
  function undo() {
    if (!commands.length) { setNotice("暂时没有可以撤销的指令"); return; }
    setCommands(prev => prev.slice(0, -1)); setNotice("已撤销上一条指令");
  }

  function run() {
    if (!commands.length || running) { if (!commands.length) setNotice("请先从右侧添加修复指令"); return; }
    setRunning(true); setSuccess(false); setPiece(START); setNotice("正在依次执行修复指令…");
    let working = START;
    commands.forEach((command, index) => {
      working = applyCommand(working, command);
      const next = working;
      window.setTimeout(() => {
        setPiece(next);
        if (index === commands.length - 1) {
          const allUsed = mastery.translate && mastery.rotate && mastery.reflect;
          window.setTimeout(() => {
            setRunning(false);
            if (isTarget(next) && allUsed) { setSuccess(true); setNotice("修复成功！三种图形变换全部掌握"); }
            else if (isTarget(next)) setNotice("位置正确！再用齐平移、旋转和轴对称三枚修复章");
            else setNotice("还差一点：观察残片的位置和朝向，再调整指令");
          }, 450);
        }
      }, 180 + index * 620);
    });
  }

  function dragPiece(event: React.PointerEvent<HTMLButtonElement>) {
    if (running || !boardRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setNotice("可拖动观察位置；执行指令时会从右上角重新出发");
  }

  function movePiece(event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const cell = rect.width / 3;
    const x = Math.max(.5, Math.min(2.5, Math.round((event.clientX - rect.left) / cell - .5) + .5));
    const y = Math.max(.5, Math.min(2.5, Math.round((event.clientY - rect.top) / cell - .5) + .5));
    setPiece(prev => ({ ...prev, x, y }));
  }

  const cssMatrix = `matrix(${piece.matrix[0][0]},${piece.matrix[1][0]},${piece.matrix[0][1]},${piece.matrix[1][1]},0,0)`;

  return (
    <main className="game-shell">
      <header className="game-header">
        <div className="brand-mark">窗</div>
        <div className="brand-copy"><p>TRANSFORMATION WORKSHOP</p><h1>园林窗韵修复师</h1></div>
        <div className="mission-pill"><span>第 1 关</span>月洞寻韵</div>
        <button className="help-button" onClick={() => setShowHint(v => !v)} aria-expanded={showHint}>？<span>修复提示</span></button>
      </header>

      {showHint && <div className="hint-strip" role="note"><b>匠人手记</b><span>试试：向下 1 格 → 以 K 为中心逆时针旋转 90° → 沿 IJKL 轴对称 → 向左 1 格</span><button onClick={() => setShowHint(false)}>收起</button></div>}

      <section className="game-layout">
        <article className="panel board-panel">
          <div className="panel-heading"><span>01</span><div><h2>修复工坊</h2><p>把右上角残片送回左下空位</p></div><div className="grid-chip">3 × 3</div></div>
          <div className="board-wrap">
            <div className="board" ref={boardRef} aria-label="3×3 花窗拼图网格，交点标记为 A 到 P">
              {Array.from({ length: 9 }, (_, i) => <div className="cell" key={i}><span>{i + 1}</span></div>)}
              <WindowQuarter className="fixed q-tl" /><WindowQuarter className="fixed q-tr" /><WindowQuarter className="fixed q-br" />
              <div className="target-slot"><span>缺口</span></div>
              <button
                className="movable-wrap"
                style={{ left: `${(piece.x - .5) * 33.333}%`, top: `${(piece.y - .5) * 33.333}%`, transform: cssMatrix }}
                onPointerDown={dragPiece} onPointerMove={movePiece} aria-label="可拖动的四分之一花窗残片"
              ><WindowQuarter className="movable" movable /><i>拖动观察</i></button>
              {POINTS.map((point, i) => <span key={point} className="point-label" style={{ left: `${(i % 4) * 33.333}%`, top: `${Math.floor(i / 4) * 33.333}%` }}>{point}</span>)}
              {running && <div className="running-glow" />}
            </div>
          </div>
          <div className="board-status"><span className={running ? "pulse-dot" : ""} />{notice}</div>
          <div className="board-actions"><button className="run" onClick={run} disabled={running}>▶ {running ? "修复中…" : "执行修复"}</button><button onClick={undo}>↶ 撤销一步</button><button onClick={clear}>↻ 重新开始</button></div>
        </article>

        <article className="panel queue-panel">
          <div className="panel-heading"><span>02</span><div><h2>修复指令</h2><p>按顺序编排图形运动</p></div><b>{commands.length} / 8</b></div>
          <div className="mastery-row">
            <span className={mastery.translate ? "earned" : ""}>✓ 平移</span>
            <span className={mastery.rotate ? "earned" : ""}>✓ 旋转</span>
            <span className={mastery.reflect ? "earned" : ""}>✓ 轴对称</span>
          </div>
          {commands.length === 0 ? <div className="empty-queue"><div>+</div><strong>还没有修复指令</strong><p>从右侧选择要素，加入运动序列</p></div> :
            <ol className="command-list">{commands.map((command, index) => {
              const copy = commandCopy(command);
              return <li key={command.id} className={command.type}>
                <span className="command-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="command-mark">{copy.mark}</span>
                <div><strong>{copy.title}</strong><p>{copy.detail}</p></div>
                <button onClick={() => remove(command.id)} aria-label={`删除第${index + 1}条指令`}>×</button>
              </li>;
            })}</ol>}
          <div className="queue-foot"><span>指令会自上而下依次执行</span><button onClick={() => setCommands([])}>清空队列</button></div>
        </article>

        <aside className="panel tools-panel">
          <div className="panel-heading"><span>03</span><div><h2>变换工具</h2><p>补全每种变换的关键要素</p></div></div>

          <section className="tool-card translate">
            <header><span>↗</span><div><h3>平移</h3><p><b>方向</b> + <b>距离</b></p></div></header>
            <label>选择方向</label>
            <div className="choice-row direction-grid">
              {([["up", "↑ 上"], ["down", "↓ 下"], ["left", "← 左"], ["right", "→ 右"]] as const).map(([value, label]) => <button key={value} className={direction === value ? "active" : ""} onClick={() => setDirection(value)}>{label}</button>)}
            </div>
            <label>移动距离</label>
            <div className="choice-row">{[1, 2, 3].map(n => <button key={n} className={distance === n ? "active" : ""} onClick={() => setDistance(n)}>{n} 格</button>)}</div>
            <button className="add-command" onClick={() => add({ type: "translate", direction, distance })}>＋ 加入平移指令</button>
          </section>

          <section className="tool-card rotate">
            <header><span>↻</span><div><h3>旋转</h3><p><b>旋转中心</b> + <b>方向</b> + <b>角度</b></p></div></header>
            <label htmlFor="center-select">旋转中心</label>
            <select id="center-select" value={center} onChange={e => setCenter(e.target.value)}>{POINTS.map(p => <option key={p} value={p}>交点 {p}</option>)}</select>
            <div className="two-columns">
              <div><label>旋转方向</label><div className="choice-row"><button className={rotationDirection === "cw" ? "active" : ""} onClick={() => setRotationDirection("cw")}>↻ 顺时针</button><button className={rotationDirection === "ccw" ? "active" : ""} onClick={() => setRotationDirection("ccw")}>↺ 逆时针</button></div></div>
              <div><label>旋转角度</label><div className="choice-row">{[90, 180, 270].map(n => <button key={n} className={angle === n ? "active" : ""} onClick={() => setAngle(n)}>{n}°</button>)}</div></div>
            </div>
            <button className="add-command" onClick={() => add({ type: "rotate", center, direction: rotationDirection, angle })}>＋ 加入旋转指令</button>
          </section>

          <section className="tool-card reflect">
            <header><span>◇</span><div><h3>轴对称</h3><p>沿着<b>哪条对称轴</b></p></div></header>
            <label htmlFor="axis-select">选择对称轴</label>
            <select id="axis-select" value={axis} onChange={e => setAxis(e.target.value)}>{Object.entries(AXES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select>
            <div className="axis-preview"><span className={axis === "IJKL" || axis === "EFGH" ? "horizontal" : axis === "AFKP" ? "diagonal" : ""} /><small>{AXES[axis].label}</small></div>
            <button className="add-command" onClick={() => add({ type: "reflect", axis })}>＋ 加入轴对称指令</button>
          </section>
        </aside>
      </section>

      {success && <div className="success-overlay" role="dialog" aria-modal="true" aria-label="修复成功">
        <div className="success-card">
          <span className="success-seal">修</span><p>WINDOW RESTORED</p><h2>一窗一景，修复完成</h2>
          <div className="mini-window"><WindowQuarter className="mini-tl" /><WindowQuarter className="mini-tr" /><WindowQuarter className="mini-bl" /><WindowQuarter className="mini-br" /></div>
          <p className="success-copy">你准确运用了平移、旋转和轴对称，<br />让残缺的花窗重新合圆。</p>
          <div className="success-badges"><span>平移章</span><span>旋转章</span><span>对称章</span></div>
          <button onClick={() => { setSuccess(false); clear(); }}>再修一次</button>
        </div>
      </div>}
    </main>
  );
}
