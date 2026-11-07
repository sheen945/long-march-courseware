const bundleUrl = new URL("./assets/index-j2Su3uB2.js", import.meta.url);
function status(failed = false) {
  document.getElementById('lm-map-startup')?.remove();
  const panel = document.createElement('div'); panel.id = 'lm-map-startup'; panel.setAttribute('role','status');
  panel.style.cssText = 'position:fixed;inset:0;z-index:9997;display:grid;place-content:center;gap:16px;text-align:center;background:#1c211f;color:#eadbb4;font:17px system-ui';
  if (failed) {
    const text = document.createElement('span'); text.textContent = '地图暂未载入，请稍后重试。';
    const button = document.createElement('button'); button.textContent = '重新加载地图'; button.type = 'button';
    button.style.cssText = 'padding:10px 24px;background:#8c2d25;color:#f0dfb8;border:1px solid #a5874e;border-radius:5px;cursor:pointer';
    button.addEventListener('click', () => (window.LongMarchSave ? window.LongMarchSave.reload() : location.reload()));
    panel.append(text,button);
  } else {
    const ring = document.createElement('span'); ring.setAttribute('aria-label','正在加载地图');
    ring.style.cssText = 'width:32px;height:32px;border:3px solid #a5874e44;border-top-color:#c8a45f;border-radius:50%;margin:auto;animation:lm-map-spin 1s linear infinite';
    const style = document.createElement('style'); style.textContent = '@keyframes lm-map-spin{to{transform:rotate(360deg)}}';panel.append(style,ring);
  }
  document.body.append(panel);
}
async function boot() {
  status();
  const fetch = input => window.LongMarchResources?.read(input) || window.fetch(input);
  try {
    await window.LongMarchResources?.beforeMapModule();
await import(bundleUrl.href);

    document.getElementById('lm-map-startup')?.remove();
  } catch { status(true); }
}
await boot();
