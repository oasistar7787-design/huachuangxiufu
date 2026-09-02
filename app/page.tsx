"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mat = [[number, number], [number, number]];
type PieceState = { x: number; y: number; matrix: Mat };
type Direction = "up" | "down" | "left" | "right";
type RotationDirection = "cw" | "ccw";
type ActionType = "translate" | "rotate" | "reflect";
type SlotField = "direction" | "distance" | "center" | "rotationDirection" | "angle" | "axis";

type DraftInstruction = {
  id: number;
  type: ActionType;
  direction?: Direction;
  distance?: number;
  center?: string;
  rotationDirection?: RotationDirection;
  angle?: number;
  axis?: string;
};

type ParameterPayload =
  | { kind: "action"; value: ActionType; label: string }
  | { kind: "translate-direction"; value: Direction; label: string }
  | { kind: "step"; value: number; label: string }
  | { kind: "rotation-direction"; value: RotationDirection; label: string }
  | { kind: "angle"; value: number; label: string }
  | { kind: "point"; value: string; label: string }
  | { kind: "axis"; value: string; label: string };

type Command =
  | { type: "translate"; direction: Direction; distance: number }
  | { type: "rotate"; center: string; direction: RotationDirection; angle: number }
  | { type: "reflect"; axisPoints: [string, string] };

type ResultFeedback = { type: "success" | "error"; title: string; message: string };
type DragGhost = { payload: ParameterPayload; x: number; y: number; sourceX: number; sourceY: number; returning: boolean };

const FIXED_POINTS = [
  { name: "C", x: 0, y: 0 }, { name: "F", x: 1, y: 0 }, { name: "M", x: 2, y: 0 }, { name: "N", x: 3, y: 0 },
  { name: "B", x: 0, y: 1 }, { name: "E", x: 1, y: 1 }, { name: "H", x: 2, y: 1 }, { name: "P", x: 3, y: 1 },
  { name: "A", x: 0, y: 2 }, { name: "D", x: 1, y: 2 }, { name: "G", x: 2, y: 2 },
] as const;
const ROTATION_POINTS = "ABCDEFGHMNPO".split("");
const SYMMETRY_AXES = ["MH", "FE", "EH", "ED", "BE", "HG", "FH", "EG", "BD", "DG", "HP", "AD"];
const POINT_COORDS: Record<string, { x: number; y: number }> = Object.fromEntries(FIXED_POINTS.map(point => [point.name, { x: point.x, y: point.y }]));
const START: PieceState = { x: 2.5, y: 0.5, matrix: [[1, 0], [0, 1]] };
const TARGET: PieceState = { x: 0.5, y: 1.5, matrix: [[-1, 0], [0, 1]] };
const ACTION_META = {
  translate: { title: "平移", icon: "↗", hint: "方向 + 步数" },
  rotate: { title: "旋转", icon: "↻", hint: "中心 + 方向 + 角度" },
  reflect: { title: "轴对称", icon: "◇", hint: "选择一条对称轴" },
} satisfies Record<ActionType, { title: string; icon: string; hint: string }>;

function multiply(a: Mat, b: Mat): Mat {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

function reflectAcrossLine(piece: PieceState, names: [string, string]): PieceState {
  const a = POINT_COORDS[names[0]];
  const b = POINT_COORDS[names[1]];
  if (!a || !b || (a.x === b.x && a.y === b.y)) return piece;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  const reflection: Mat = [[ux * ux - uy * uy, 2 * ux * uy], [2 * ux * uy, uy * uy - ux * ux]];
  const dx = piece.x - a.x;
  const dy = piece.y - a.y;
  return {
    x: a.x + reflection[0][0] * dx + reflection[0][1] * dy,
    y: a.y + reflection[1][0] * dx + reflection[1][1] * dy,
    matrix: multiply(reflection, piece.matrix),
  };
}

function applyCommand(piece: PieceState, command: Command): PieceState {
  if (command.type === "translate") {
    const delta = {
      up: [0, -command.distance], down: [0, command.distance],
      left: [-command.distance, 0], right: [command.distance, 0],
    }[command.direction];
    return { ...piece, x: piece.x + delta[0], y: piece.y + delta[1] };
  }
  if (command.type === "reflect") return reflectAcrossLine(piece, command.axisPoints);
  const center = command.center === "O" ? { x: piece.x, y: piece.y } : POINT_COORDS[command.center];
  if (!center) return piece;
  const radians = command.angle * Math.PI / 180 * (command.direction === "cw" ? 1 : -1);
  const cos = Math.round(Math.cos(radians));
  const sin = Math.round(Math.sin(radians));
  const rotation: Mat = [[cos, -sin], [sin, cos]];
  const dx = piece.x - center.x;
  const dy = piece.y - center.y;
  return {
    x: center.x + rotation[0][0] * dx + rotation[0][1] * dy,
    y: center.y + rotation[1][0] * dx + rotation[1][1] * dy,
    matrix: multiply(rotation, piece.matrix),
  };
}

function toCommand(draft: DraftInstruction): Command | null {
  if (draft.type === "translate" && draft.direction && draft.distance) {
    return { type: "translate", direction: draft.direction, distance: draft.distance };
  }
  if (draft.type === "rotate" && draft.center && draft.rotationDirection && draft.angle) {
    return { type: "rotate", center: draft.center, direction: draft.rotationDirection, angle: draft.angle };
  }
  if (draft.type === "reflect" && draft.axis) {
    return { type: "reflect", axisPoints: [draft.axis[0], draft.axis[1]] };
  }
  return null;
}

function isTarget(piece: PieceState) {
  const close = (a: number, b: number) => Math.abs(a - b) < 0.01;
  return close(piece.x, TARGET.x) && close(piece.y, TARGET.y)
    && piece.matrix.flat().every((value, index) => close(value, TARGET.matrix.flat()[index]));
}

function isInsideGrid(piece: PieceState) {
  const epsilon = 0.01;
  return piece.x >= 0.5 - epsilon && piece.x <= 2.5 + epsilon
    && piece.y >= 0.5 - epsilon && piece.y <= 2.5 + epsilon;
}

function WindowQuarter({ className = "", movable = false }: { className?: string; movable?: boolean }) {
  return <div className={`quarter ${className}`} aria-hidden={!movable}>
    <img src="/window-quarter-reference.png" alt="" draggable={false} />
  </div>;
}

export default function Home() {
  const [instructions, setInstructions] = useState<DraftInstruction[]>([]);
  const [piece, setPiece] = useState<PieceState>(START);
  const [activeSlot, setActiveSlot] = useState<{ id: number; field: SlotField } | null>(null);
  const [dragging, setDragging] = useState<ParameterPayload | null>(null);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<ResultFeedback | null>(null);
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null);
  const [notice, setNotice] = useState("先把一种动作拖到中间，再把右侧参数拖进空格");
  const [showHint, setShowHint] = useState(false);
  const activeDragRef = useRef<ParameterPayload | null>(null);
  const pointerDragRef = useRef<{ payload: ParameterPayload; pointerId: number; startX: number; startY: number; moved: boolean; sourceX: number; sourceY: number } | null>(null);
  const suppressClickRef = useRef(false);
  const idRef = useRef(1);

  const completeCount = useMemo(() => instructions.filter(instruction => toCommand(instruction)).length, [instructions]);
  const mastery = useMemo(() => ({
    translate: instructions.some(item => item.type === "translate" && toCommand(item)),
    rotate: instructions.some(item => item.type === "rotate" && toCommand(item)),
    reflect: instructions.some(item => item.type === "reflect" && toCommand(item)),
  }), [instructions]);

  useEffect(() => {
    if (!dragging) return;
    const moveAcrossPage = (event: PointerEvent) => {
      const current = pointerDragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 4) current.moved = true;
      if (current.moved) event.preventDefault();
      setDragGhost(previous => previous ? { ...previous, x: event.clientX, y: event.clientY, returning: false } : previous);
    };
    const finishAcrossPage = (event: PointerEvent) => finishCopyDragAt(event.clientX, event.clientY, event.pointerId);
    window.addEventListener("pointermove", moveAcrossPage, { capture: true, passive: false });
    window.addEventListener("pointerup", finishAcrossPage, true);
    window.addEventListener("pointercancel", finishAcrossPage, true);
    return () => {
      window.removeEventListener("pointermove", moveAcrossPage, true);
      window.removeEventListener("pointerup", finishAcrossPage, true);
      window.removeEventListener("pointercancel", finishAcrossPage, true);
    };
  }, [dragging]);

  function addAction(type: ActionType) {
    if (instructions.length >= 8) { setNotice("指令栏装满啦，先删掉一条"); return; }
    const id = idRef.current++;
    setInstructions(previous => [...previous, { id, type }]);
    setActiveSlot(null);
    setNotice(`${ACTION_META[type].title}动作建好啦，把参数拖进虚线空格`);
  }

  function removeInstruction(id: number) {
    setInstructions(previous => previous.filter(item => item.id !== id));
    if (activeSlot?.id === id) setActiveSlot(null);
  }

  function accepts(field: SlotField, payload: ParameterPayload) {
    if (field === "direction") return payload.kind === "translate-direction";
    if (field === "distance") return payload.kind === "step";
    if (field === "center") return payload.kind === "point";
    if (field === "rotationDirection") return payload.kind === "rotation-direction";
    if (field === "angle") return payload.kind === "angle";
    return payload.kind === "axis";
  }

  function placeParameter(id: number, field: SlotField, payload: ParameterPayload) {
    if (!accepts(field, payload)) {
      setNotice("这张参数卡放不到这个空格里，看看参数分组和空格文字");
      return false;
    }
    setInstructions(previous => previous.map(item => {
      if (item.id !== id) return item;
      if (field === "direction" && payload.kind === "translate-direction") return { ...item, direction: payload.value };
      if (field === "distance" && payload.kind === "step") return { ...item, distance: payload.value };
      if (field === "center" && payload.kind === "point") return { ...item, center: payload.value };
      if (field === "rotationDirection" && payload.kind === "rotation-direction") return { ...item, rotationDirection: payload.value };
      if (field === "angle" && payload.kind === "angle") return { ...item, angle: payload.value };
      if (field === "axis" && payload.kind === "axis") return { ...item, axis: payload.value };
      return item;
    }));
    setNotice(`${payload.label} 已经放好`);
    setActiveSlot(null);
    return true;
  }

  function useParameterByClick(payload: ParameterPayload) {
    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
    if (!activeSlot) {
      setNotice("先点中间的一个虚线空格，再点这张参数卡");
      return;
    }
    placeParameter(activeSlot.id, activeSlot.field, payload);
  }

  function startCopyDrag(event: React.PointerEvent<HTMLButtonElement>, payload: ParameterPayload) {
    if (event.button !== 0 || running) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const sourceX = rect.left + rect.width / 2;
    const sourceY = rect.top + rect.height / 2;
    pointerDragRef.current = { payload, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, sourceX, sourceY };
    activeDragRef.current = payload;
    setDragging(payload);
    setDragGhost({ payload, x: event.clientX, y: event.clientY, sourceX, sourceY, returning: false });
    setNotice(`拖动“${payload.label}”到亮起的匹配位置`);
  }

  function finishCopyDragAt(clientX: number, clientY: number, pointerId: number) {
    const current = pointerDragRef.current;
    if (!current || current.pointerId !== pointerId) return;
    let accepted = false;
    if (current.moved) {
      const elements = document.elementsFromPoint(clientX, clientY);
      if (current.payload.kind === "action") {
        if (elements.some(element => element.closest(".instruction-workbench"))) {
          addAction(current.payload.value);
          accepted = true;
        }
      } else {
        const slot = elements.map(element => element.closest<HTMLElement>(".parameter-slot")).find(Boolean);
        const id = Number(slot?.dataset.instructionId);
        const field = slot?.dataset.field as SlotField | undefined;
        if (slot && id && field && accepts(field, current.payload)) accepted = placeParameter(id, field, current.payload);
      }
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    pointerDragRef.current = null;
    activeDragRef.current = null;
    setDragging(null);
    if (accepted || !current.moved) {
      setDragGhost(null);
    } else {
      setNotice("这个参数不能放在这里，已经返回右侧");
      setDragGhost(previous => previous ? { ...previous, x: current.sourceX, y: current.sourceY, returning: true } : previous);
      window.setTimeout(() => setDragGhost(null), 220);
    }
  }

  function clear() {
    setInstructions([]); setPiece(START); setFeedback(null); setActiveSlot(null);
    setNotice("已经回到起点，重新搭一条修复路线吧");
  }

  function run() {
    if (!instructions.length || running) {
      if (!instructions.length) {
        setNotice("还没有修复指令");
        setFeedback({ type: "error", title: "还不能提交", message: "请先将右侧动作模块拖到编程指令区，再填好所需参数。" });
      }
      return;
    }
    const commands = instructions.map(toCommand);
    const firstIncomplete = commands.findIndex(command => !command);
    if (firstIncomplete >= 0) {
      setNotice(`第 ${firstIncomplete + 1} 条指令还有空格没有填`);
      setFeedback({ type: "error", title: "参数还没填完整", message: `第 ${firstIncomplete + 1} 条指令还有空格，请把对应参数拖进去后再提交。` });
      return;
    }
    setRunning(true); setFeedback(null); setPiece(START); setNotice("小小修复师正在执行指令…");
    let working = START;
    const steps: PieceState[] = [];
    let outOfGridAt = -1;
    (commands as Command[]).some((command, index) => {
      working = applyCommand(working, command);
      steps.push(working);
      if (!isInsideGrid(working)) {
        outOfGridAt = index;
        return true;
      }
      return false;
    });

    steps.forEach((next, index) => {
      window.setTimeout(() => {
        if (index === outOfGridAt) {
          setPiece(START);
          setRunning(false);
          setNotice(`第 ${index + 1} 条指令让残片跑出了九宫格，已回到起点`);
          setFeedback({
            type: "error",
            title: "残片跑出九宫格了！",
            message: `第 ${index + 1} 条指令会把残片带到九宫格外，请检查这条指令的方向、距离、旋转中心或对称轴。残片已自动回到起点。`,
          });
          return;
        }
        setPiece(next);
        if (index === steps.length - 1) {
          const allUsed = mastery.translate && mastery.rotate && mastery.reflect;
          window.setTimeout(() => {
            setRunning(false);
            if (isTarget(next) && allUsed) {
              setNotice("修复成功！三枚变换章都收集到了");
              setFeedback({ type: "success", title: "太棒了，花窗修复成功！", message: "你正确运用了平移、旋转和轴对称，让四分之一残片精准回到了 BEAD 方格的缺口。" });
            } else if (isTarget(next)) {
              setPiece(START);
              setNotice("位置正确，但三种变换还没有全部使用，已回到起点");
              setFeedback({ type: "error", title: "已经很接近了", message: "残片已正确进入 BEAD 方格，但还需要在指令中用到平移、旋转和轴对称三种动作。残片已自动回到起点。" });
            } else {
              const positionCorrect = Math.abs(next.x - TARGET.x) < .01 && Math.abs(next.y - TARGET.y) < .01;
              const directionCorrect = next.matrix.flat().every((value, matrixIndex) => Math.abs(value - TARGET.matrix.flat()[matrixIndex]) < .01);
              const reason = positionCorrect
                ? "残片已经到达 BEAD 方格，但纹样方向没有对齐，请检查旋转方向、角度或对称轴。"
                : directionCorrect
                  ? "残片纹样方向已经正确，但还没有到达 BEAD 方格，请检查平移方向和距离。"
                  : "残片的位置和纹样方向都还没有对齐，请按顺序检查每条指令的参数。";
              setPiece(START);
              setNotice("这次还没有拼合，残片已回到起点");
              setFeedback({ type: "error", title: "再试一次，你快成功了！", message: `${reason} 残片已自动回到起点。` });
            }
          }, 450);
        }
      }, 180 + index * 620);
    });
  }

  function ParamCard({ payload, tone }: { payload: ParameterPayload; tone: string }) {
    return <button
      className={`parameter-token ${tone}`}
      onPointerDown={event => startCopyDrag(event, payload)}
      onClick={() => useParameterByClick(payload)}
      title="拖到中间空格；也可以先点空格再点卡片"
    >{payload.label}</button>;
  }

  function DropSlot({ instruction, field, value, placeholder, className = "" }: { instruction: DraftInstruction; field: SlotField; value?: string | number; placeholder: string; className?: string }) {
    const selected = activeSlot?.id === instruction.id && activeSlot.field === field;
    const compatible = dragging ? accepts(field, dragging) : false;
    return <button
      className={`parameter-slot ${value !== undefined ? "filled" : ""} ${selected ? "slot-selected" : ""} ${dragging ? compatible ? "can-drop" : "cannot-drop" : ""} ${className}`}
      onClick={() => { setActiveSlot({ id: instruction.id, field }); setNotice("空格已选中，现在点右侧对应的参数卡"); }}
      data-instruction-id={instruction.id}
      data-field={field}
      aria-label={value !== undefined ? `${placeholder}：${value}` : `空参数：${placeholder}`}
    >{value ?? placeholder}</button>;
  }

  const cssMatrix = `matrix(${piece.matrix[0][0]},${piece.matrix[1][0]},${piece.matrix[0][1]},${piece.matrix[1][1]},0,0)`;
  const translateDirections: Array<[Direction, string]> = [["up", "↑ 向上"], ["down", "↓ 向下"], ["left", "← 向左"], ["right", "→ 向右"]];
  const rotationDirections: Array<[RotationDirection, string]> = [["cw", "↻ 顺时针"], ["ccw", "↺ 逆时针"]];

  return (
    <main className="game-shell">
      <header className="game-header">
        <div className="brand-mark">窗</div>
        <div className="brand-copy"><p>TRANSFORMATION WORKSHOP</p><h1>园林窗韵修复师</h1></div>
        <button className="help-button" onClick={() => setShowHint(value => !value)} aria-expanded={showHint}>？<span>怎么玩</span></button>
      </header>

      {showHint && <div className="hint-strip" role="note"><b>搭好四条指令</b><span>① 拖入动作 → ② 把右侧参数拖入空格 → ③ 点击执行。试试：向左2格 → 绕O逆时针90度 → 沿EG轴对称 → 向下1格</span><button onClick={() => setShowHint(false)}>收起</button></div>}

      <section className="game-layout">
        <article className="panel board-panel">
          <div className="panel-heading"><span>01</span><div><h2>修复工坊</h2><p>把右上角残片送回 BEAD 方格</p></div><div className="grid-chip">3 × 3</div></div>
          <div className="board-wrap">
            <div className="board" aria-label="3×3 花窗拼图网格，标记十二个点 A、B、C、D、E、F、G、H、M、N、P、O，其中 O 为残片中心">
              {Array.from({ length: 9 }, (_, index) => <div className="cell" key={index}><span>{index + 1}</span></div>)}
              <WindowQuarter className="fixed q-tr" /><WindowQuarter className="fixed q-bl" /><WindowQuarter className="fixed q-br" />
              <div className="target-slot"><span>缺口</span></div>
              <div className="movable-wrap" style={{ left: `${(piece.x - .5) * 33.333}%`, top: `${(piece.y - .5) * 33.333}%`, transform: cssMatrix }} aria-label="四分之一花窗残片"><WindowQuarter className="movable" movable /></div>
              {FIXED_POINTS.map(point => <span key={point.name} className="point-label" style={{ left: `${point.x / 3 * 100}%`, top: `${point.y / 3 * 100}%` }}>{point.name}</span>)}
              <span className="point-label point-o" style={{ left: `${piece.x / 3 * 100}%`, top: `${piece.y / 3 * 100}%` }}>O</span>
              {running && <div className="running-glow" />}
            </div>
          </div>
          <div className="board-status"><span className={running ? "pulse-dot" : ""} />{notice}</div>
          <div className="board-actions"><button className="run" onClick={run} disabled={running}>▶ {running ? "修复中…" : "执行修复"}</button><button onClick={clear}>↻ 重新开始</button></div>
        </article>

        <article className={`panel queue-panel instruction-workbench ${dragging ? "is-dragging" : ""}`}>
          <div className="panel-heading"><span>02</span><div><h2>修复指令</h2><p>动作搭骨架，参数填空格</p></div><b>{completeCount} / {instructions.length}</b></div>
          <div className="mastery-row"><span className={mastery.translate ? "earned" : ""}>✓ 平移</span><span className={mastery.rotate ? "earned" : ""}>✓ 旋转</span><span className={mastery.reflect ? "earned" : ""}>✓ 轴对称</span></div>
          {instructions.length === 0 ? <div className="empty-queue action-empty"><div>＋</div><strong>将右侧动作模块拖到这里</strong><p>平移、旋转、轴对称都可以拖入</p></div> :
            <ol className="instruction-list">{instructions.map((instruction, index) => {
              const meta = ACTION_META[instruction.type];
              return <li key={instruction.id} className={`instruction-row ${instruction.type} ${toCommand(instruction) ? "is-complete" : ""}`}>
                <span className="instruction-index">{index + 1}</span>
                <span className="action-tag"><i>{meta.icon}</i>{meta.title}</span>
                <div className="instruction-slots">
                  {instruction.type === "translate" && <>
                    <span className="slot-word">方向（</span><DropSlot instruction={instruction} field="direction" value={instruction.direction ? { up: "向上", down: "向下", left: "向左", right: "向右" }[instruction.direction] : undefined} placeholder="拖入方向" /><span className="slot-word">），距离移动（</span>
                    <DropSlot instruction={instruction} field="distance" value={instruction.distance} placeholder="步数" className="small-slot" /><span className="slot-word">）格</span>
                  </>}
                  {instruction.type === "rotate" && <>
                    <span className="slot-word">绕（</span><DropSlot instruction={instruction} field="center" value={instruction.center} placeholder="点位" className="small-slot" /><span className="slot-word">）点，沿着（</span>
                    <DropSlot instruction={instruction} field="rotationDirection" value={instruction.rotationDirection ? instruction.rotationDirection === "cw" ? "顺时针" : "逆时针" : undefined} placeholder="旋转方向" /><span className="slot-word">）方向，旋转（</span>
                    <DropSlot instruction={instruction} field="angle" value={instruction.angle} placeholder="角度" className="small-slot" /><span className="slot-word">）度</span>
                  </>}
                  {instruction.type === "reflect" && <>
                    <span className="slot-word">沿着对称轴（</span><DropSlot instruction={instruction} field="axis" value={instruction.axis} placeholder="选择轴" className="small-slot point-only-slot" /><span className="slot-word">）进行轴对称</span>
                  </>}
                </div>
                <button className="remove-instruction" onClick={() => removeInstruction(instruction.id)} aria-label={`删除第${index + 1}条指令`}>×</button>
              </li>;
            })}</ol>}
          <div className="queue-foot"><span>虚线空格可以重复替换参数</span><button onClick={() => setInstructions([])}>清空指令</button></div>
        </article>

        <aside className="panel tools-panel builder-panel">
          <div className="panel-heading"><span>03</span><div><h2>动作与参数</h2><p>先建动作，再拖参数</p></div></div>

          <section className="builder-section action-builder">
            <div className="builder-title"><span>1</span><div><b>建立动作</b><small>拖到中间建立一条新指令</small></div></div>
            <div className="action-module-grid">{(Object.keys(ACTION_META) as ActionType[]).map(type => {
              const payload: ParameterPayload = { kind: "action", value: type, label: ACTION_META[type].title };
              return <button key={type} className={`action-module ${type}`} onPointerDown={event => startCopyDrag(event, payload)}><i>{ACTION_META[type].icon}</i><b>{ACTION_META[type].title}</b><small>{ACTION_META[type].hint}</small></button>;
            })}</div>
          </section>

          <section className="builder-section parameter-bank translate-bank">
            <div className="builder-title"><span>2</span><div><b>平移参数</b><small>方向卡 + 步数卡</small></div></div>
            <label>方向</label><div className="token-grid four">{translateDirections.map(([value, label]) => <ParamCard key={value} payload={{ kind: "translate-direction", value, label }} tone="teal" />)}</div>
            <label>距离</label><div className="token-grid four">{[1, 2, 3, 4].map(value => <ParamCard key={value} payload={{ kind: "step", value, label: String(value) }} tone="teal-light" />)}</div>
          </section>

          <section className="builder-section parameter-bank rotate-bank">
            <div className="builder-title"><span>3</span><div><b>旋转参数</b><small>方向 + 角度 + 旋转中心</small></div></div>
            <div className="token-grid two">{rotationDirections.map(([value, label]) => <ParamCard key={value} payload={{ kind: "rotation-direction", value, label }} tone="plum" />)}</div>
            <div className="token-grid two compact-angle-row">{[90, 180].map(value => <ParamCard key={value} payload={{ kind: "angle", value, label: `${value}°` }} tone="plum-light" />)}</div>
            <label>旋转中心</label><div className="token-grid point-tokens">{ROTATION_POINTS.map(value => <ParamCard key={value} payload={{ kind: "point", value, label: value }} tone={value === "O" ? "coral" : "gold"} />)}</div>
          </section>

          <section className="builder-section parameter-bank symmetry-bank">
            <div className="builder-title"><span>4</span><div><b>轴对称参数</b><small>选择一条由两点确定的对称轴</small></div></div>
            <div className="token-grid axis-tokens">{SYMMETRY_AXES.map(value => <ParamCard key={value} payload={{ kind: "axis", value, label: value }} tone="gold" />)}</div>
          </section>
        </aside>
      </section>

      {dragGhost && <div
        className={`drag-copy ${dragGhost.payload.kind} ${dragGhost.payload.kind === "action" ? `action-${dragGhost.payload.value}` : ""} ${dragGhost.returning ? "returning" : ""}`}
        style={{ left: dragGhost.x, top: dragGhost.y }}
        aria-hidden="true"
      ><span>⠿</span><b>{dragGhost.payload.label}</b></div>}

      {feedback && <div className="success-overlay result-overlay" role="dialog" aria-modal="true" aria-label={feedback.type === "success" ? "修复成功" : "修复结果提示"}><div className={`result-card ${feedback.type}`}><div className="result-icon">{feedback.type === "success" ? "🎉" : "💡"}</div><h2>{feedback.title}</h2><p>{feedback.message}</p><button onClick={() => setFeedback(null)}>{feedback.type === "success" ? "确定" : "返回修改"}</button></div></div>}
    </main>
  );
}
