"use client";

import { useEffect, useMemo, useState } from "react";

type Station = {
  id: number; name: string; short: string; action: string; stampImage: string;
  kicker: string; fact: string; story: string; position: string; postcard: string; character: string;
};

const stations: Station[] = [
  { id: 1, name: "红旗渠分水闸", short: "分水调度", action: "回旋", stampImage: "stamps/01-fenshuizha.png", kicker: "第一站 · 水量调度心脏", fact: "总干渠来水在此分入一、二、三干渠，把漳河水送往村庄与农田。", story: "我是来自漳河的一滴小水，历经艰险翻越太行主脉，抵达红旗渠分水闸——整条干渠的水量调度心脏。当年红旗渠总干渠引水至此，林县人民修建这座分水枢纽，把从漳河远道而来的来水，按实际需求分配给一、二、三干渠。闸门起落，决定多少水流向村庄农田，化解南北区域用水矛盾。十万修渠人千辛万苦把我送过太行山，到这里才真正完成“分水润林州”的关键一步。我在闸前回旋，仿佛看见管护人员常年在此值守，观测水位、调节闸板，让每一滴水都物尽其用。告别总干渠，我顺着分支渠道散开，奔赴干涸的坡地村落，将太行之外的活水，送进世代盼雨的林县大地。", position: "station-one", postcard: "postcards/01-fenshuizha.png", character: "characters/01-fenshuizha.png" },
  { id: 2, name: "坎儿井复刻展陈", short: "古今对话", action: "驻足", stampImage: "stamps/02-kanerjing.png", kicker: "第二站 · 一明一暗的治水智慧", fact: "红旗渠跨山引外水，坎儿井地下取潜流，两种抗旱智慧在这里相遇。", story: "顺着渠岸缓缓流淌，我驻足红旗渠园区内的坎儿井复刻展点。我奔流在太行山间露天石渠，而坎儿井，是西北大地独有的抗干旱创造。它不靠开山明渠，依靠竖井串联地下暗渠，深埋地下规避强日照蒸发，截取雪山地下水滋养戈壁绿洲。同样是向干旱宣战，红旗渠是跨山远距离引外来河水，坎儿井是就地取用地下潜流，一明一暗、一引一蓄，两套相隔千里的治水智慧在此相遇。站在展陈旁，我读懂，无论中原还是西北，不甘被旱魔困住的信念是相通的。我继续向前奔涌，更明白自己这翻山而来的流水，何其珍贵。", position: "station-two", postcard: "postcards/02-kanerjing.png", character: "characters/02-kanerjing.png" },
  { id: 3, name: "红旗渠曙光洞", short: "穿山攻坚", action: "穿洞", stampImage: "stamps/03-shuguangdong.png", kicker: "第三站 · 穿透卢寨岭", fact: "34个竖井双向对打，建设者用钢钎铁锤凿出近四千米地下通道。", story: "重重太行山体横断前路，我涌入曙光洞，这是红旗渠全线最长的无压输水隧洞。当年修渠线路被巍峨的卢寨岭完全阻隔，绕路就要大量损失水位，工程队决定直接凿穿山体。工人们开挖34个竖井，从山体几十米深处双向对打，在不见日月的山腹之内，仅凭钢钎铁锤，历时两年多凿通这条近四千米的地下通道。没有大型掘进设备，全靠人力清渣运石，无数建设者在幽暗山腹中日夜劳作。我穿行于阴冷的隧洞内壁，岩壁留存着人工开凿的痕迹。曙光洞不只是简单山洞，它保住渠水水位，让我不用盘山绕远，直接穿透整座大山。", position: "station-three", postcard: "postcards/03-shuguangdong.png", character: "characters/03-shuguangdong.png" },
  { id: 4, name: "红旗渠曙光渡槽", short: "凌空越谷", action: "飞跃", stampImage: "stamps/04-shuguangduqiao.png", kicker: "第四站 · 水上天桥", fact: "石砌渡槽横跨鲁家沟，保住水流落差，与曙光洞共同接续引水。", story: "穿出曙光洞，幽深宽阔的鲁家沟横挡去路，深谷切断渠身，我来到曙光渡槽。大山可以凿洞穿越，但宽阔深谷无法填埋，林县群众就地开山采石，肩挑背扛砌筑起这座空中石砌渡槽。整座渡槽横跨百米沟壑，把渠水抬升到高空，让我不用下到谷底再费力爬坡，保全水流落差，保障下游灌区供水。一块块粗粝青石，都是群众从山间开采搬运而来。我在高高的槽身之内平稳奔流，脚下是数十米深的山谷。隧洞解决“过山”难题，渡槽解决“越谷”难题。曙光洞打通山体，曙光渡槽飞越沟壑，一洞一槽接续配合，共同托举我越过太行重重天险，奔向更辽阔的田野。", position: "station-four", postcard: "postcards/04-shuguangduqiao.png", character: "characters/04-shuguangduqiao.png" },
];

function Drop({ mood = "smile", small = false }: { mood?: string; small?: boolean }) {
  return <div className={`drop ${small ? "drop-small" : ""} mood-${mood}`} aria-hidden="true"><span className="drop-shine" /><span className="drop-face">{mood === "fly" ? "›ᴗ‹" : mood === "look" ? "•ᴗ•" : "˘ᴗ˘"}</span>{!small && <span className="drop-scarf" />}</div>;
}

function Stamp({ station, active }: { station: Station; active: boolean }) {
  return <div className={`stamp ${active ? "is-active" : ""}`} aria-label={`${station.name}${active ? "已点亮" : "未点亮"}`}><img src={station.stampImage} alt="" /><span className="stamp-status" aria-hidden="true">{active ? "✓" : station.id}</span></div>;
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
        <div className="hero-copy"><p>跟着漳河水，翻越太行</p><h2>把水引过太行山</h2><img className="hero-character" src="characters/front.png" alt="小水滴角色正面形象" /></div>
        <div className="progress-card">
          <div className="progress-top"><div><b>{collected.length}</b><span>/ 4 枚印章</span></div><span>{collected.length === 4 ? "旅程已完成" : `下一站 · ${nextStation.short}`}</span></div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          <div className="stamp-row">{stations.map((station) => <Stamp key={station.id} station={station} active={collected.includes(station.id)} />)}</div>
        </div>
        <div className="route-map">
          <img className="point-map" src="route-map.jpg" alt="红旗渠四个 NFC 打卡点位及游览路线图" />
          <div className="route-tip">点击点位查看故事明信片</div>
          {stations.map((station) => { const done = collected.includes(station.id); return <button className={"map-hotspot hotspot-" + station.id + (done ? " is-done" : "")} key={station.id} onClick={() => setSelected(station)} aria-label={"查看" + station.name}><span>{done ? "✓" : ""}</span></button>; })}
        </div>
      </div>
      <nav className="bottom-bar" aria-label="主要操作"><button className="nav-item is-current"><span>⌁</span>水路</button><button className="nfc-button" onClick={() => setNfcStation(nextStation)}><span className="nfc-waves">)))</span><b>一碰打卡</b></button><button className="nav-item" onClick={() => setShowComplete(true)}><span>✺</span>我的章</button></nav>
    </section>

    <aside className="asset-panel"><div><span className="asset-number">4</span><p>个真实工程点位</p></div><ul><li><b>核心结构</b><span>路线总览 / NFC 触发 / 明信片 / 集章完成</span></li><li><b>故事节奏</b><span>回旋 → 驻足 → 穿洞 → 飞跃</span></li><li><b>视觉基调</b><span>太行石青、漳河蓝、邮戳朱红</span></li></ul><button onClick={reset}>重置演示进度 ↺</button></aside>

    {nfcStation && <div className="overlay nfc-overlay" role="dialog" aria-modal="true" aria-label="NFC 打卡模拟"><button className="overlay-close" onClick={() => setNfcStation(null)}>×</button><div className="nfc-scene"><span className="nfc-ring ring-one" /><span className="nfc-ring ring-two" /><img className="nfc-character" src={nfcStation.character} alt={`${nfcStation.name}小水滴角色`} /></div><p className="eyebrow">NFC NEAR FIELD JOURNEY</p><h3>找到我啦！</h3><p>你已抵达「{nfcStation.name}」<br />让我们继续顺水前行。</p><button className="primary-button" onClick={() => collect(nfcStation)}>开启水滴故事</button><small>原型中点击按钮模拟手机触碰 NFC 标签</small></div>}

    {selected && <div className="overlay postcard-overlay" role="dialog" aria-modal="true" aria-label={`${selected.name}明信片`}><button className="overlay-close dark postcard-close" onClick={() => setSelected(null)}>×</button><div className="postcard-image"><img src={selected.postcard} alt={`${selected.name}主题明信片`} /></div><div className="postcard-content"><p className="postcard-kicker">{selected.kicker}</p><h3>{selected.name}</h3><p className="fact-line">{selected.fact}</p><p className="story-copy">{selected.story}</p><div className="postcard-actions">{!collected.includes(selected.id) && <button className="primary-button" onClick={() => collect(selected)}>点亮这枚印章</button>}{collected.includes(selected.id) && <button className="primary-button" onClick={savePostcard}>保存故事明信片</button>}<button className="text-button" onClick={() => setSelected(null)}>返回水路</button></div></div></div>}

    {showComplete && <div className="overlay complete-overlay" role="dialog" aria-modal="true" aria-label="集章进度"><button className="overlay-close" onClick={() => setShowComplete(false)}>×</button><p className="eyebrow">MY WATER JOURNEY</p><h3>{collected.length === 4 ? "我把水引过了太行山" : "我的引水旅程"}</h3><p>{collected.length === 4 ? "一洞一槽，一渠清水。四段治水故事已全部珍藏。" : `已点亮 ${collected.length} 枚印章，还有 ${4 - collected.length} 站等待出发。`}</p><div className="complete-stamps">{stations.map((station) => <Stamp key={station.id} station={station} active={collected.includes(station.id)} />)}</div><div className="share-card"><img className="share-character" src="characters/front.png" alt="小水滴角色正面形象" /><span>红旗渠研学纪念</span><b>{progress}%</b><em>把水引过太行山</em></div><button className="primary-button" onClick={savePostcard}>{collected.length === 4 ? "保存集章海报" : "保存当前进度"}</button></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
