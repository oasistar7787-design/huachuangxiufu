import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the garden-window transformation game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>园林窗韵修复师｜图形变换拼图游戏<\/title>/);
  assert.match(html, /园林窗韵修复师/);
  assert.match(html, /修复工坊/);
  assert.match(html, /修复指令/);
  assert.match(html, /平移/);
  assert.match(html, /旋转/);
  assert.match(html, /轴对称/);
  assert.match(html, /标记十二个点 A、B、C、D、E、F、G、H、M、N、P、O/);
  assert.match(html, /将右侧动作模块拖到这里/);
  assert.match(html, /轴对称参数/);
  assert.match(html, /MH/);
  assert.match(html, /180°/);
  assert.doesNotMatch(html, /270°/);
  assert.doesNotMatch(html, /拖动观察|拿走末条|第 1 关|月洞寻韵/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});
