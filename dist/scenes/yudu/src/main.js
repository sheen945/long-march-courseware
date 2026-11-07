import { LongMarchEngine } from "./engine/LongMarchEngine.js";

const loadingText = document.querySelector("#loading p");
const engine = new LongMarchEngine(document.getElementById("viewport"));

engine.start().catch(error => {
  console.error(error);
  loadingText.textContent = `场景加载失败：${error.message}`;
});

window.longMarchEngine = engine;
