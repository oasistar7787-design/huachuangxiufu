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

test("renders the Red Flag Canal NFC journey prototype", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>我是一滴漳河水｜红旗渠 NFC 数字集章<\/title>/);
  assert.match(html, /把水引过太行山/);
  assert.match(html, /红旗渠分水闸/);
  assert.match(html, /坎儿井复刻展陈/);
  assert.match(html, /红旗渠曙光洞/);
  assert.match(html, /红旗渠曙光渡槽/);
  assert.match(html, /一碰打卡/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});
