"use client";

import { useEffect, useMemo, useState } from "react";

type Station = {
  id: number; name: string; short: string; action: string; stamp: string;
  kicker: string; fact: string; story: string; position: string;
};

const stations: Station[] = [
  { id: 1, name: "红旗渠分水闸", short: "分水调度", action: "回旋", stamp: "闸", kicker: "第一站 · 水量调度心脏", fact: "总干渠来水在此分入一、二、三干渠，把漳河水送往村庄与农田。", story: "我是来自漳河的一滴小水，历经艰险翻越太行主脉，抵达整条干渠的水量调度心脏。闸门起落，决定多少水流向村庄农田。十万修渠人把我送过太行，到这里才真正完成“分水润林州”的关键一步。", position: "station-one" },
  { id: 2, name: "坎儿井复刻展陈", short: "古今对话", action: "驻足", stamp: "井", kicker: "第二站 · 一明一暗的治水智慧", fact: "红旗渠跨山引外水，坎儿井地下取潜流，两种抗旱智慧在这里相遇。", story: "顺着渠岸缓缓流淌，我驻足坎儿井复刻展点。红旗渠跨山远距离引外来河水，坎儿井依靠竖井串联地下暗渠。一明一暗、一引一蓄，两套相隔千里的治水智慧在此相遇。", position: "station-two" },
  { id: 3, name: "红旗渠曙光洞", short: "穿山攻坚", action: "穿洞", stamp: "洞", kicker: "第三站 · 穿透卢寨岭", fact: "34个竖井双向对打，建设者用钢钎铁锤凿出近四千米地下通道。", story: "重重太行山体横断前路，我涌入曙光洞。工人们开挖34个竖井，从山腹双向对打，在不见日月的地下仅凭钢钎铁锤，历时两年多凿通近四千米通道，让我不必绕山损失水位。", position: "station-three" },
  { id: 4, name: "红旗渠曙光渡槽", short: "凌空越谷", action: "飞跃", stamp: "渡", kicker: "第四站 · 水上天桥", fact: "石砌渡槽横跨鲁家沟，保住水流落差，与曙光洞共同接续引水。", story: "穿出曙光洞，鲁家沟横挡去路，我来到曙光渡槽。林县群众就地采石，肩挑背扛砌起空中渡槽。我在高高的槽身内平稳奔流：隧洞解决“过山”，渡槽解决“越谷”。", position: "station-four" },
];

function Drop({ mood = "smile", small = false }: { mood?: string; small?: boolean }) {
  return <div className={`drop ${small ? "drop-small" : ""} mood-${mood}`} aria-hidden="true"><span className="drop-shine" /><span className="drop-face">{mood === "fly" ? "›ᴗ‹" : mood === "look" ? "•ᴗ•" : "˘ᴗ˘"}</span>{!small && <span className="drop-scarf" />}</div>;
}

function Stamp({ station, active }: { station: Station; active: boolean }) {
  return <div className={`stamp ${active ? "is-active" : ""}`} aria-label={`${station.name}${active ? "已点亮" : "未点亮"}`}><div className="stamp-inner"><span className="stamp-mark">{station.stamp}</span><span>{station.id}/4</span></div></div>;
}

export default function Home() {
  const [collected, setCollected] = useState<number[]>([1]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [nfcStation, setNfcStation] = useState<Station | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { const saved = window.localStorage.getItem("water-route-stamps"); if (saved) setCollected(JSON.parse(saved)); }, []);
  const progress = Math.round((collected.length / stations.length) * 100);
  const nextStation = useMemo(() => stations.find((station) => !collected.includes(station.id)) ?? stations[3], [collected]);

  function collect(station: Station) {
    const next = Array.from(new Set([...collected, station.id])).sort();
    setCollected(next); window.localStorage.setItem("water-route-stamps", JSON.stringify(next));
    setNfcStation(null); setSelected(station);
    if (next.length === 4) window.setTimeout(() => setShowComplete(true), 550);
  }
  function reset() { setCollected([]); window.localStorage.removeItem("water-route-stamps"); setToast("已重置，可从第一站重新体验"); window.setTimeout(() => setToast(""), 2200); }
  function savePostcard() { setToast("明信片已模拟保存到相册"); window.setTimeout(() => setToast(""), 2200); }

  return <main className="site-shell">
    <section className="brief-panel" aria-label="原型说明">
      <p className="eyebrow">RED FLAG CANAL · NFC JOURNEY</p><h1>我是一滴<br />漳河水</h1>
      <p className="brief-lead">沿真实水路，完成一场“分水—观井—穿山—越谷”的沉浸式数字集章。</p><div className="brief-rule" />
      <div className="brief-flow"><span>01 寻找水滴标识</span><i /><span>02 手机轻触 NFC</span><i /><span>03 阅读故事明信片</span><i /><span>04 点亮工程印章</span></div>
      <div className="prototype-note"><span>交互原型</span><p>点击任一点位可看故事；点击底部“一碰打卡”模拟实地 NFC 触发。</p></div>
    </section>

    <section className="phone-frame" aria-label="红旗渠数字集章小程序原型">
      <div className="phone-status"><span>9:41</span><span>●●● ᯤ ▰</span></div>
      <header className="mini-header"><button aria-label="返回" className="icon-button">‹</button><div><strong>我是一滴漳河水</strong><span>太行引水 · 数字集章</span></div><button aria-label="更多" className="more-button">•••</button></header>
      <div className="map-scroll">
        <div className="hero-copy"><p>跟着漳河水，翻越太行</p><h2>把水引过太行山</h2></div>
        <div className="progress-card">
          <div className="progress-top"><div><b>{collected.length}</b><span>/ 4 枚印章</span></div><span>{collected.length === 4 ? "旅程已完成" : `下一站 · ${nextStation.short}`}</span></div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          <div className="stamp-row">{stations.map((station) => <Stamp key={station.id} station={station} active={collected.includes(station.id)} />)}</div>
        </div>
        <div className="route-map">
          <div className="sun-disc" /><div className="mountain mountain-one" /><div className="mountain mountain-two" /><div className="ridge ridge-one" /><div className="ridge ridge-two" /><div className="water-path water-one" /><div className="water-path water-two" /><div className="water-path water-three" /><div className="route-caption">漳河水行进路线</div>
          {stations.map((station) => { const done = collected.includes(station.id); return <button className={`map-station ${station.position} ${done ? "is-done" : ""}`} key={station.id} onClick={() => setSelected(station)} aria-label={`查看${station.name}`}><span className="station-number">{done ? "✓" : `0${station.id}`}</span><span className="station-copy"><small>{station.kicker.split("·")[0]}</small><b>{station.name}</b><em>{station.short}</em></span><span className="station-drop"><Drop small mood={station.id === 2 ? "look" : station.id === 4 ? "fly" : "smile"} /></span></button>; })}
          <div className="finish-flag">林州田野 <span>⚑</span></div>
        </div>
      </div>
      <nav className="bottom-bar" aria-label="主要操作"><button className="nav-item is-current"><span>⌁</span>水路</button><button className="nfc-button" onClick={() => setNfcStation(nextStation)}><span className="nfc-waves">)))</span><b>一碰打卡</b></button><button className="nav-item" onClick={() => setShowComplete(true)}><span>✺</span>我的章</button></nav>
    </section>

    <aside className="asset-panel"><div><span className="asset-number">4</span><p>个真实工程点位</p></div><ul><li><b>核心结构</b><span>路线总览 / NFC 触发 / 明信片 / 集章完成</span></li><li><b>故事节奏</b><span>回旋 → 驻足 → 穿洞 → 飞跃</span></li><li><b>视觉基调</b><span>太行石青、漳河蓝、邮戳朱红</span></li></ul><button onClick={reset}>重置演示进度 ↺</button></aside>

    {nfcStation && <div className="overlay nfc-overlay" role="dialog" aria-modal="true" aria-label="NFC 打卡模拟"><button className="overlay-close" onClick={() => setNfcStation(null)}>×</button><div className="nfc-scene"><span className="nfc-ring ring-one" /><span className="nfc-ring ring-two" /><Drop mood={nfcStation.id === 4 ? "fly" : "smile"} /></div><p className="eyebrow">NFC NEAR FIELD JOURNEY</p><h3>找到我啦！</h3><p>你已抵达「{nfcStation.name}」<br />让我们继续顺水前行。</p><button className="primary-button" onClick={() => collect(nfcStation)}>开启水滴故事</button><small>原型中点击按钮模拟手机触碰 NFC 标签</small></div>}

    {selected && <div className="overlay postcard-overlay" role="dialog" aria-modal="true" aria-label={`${selected.name}明信片`}><button className="overlay-close dark" onClick={() => setSelected(null)}>×</button><div className="postcard-image"><div className="image-placeholder"><span>点位实景图 · 待补充</span><small>建议 4:3 横图 / 现场环境 + 工程主体</small></div><span className="postcard-index">0{selected.id}</span><Drop mood={selected.id === 2 ? "look" : selected.id === 4 ? "fly" : "smile"} /><Stamp station={selected} active={collected.includes(selected.id)} /></div><div className="postcard-content"><p className="postcard-kicker">{selected.kicker}</p><h3>{selected.name}</h3><p className="fact-line">{selected.fact}</p><p className="story-copy">{selected.story}</p><div className="postcard-actions">{!collected.includes(selected.id) && <button className="primary-button" onClick={() => collect(selected)}>点亮这枚印章</button>}{collected.includes(selected.id) && <button className="primary-button" onClick={savePostcard}>保存故事明信片</button>}<button className="text-button" onClick={() => setSelected(null)}>返回水路</button></div></div></div>}

    {showComplete && <div className="overlay complete-overlay" role="dialog" aria-modal="true" aria-label="集章进度"><button className="overlay-close" onClick={() => setShowComplete(false)}>×</button><p className="eyebrow">MY WATER JOURNEY</p><h3>{collected.length === 4 ? "我把水引过了太行山" : "我的引水旅程"}</h3><p>{collected.length === 4 ? "一洞一槽，一渠清水。四段治水故事已全部珍藏。" : `已点亮 ${collected.length} 枚印章，还有 ${4 - collected.length} 站等待出发。`}</p><div className="complete-stamps">{stations.map((station) => <Stamp key={station.id} station={station} active={collected.includes(station.id)} />)}</div><div className="share-card"><Drop small /><span>红旗渠研学纪念</span><b>{progress}%</b><em>把水引过太行山</em></div><button className="primary-button" onClick={savePostcard}>{collected.length === 4 ? "保存集章海报" : "保存当前进度"}</button></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
