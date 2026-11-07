var QRCode = {
  toCanvas: function (_0x21e56b, _0x526dc2, _0x3cb6ea) {
    var _0x387881 = new Image();
    _0x387881.crossOrigin = "anonymous";
    var _0x469f81 = _0x3cb6ea && _0x3cb6ea.width || 200;
    _0x387881.onload = function () {
      _0x21e56b.width = _0x469f81;
      _0x21e56b.height = _0x469f81;
      _0x21e56b.getContext("2d").drawImage(_0x387881, 0, 0, _0x469f81, _0x469f81);
    };
    _0x387881.onerror = function () {
      _0x21e56b.width = _0x469f81;
      _0x21e56b.height = _0x469f81;
      var _0x444b78 = _0x21e56b.getContext("2d");
      _0x444b78.fillStyle = "#fff";
      _0x444b78.fillRect(0, 0, _0x469f81, _0x469f81);
      _0x444b78.fillStyle = "#ef4444";
      _0x444b78.font = "14px sans-serif";
      _0x444b78.textAlign = "center";
      _0x444b78.fillText("二维码加载失败", _0x469f81 / 2, _0x469f81 / 2);
    };
    _0x387881.src = "https://api.qrserver.com/v1/create-qr-code/?size=" + _0x469f81 + "x" + _0x469f81 + "&data=" + encodeURIComponent(_0x526dc2);
  }
};
let PROGRAMS = [];
let GUEST_PROGRAMS_LIMITED = false;
let programsLoadedForToken = null;
let revealedCourseLink = "";
const SUBJECTS = ["全部", "物理", "化学", "数学", "生物", "地理", "语文", "英语", "历史", "政治/道法", "音乐", "美术", "体育", "信息技术", "通用技术", "心理健康", "科学", "课堂小游戏", "班级管理", "其他"];
const GRADES = ["全部", "小学", "初中", "高中", "大学", "通用"];
const GRADE_LEVELS = {
  全部: [],
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["七年级", "八年级", "九年级"],
  高中: ["高一", "高二", "高三"],
  大学: [],
  通用: []
};
const TYPES = ["全部", "教学演示", "课堂互动", "教师工具", "作业批改"];
const RES_TYPES = ["全部", "课件", "视频", "文档", "图片素材", "音频"];
const RESOURCES = [];
const API_BASE = "";
const ALLOWED_HOSTS = ["aifunengjiaoyu.com", "www.aifunengjiaoyu.com", "localhost", "127.0.0.1"];
async function loadProgramsFromDatabase(_0x1cd792) {
  try {
    const _0x1fb113 = localStorage.getItem("aiedu_token");
    const _0x2e2804 = _0x1fb113 ? {
      Authorization: "Bearer " + _0x1fb113
    } : {};
    const _0x200921 = await fetch(API_BASE + "/api/programs", {
      headers: _0x2e2804
    });
    const _0x30d536 = await _0x200921.json();
    if (_0x1cd792 && _0x1cd792.throwOnError && (!_0x200921.ok || !_0x30d536 || _0x30d536.success !== true)) {
      throw new Error("PROGRAM_LIST_REFRESH_FAILED");
    }
    if (_0x30d536.success) {
      PROGRAMS = _0x30d536.programs;
      programsLoadedForToken = _0x1fb113 || "";
      GUEST_PROGRAMS_LIMITED = !!_0x30d536.guestLimited;
      if (State.user) {
        try {
          const _0x8ea44f = await apiFetch("/api/user/purchases");
          if (_0x8ea44f.success && _0x8ea44f.purchasedIds) {
            State.purchases = _0x8ea44f.purchasedIds;
            State.save();
          }
        } catch (_0x1f7123) {}
      }
      if (typeof render === "function" && (!_0x1cd792 || _0x1cd792.render !== false)) {
        render();
      }
    }
  } catch (_0x217234) {
    console.error("加载作品失败", _0x217234);
    if (_0x1cd792 && _0x1cd792.throwOnError) {
      throw _0x217234;
    }
  }
}
let vipPricingEnabled = false;
let premiumCatalogueEnabled = false;
let premiumPlaybackEnabled = false;
const State = {
  user: JSON.parse(localStorage.getItem("aiedu_user") || "null"),
  token: localStorage.getItem("aiedu_token") || null,
  purchases: JSON.parse(localStorage.getItem("aiedu_purchases") || "[]"),
  membership: JSON.parse(localStorage.getItem("aiedu_membership") || "false"),
  resPurchases: JSON.parse(localStorage.getItem("aiedu_res_purchases") || "[]"),
  currentPage: "home",
  filters: {
    subject: "全部",
    grade: "全部",
    gradeLevel: "",
    type: "全部",
    search: ""
  },
  currentSort: "recommended",
  resFilters: {
    resType: "全部",
    subject: "全部",
    search: ""
  },
  save() {
    localStorage.setItem("aiedu_user", JSON.stringify(this.user));
    if (this.token) {
      localStorage.setItem("aiedu_token", this.token);
    }
    localStorage.setItem("aiedu_purchases", JSON.stringify(this.purchases));
    localStorage.setItem("aiedu_membership", JSON.stringify(this.membership));
    localStorage.setItem("aiedu_res_purchases", JSON.stringify(this.resPurchases));
  },
  clear() {
    hidePointsModal();
    pointsWallet?.invalidate();
    this.user = null;
    this.token = null;
    this.purchases = [];
    this.membership = false;
    this.resPurchases = [];
    ["aiedu_user", "aiedu_token", "aiedu_purchases", "aiedu_membership", "aiedu_res_purchases"].forEach(_0x21f61d => localStorage.removeItem(_0x21f61d));
  },
  async refreshPoints() {
    return pointsWallet?.refresh({
      force: true,
      verify: true
    });
  }
};
loadProgramsFromDatabase();
var pointsWallet = window.TuringPointsWallet.create({
  token: () => localStorage.getItem("aiedu_token") || "",
  onVerified(_0x2c2e38) {
    const _0x4782e0 = !State.user || !State.user.wechatId;
    State.user = {
      ...(State.user || {}),
      ..._0x2c2e38,
      wechatId: _0x2c2e38.wechatId || _0x2c2e38.openid
    };
    State.membership = !!_0x2c2e38.isMember;
    State.save();
    if (_0x4782e0 && typeof render === "function") {
      render();
    }
    if (_0x2c2e38.profileCompleted === false) {
      setTimeout(() => {
        if (State.user?.wechatId === (_0x2c2e38.wechatId || _0x2c2e38.openid) && !document.getElementById("profile-name")) {
          showProfileModal();
        }
      }, 100);
    }
  },
  onExpired() {
    State.clear();
    if (typeof render === "function") {
      render();
    }
    toast("登录已过期，请重新扫码登录", "error");
  }
});
pointsWallet.subscribe(_0x3dea11 => {
  if (_0x3dea11.status === "ready" && State.user) {
    State.user.points = _0x3dea11.total;
    State.save();
    const _0x1030a5 = document.querySelector(".ai-chat-iframe");
    if (_0x1030a5?.contentWindow) {
      _0x1030a5.contentWindow.postMessage({
        type: "tuxiaoling-points-refresh"
      }, location.origin);
    }
  }
  updatePointsDisplay();
});
pointsWallet.watch({
  onAccountChange: () => window.location.reload()
});
pointsWallet.refresh({
  verify: true
});
if (State.user && (!State.user.name || String(State.user.name).trim() === "null" || String(State.user.name).trim() === "")) {
  State.user.name = "教师用户";
  State.save();
}
async function apiFetch(_0x4f10e8, _0xb75a9d = {}) {
  const _0x4f26c8 = {
    "Content-Type": "application/json",
    ..._0xb75a9d.headers
  };
  if (State.token) {
    _0x4f26c8.Authorization = "Bearer " + State.token;
  }
  try {
    const _0x4f14f6 = await fetch(API_BASE + _0x4f10e8, {
      ..._0xb75a9d,
      headers: _0x4f26c8
    });
    if (_0x4f14f6.status === 401 || _0x4f14f6.status === 403) {
      const _0x2e4e67 = await _0x4f14f6.json().catch(() => ({}));
      if (_0x2e4e67.msg && _0x2e4e67.msg.includes("其他设备") || _0x2e4e67.code === "SSO_CONFLICT") {
        showSSOAlert();
        return {
          code: 403,
          msg: "SSO冲突"
        };
      }
      State.clear();
      render();
      toast("登录已过期，请重新登录", "error");
      return {
        code: 401,
        msg: "未授权"
      };
    }
    return await _0x4f14f6.json();
  } catch (_0xb3881d) {
    console.error("[API]", _0xb3881d);
    return {
      code: -1,
      msg: "网络错误，请检查网络连接"
    };
  }
}
function showSSOAlert() {
  const _0x58d69b = $(".sso-alert-overlay");
  if (_0x58d69b) {
    _0x58d69b.remove();
  }
  const _0x485869 = document.createElement("div");
  _0x485869.className = "sso-alert-overlay";
  _0x485869.innerHTML = "\n    <div class=\"sso-alert-box\">\n      <div style=\"font-size:48px;margin-bottom:16px\">⚠️</div>\n      <h3>账号异常</h3>\n      <p>您的账号已在其他设备登录。如非本人操作，请尽快修改密码。</p>\n      <button class=\"btn btn-primary\" onclick=\"State.clear();this.closest('.sso-alert-overlay').remove();showAuthModal();render()\">重新登录</button>\n    </div>";
  document.body.appendChild(_0x485869);
}
function $(_0x2b5c92, _0x30fa97 = document) {
  return _0x30fa97.querySelector(_0x2b5c92);
}
function $$(_0xdcc61c, _0xe9f8e0 = document) {
  return [..._0xe9f8e0.querySelectorAll(_0xdcc61c)];
}
function htmlEscape(_0x74390b) {
  if (typeof _0x74390b !== "string") {
    return "";
  }
  var _0x3905ea = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };
  return _0x74390b.replace(/[&<>"']/g, function (_0x1b3dae) {
    return _0x3905ea[_0x1b3dae];
  });
}
function programVideoPublicUrl(_0x56bbda) {
  if (!_0x56bbda || !_0x56bbda.video_url) {
    return "";
  }
  var _0x18059c = String(_0x56bbda.video_url || "");
  if (/^https?:\/\//i.test(_0x18059c)) {
    return _0x18059c;
  } else {
    return API_BASE + _0x18059c;
  }
}
async function downloadProgramAttachment(_0x48c124) {
  if (!State.token) {
    return showAuthModal();
  }
  try {
    var _0x498666 = await apiFetch("/api/programs/" + encodeURIComponent(_0x48c124) + "/access-token");
    if (!_0x498666.success || !_0x498666.token) {
      return toast(_0x498666.msg || "无附件访问权限", "error");
    }
    var _0x1bbb07 = API_BASE + "/api/programs/" + encodeURIComponent(_0x48c124) + "/attachment?token=" + encodeURIComponent(_0x498666.token);
    window.location.href = _0x1bbb07;
  } catch (_0x38a5d9) {
    toast("附件下载失败，请稍后重试", "error");
  }
}
function renderProgramVideoCoverButton(_0x1882f4) {
  if (!programVideoPublicUrl(_0x1882f4)) {
    return "";
  }
  return "<button type=\"button\" onclick=\"event.stopPropagation();openProgramVideo(" + Number(_0x1882f4.id) + ")\" style=\"position:absolute;left:14px;bottom:14px;z-index:5;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.55);background:rgba(15,23,42,.72);color:#fff;font-size:13px;font-weight:700;box-shadow:0 8px 22px rgba(15,23,42,.25);backdrop-filter:blur(8px);cursor:pointer\"><span style=\"font-size:16px\">▶</span><span>演示视频</span></button>";
}
function openProgramVideo(_0x4f0701) {
  var _0x2a18a6 = (PROGRAMS || []).find(function (_0x4f30b3) {
    return String(_0x4f30b3.id) === String(_0x4f0701);
  });
  var _0x2684ed = programVideoPublicUrl(_0x2a18a6);
  if (!_0x2684ed) {
    return toast("这个作品暂时没有演示视频", "info");
  }
  var _0x4cc69c = document.createElement("div");
  _0x4cc69c.className = "modal-overlay show";
  _0x4cc69c.onclick = function () {
    _0x4cc69c.remove();
  };
  _0x4cc69c.innerHTML = "<div class=\"modal\" onclick=\"event.stopPropagation()\" style=\"max-width:920px;padding:18px;background:#050816;color:#fff\"><div style=\"display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px\"><div style=\"font-size:18px;font-weight:700\">" + htmlEscape(_0x2a18a6 && _0x2a18a6.title || "作品演示视频") + "</div><button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').remove()\" style=\"color:#fff\">×</button></div><video src=\"" + htmlEscape(_0x2684ed) + "\" controls playsinline preload=\"metadata\" controlsList=\"nodownload\" style=\"display:block;width:100%;max-height:72vh;background:#000;border-radius:14px\"></video><div style=\"font-size:12px;color:rgba(255,255,255,.6);margin-top:10px\">演示视频仅用于了解作品效果；正式使用仍需按平台权限打开作品。</div></div>";
  var _0x3280f7 = _0x4cc69c.querySelector("video");
  if (_0x3280f7) {
    _0x3280f7.addEventListener("contextmenu", function (_0x38e06e) {
      _0x38e06e.preventDefault();
    });
  }
  document.body.appendChild(_0x4cc69c);
}
function toast(_0x469d11, _0x3e4c49 = "info") {
  let _0x3b0eac = $(".toast-container");
  if (!_0x3b0eac) {
    _0x3b0eac = document.createElement("div");
    _0x3b0eac.className = "toast-container";
    document.body.appendChild(_0x3b0eac);
  }
  const _0x3cc2ae = document.createElement("div");
  _0x3cc2ae.className = "toast " + _0x3e4c49;
  _0x3cc2ae.textContent = _0x469d11;
  _0x3b0eac.appendChild(_0x3cc2ae);
  setTimeout(() => {
    _0x3cc2ae.style.opacity = "0";
    _0x3cc2ae.style.transform = "translateX(30px)";
    setTimeout(() => _0x3cc2ae.remove(), 300);
  }, 3000);
}
function showUploadWarnings(_0x34a662) {
  if (!Array.isArray(_0x34a662)) {
    return;
  }
  const _0x547a87 = _0x34a662.filter(_0x81c753 => typeof _0x81c753 === "string" && _0x81c753.trim()).slice(0, 5).map(_0x28b787 => _0x28b787.slice(0, 300));
  if (_0x547a87.length) {
    alert("作品已保存。以下内容需要你在预览中核对，确认正常后再上架：\n\n" + _0x547a87.join("\n"));
  }
}
var pointsModalVisible = false;
var pointsSummaryDispose = null;
function updatePointsDisplay() {
  var _0x4746c5 = document.getElementById("points-display");
  var _0x5b6ae4 = pointsWallet?.snapshot();
  if (_0x4746c5) {
    _0x4746c5.textContent = _0x5b6ae4?.status === "ready" ? _0x5b6ae4.total : "—";
    _0x4746c5.title = _0x5b6ae4?.status === "error" ? "余额暂未确认，点击刷新" : "点击查看当前积分";
  }
}
function showDailyBonusAnimation(_0x4a9c56) {
  var _0x5cf5ca = document.getElementById("header-points-badge");
  if (!_0x5cf5ca) {
    return;
  }
  var _0x4b62b9 = _0x5cf5ca.getBoundingClientRect();
  var _0x1f601d = window.innerWidth / 2;
  var _0x533179 = window.innerHeight / 2;
  var _0x2cb628 = _0x4b62b9.left + _0x4b62b9.width / 2;
  var _0x1026b0 = _0x4b62b9.top + _0x4b62b9.height / 2;
  var _0x17ce53 = document.createElement("div");
  _0x17ce53.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;pointer-events:none;";
  var _0x44c467 = document.createElement("div");
  _0x44c467.style.cssText = ["position:absolute", "background:#fff", "border:1.5px solid var(--gray-200)", "border-radius:16px", "padding:28px 44px", "text-align:center", "box-shadow:0 8px 32px rgba(0,0,0,.12)", "left:" + _0x1f601d + "px", "top:" + _0x533179 + "px", "transform:translate(-50%,-50%) scale(0.2)", "opacity:0", "transition:all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"].join(";");
  _0x44c467.innerHTML = ["<div style=\"font-size:40px;margin-bottom:4px\">🎁</div>", "<div style=\"font-size:13px;color:var(--gray-500);font-weight:500\">每日登录</div>", "<div style=\"font-size:24px;font-weight:800;color:var(--gray-900);margin-top:2px\">+" + _0x4a9c56 + " 积分</div>"].join("");
  _0x17ce53.appendChild(_0x44c467);
  document.body.appendChild(_0x17ce53);
  requestAnimationFrame(function () {
    _0x44c467.style.opacity = "1";
    _0x44c467.style.transform = "translate(-50%,-50%) scale(1)";
  });
  setTimeout(function () {
    _0x44c467.style.transition = "all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    _0x44c467.style.left = _0x2cb628 + "px";
    _0x44c467.style.top = _0x1026b0 + "px";
    _0x44c467.style.transform = "translate(-50%,-50%) scale(0.05)";
    _0x44c467.style.opacity = "0";
  }, 1000);
  setTimeout(updatePointsDisplay, 1200);
  setTimeout(function () {
    if (_0x17ce53.parentNode) {
      _0x17ce53.parentNode.removeChild(_0x17ce53);
    }
  }, 3500);
}
function showPointsModal() {
  if (pointsModalVisible) {
    hidePointsModal();
    return;
  }
  if (!State.user) {
    showAuthModal();
    return;
  }
  pointsModalVisible = true;
  var _0x5a9bb5 = document.createElement("div");
  _0x5a9bb5.className = "points-modal-overlay";
  _0x5a9bb5.id = "points-modal-overlay";
  _0x5a9bb5.onclick = function (_0x1b0645) {
    if (_0x1b0645.target === _0x5a9bb5) {
      hidePointsModal();
    }
  };
  _0x5a9bb5.innerHTML = ["<div class=\"points-modal\">", "  <div class=\"points-modal-header\">", "    <h3>💰 我的积分</h3>", "    <button class=\"points-modal-close\" onclick=\"hidePointsModal()\">✕</button>", "  </div>", "  <div class=\"points-modal-body\">", "    <div class=\"points-balance-card\" id=\"points-wallet-summary\"></div>", "    <div class=\"points-rates\">", "      <h4>💡 积分规则</h4>", "      <ul>", "        <li><span class=\"kv\">注册</span> 新用户赠送 <strong>300</strong> 积分</li>", "        <li><span class=\"kv\">每天</span> 登录赠送 <strong>200</strong> 临时积分（当日有效、不累计）</li>", "        <li><span class=\"kv\">月卡</span> 每月赠送 <strong>2000</strong> 积分</li>", "        <li><span class=\"kv\">年卡</span> 每月赠送 <strong>3000</strong> 积分</li>", "      </ul>", "    </div>", "    <div class=\"points-recharge-section\">", "      <h4>🔋 积分充值</h4>", "      <p style=\"font-size:13px;color:var(--gray-500);margin-bottom:12px\">10元起充，1元 = 1000 积分</p>", "      <p style=\"font-size:13px;color:var(--gray-500);margin-bottom:12px\">积分用于课件生成和修改，用量随制作类型、资料规模及所用能力而变化。精细 3D 用量较高，实际消费可在明细中查询。</p>", "      <div class=\"points-recharge-presets\">", "        <button class=\"recharge-preset-btn active\" data-amount=\"10\">10元<br><small>10000分</small></button>", "        <button class=\"recharge-preset-btn\" data-amount=\"30\">30元<br><small>30000分</small></button>", "        <button class=\"recharge-preset-btn\" data-amount=\"50\">50元<br><small>50000分</small></button>", "        <button class=\"recharge-preset-btn\" data-amount=\"100\">100元<br><small>100000分</small></button>", "      </div>", "      <button class=\"btn btn-primary\" style=\"width:100%;margin-top:12px\" onclick=\"startPointsRecharge()\">立即充值</button>", "    </div>", "    <div id=\"points-history-panel\" style=\"margin-top:20px\"></div>", "  </div>", "</div>"].join("");
  document.body.appendChild(_0x5a9bb5);
  pointsSummaryDispose = window.TuringPointsWallet.mountSummary(_0x5a9bb5.querySelector("#points-wallet-summary"), pointsWallet);
  pointsWallet.refresh({
    force: true,
    verify: true
  });
  window.TuxiaolingPointsHistory.mount(_0x5a9bb5.querySelector("#points-history-panel"), {
    request: apiFetch,
    account: () => State.user?.wechatId || State.user?.openid || null
  });
  setTimeout(function () {
    _0x5a9bb5.querySelectorAll(".recharge-preset-btn").forEach(function (_0x54c402) {
      _0x54c402.onclick = function () {
        _0x5a9bb5.querySelectorAll(".recharge-preset-btn").forEach(function (_0x56ab7d) {
          _0x56ab7d.classList.remove("active");
        });
        this.classList.add("active");
      };
    });
  }, 50);
}
function hidePointsModal() {
  if (pointsSummaryDispose) {
    pointsSummaryDispose();
    pointsSummaryDispose = null;
  }
  pointsModalVisible = false;
  var _0xfbbd18 = document.getElementById("points-modal-overlay");
  if (_0xfbbd18) {
    _0xfbbd18.remove();
  }
}
function selectRechargePreset(_0x353b8f) {
  document.querySelectorAll(".recharge-preset-btn").forEach(function (_0x193e81) {
    _0x193e81.classList.remove("active");
  });
  document.querySelector(".recharge-preset-btn[data-amount=\"" + _0x353b8f + "\"]")?.classList.add("active");
}
async function startPointsRecharge() {
  if (!State.user) {
    showAuthModal();
    return;
  }
  var _0x3dbfad = document.querySelector(".recharge-preset-btn.active");
  var _0x4dd83c = _0x3dbfad ? parseInt(_0x3dbfad.dataset.amount) : 10;
  var _0x1a45c4 = document.querySelector(".points-recharge-section .btn");
  if (_0x1a45c4) {
    _0x1a45c4.disabled = true;
    _0x1a45c4.textContent = "正在生成支付...";
  }
  try {
    var _0x920c8e = await apiFetch("/api/points/create-points-order", {
      method: "POST",
      body: JSON.stringify({
        amount: _0x4dd83c
      })
    });
    if (_0x920c8e.success) {
      var _0x18f2fc = document.querySelector(".points-recharge-section");
      var _0x3cfe19 = document.createElement("div");
      _0x3cfe19.className = "points-qr-area";
      _0x3cfe19.innerHTML = ["<div style=\"text-align:center;padding:16px\">", "  <p style=\"font-size:13px;color:var(--gray-600);margin-bottom:12px\">请使用微信扫码支付 <strong>" + _0x4dd83c + "元</strong>（" + _0x920c8e.points + "积分）</p>", "  <div id=\"points-qr-canvas\" style=\"display:inline-block;background:#fff;padding:12px;border-radius:12px;border:1px solid var(--gray-200);\"><canvas></canvas></div>", "  <p id=\"points-pay-status\" style=\"font-size:12px;color:var(--blue-500);margin-top:8px\">⏳ 等待支付...</p>", "</div>"].join("\n");
      _0x18f2fc.appendChild(_0x3cfe19);
      var _0x9ca8d9 = _0x3cfe19.querySelector("canvas");
      QRCode.toCanvas(_0x9ca8d9, _0x920c8e.code_url, {
        width: 180,
        margin: 2
      });
      startPointsPolling(_0x920c8e.out_trade_no);
    } else {
      toast(_0x920c8e.msg || "下单失败", "error");
      if (_0x1a45c4) {
        _0x1a45c4.disabled = false;
        _0x1a45c4.textContent = "立即充值";
      }
    }
  } catch (_0x23510f) {
    toast("网络异常", "error");
    if (_0x1a45c4) {
      _0x1a45c4.disabled = false;
      _0x1a45c4.textContent = "立即充值";
    }
  }
}
var _pointsPollTimer = null;
function startPointsPolling(_0x18875e) {
  if (_pointsPollTimer) {
    clearInterval(_pointsPollTimer);
  }
  var _0x21de5d = 0;
  _pointsPollTimer = setInterval(async function () {
    _0x21de5d++;
    if (_0x21de5d > 180) {
      clearInterval(_pointsPollTimer);
      _pointsPollTimer = null;
      return;
    }
    try {
      var _0x35e739 = await apiFetch("/api/pay/query?out_trade_no=" + _0x18875e);
      if (_0x35e739.success && _0x35e739.status === "paid") {
        clearInterval(_pointsPollTimer);
        _pointsPollTimer = null;
        toast("充值成功 ✅", "success");
        await State.refreshPoints();
        var _0x507ff4 = document.getElementById("points-modal-balance");
        if (_0x507ff4) {
          _0x507ff4.textContent = State.user.points;
        }
        var _0x48800c = document.querySelector(".points-qr-area");
        if (_0x48800c) {
          _0x48800c.innerHTML = "<div style=\"text-align:center;padding:20px;color:var(--green-500)\">✅ 充值成功！<br><small style=\"color:var(--gray-400)\">积分已到账</small></div>";
          setTimeout(function () {
            _0x48800c.remove();
          }, 2000);
        }
        var _0x257170 = document.querySelector(".points-recharge-section .btn");
        if (_0x257170) {
          _0x257170.disabled = false;
          _0x257170.textContent = "继续充值";
        }
      }
    } catch (_0x4e069f) {}
  }, 1500);
}
function isSuperAdmin() {
  return State.user && State.user.role === "admin";
}
function isModerator() {
  return State.user && (State.user.role === "admin" || State.user.role === "moderator");
}
function hasStaffProgramAccess() {
  return !!isModerator();
}
function getTrials(_0x11302a) {
  return 3;
}
async function getTrialsAsync(_0x7bbf50) {
  if (!State.user) {
    return {
      used: 0,
      total: 3
    };
  }
  try {
    if (premiumPlaybackEnabled) {
      const _0x2a467f = await apiFetch("/api/premium/access");
      const _0x30aa40 = _0x2a467f.courses?.[_0x7bbf50];
      if (_0x30aa40?.premium) {
        return {
          premium: true,
          unlimited: _0x30aa40.allowed && _0x30aa40.sampleRemaining === null,
          sampleActive: _0x30aa40.allowed && _0x30aa40.sampleRemaining !== null,
          used: 10 - (_0x30aa40.sampleRemaining ?? 0),
          total: 10
        };
      }
    }
    const _0x5a4256 = await fetch(API_BASE + "/api/trials?program_id=" + _0x7bbf50, {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    const _0x1a2f48 = await _0x5a4256.json();
    if (_0x1a2f48.success) {
      return {
        used: _0x1a2f48.used,
        total: _0x1a2f48.total
      };
    }
  } catch (_0x4af343) {}
  return {
    used: 0,
    total: 3
  };
}
function hasPurchased(_0x31c337) {
  return State.membership || State.purchases.includes(_0x31c337);
}
function useTrialOnce(_0x5d59b1) {
  return true;
}
function programSubjects(_0x5bfcd6) {
  if (_0x5bfcd6 && Array.isArray(_0x5bfcd6.subjects) && _0x5bfcd6.subjects.length) {
    return _0x5bfcd6.subjects;
  }
  if (!_0x5bfcd6) {
    return [];
  }
  return [_0x5bfcd6.subject];
}
function filteredPrograms() {
  const _0x2de3f2 = PROGRAMS.filter(_0x3fd7be => {
    if (State.filters.subject !== "全部" && !programSubjects(_0x3fd7be).includes(State.filters.subject)) {
      return false;
    }
    if (State.filters.grade !== "全部" && _0x3fd7be.grade !== State.filters.grade) {
      return false;
    }
    if (State.filters.gradeLevel && _0x3fd7be.grade_level !== State.filters.gradeLevel) {
      return false;
    }
    if (State.filters.type !== "全部" && _0x3fd7be.type !== State.filters.type) {
      return false;
    }
    if (State.filters.search) {
      const _0x10102b = State.filters.search.toLowerCase();
      if (!_0x3fd7be.title.toLowerCase().includes(_0x10102b) && !(_0x3fd7be.desc || "").toLowerCase().includes(_0x10102b)) {
        return false;
      }
    }
    return true;
  });
  return TuringPlacement.browse(_0x2de3f2, State.currentSort, State.filters.subject);
}
function starsHTML(_0x9d6467) {
  const _0x4c0c0b = _0x9d6467 || 0;
  const _0x296fde = Math.floor(_0x4c0c0b);
  const _0x3a1740 = _0x4c0c0b % 1 >= 0.3;
  let _0x435fcc = "";
  for (let _0x972fe2 = 1; _0x972fe2 <= 5; _0x972fe2++) {
    if (_0x972fe2 <= _0x296fde) {
      _0x435fcc += "<span class=\"cs\">★</span>";
    } else if (_0x972fe2 === _0x296fde + 1 && _0x3a1740) {
      _0x435fcc += "<span class=\"cs chalf\">★</span>";
    } else {
      _0x435fcc += "<span class=\"cs\">☆</span>";
    }
  }
  return _0x435fcc;
}
function renderStarRating(_0x3fa8cf, _0x50b67e, _0x4ef360, _0xc251a3, _0x27cba1) {
  const _0x4be759 = document.getElementById(_0x3fa8cf);
  if (!_0x4be759) {
    return;
  }
  _0x4be759.className = "star-rating" + (_0xc251a3 ? "" : " star-rating-readonly");
  _0x4be759.innerHTML = "";
  const _0x160463 = _0x689ffd => {
    _0x4be759.innerHTML = "";
    const _0x1e2c0d = Math.floor(_0x689ffd);
    const _0x611d2 = _0x689ffd % 1 >= 0.3;
    for (let _0x166cc6 = 1; _0x166cc6 <= 5; _0x166cc6++) {
      const _0x1aa2eb = document.createElement("span");
      if (_0x166cc6 <= _0x1e2c0d) {
        _0x1aa2eb.className = "star active";
      } else if (_0x166cc6 === _0x1e2c0d + 1 && _0x611d2) {
        _0x1aa2eb.className = "star half";
      } else {
        _0x1aa2eb.className = "star";
      }
      _0x1aa2eb.textContent = "★";
      if (_0xc251a3) {
        _0x1aa2eb.onmouseenter = () => {
          _0x4be759.querySelectorAll(".star").forEach((_0x3f263c, _0x2ae26b) => {
            if (_0x2ae26b < _0x166cc6) {
              _0x3f263c.classList.add("hover");
            } else if (_0x2ae26b + 1 === _0x166cc6) {
              _0x3f263c.classList.add("hover-half");
            } else {
              _0x3f263c.classList.remove("hover", "hover-half");
            }
          });
        };
        _0x1aa2eb.onmouseleave = () => {
          _0x4be759.querySelectorAll(".star").forEach(_0x2c3fec => _0x2c3fec.classList.remove("hover", "hover-half"));
        };
        _0x1aa2eb.onclick = () => {
          const _0x57672b = _0x689ffd || 0;
          const _0x30f337 = _0x166cc6 - 0.5;
          submitRating(_0x27cba1, _0x57672b === _0x30f337 ? _0x166cc6 : _0x30f337);
        };
      }
      _0x4be759.appendChild(_0x1aa2eb);
    }
  };
  _0x160463(_0x4ef360 || 0);
}
async function submitRating(_0xc521b2, _0x3e8f8b) {
  if (!State.user) {
    showAuthModal();
    toast("请先登录后评分", "error");
    return;
  }
  try {
    const _0x349692 = await apiFetch("/api/programs/rate", {
      method: "POST",
      body: JSON.stringify({
        program_id: _0xc521b2,
        score: _0x3e8f8b
      })
    });
    if (_0x349692.success) {
      toast("评分成功 ✅", "success");
      loadRating(_0xc521b2);
      const _0x1e3149 = PROGRAMS.find(_0x46c8ff => _0x46c8ff.id === _0xc521b2);
      if (_0x1e3149) {
        _0x1e3149.rating = _0x349692.avg_score;
      }
    } else {
      toast(_0x349692.msg || "评分失败", "error");
    }
  } catch (_0x3715e7) {
    toast("网络错误", "error");
  }
}
async function loadRating(_0x20ea82) {
  try {
    const _0x2f70d6 = await fetch(API_BASE + "/api/programs/ratings?program_id=" + _0x20ea82, {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    const _0x1f760b = await _0x2f70d6.json();
    if (!_0x1f760b.success) {
      return;
    }
    const _0xc939b4 = document.getElementById("rating-count-" + _0x20ea82);
    if (_0xc939b4) {
      _0xc939b4.textContent = "(" + (_0x1f760b.count || 0) + ")";
    }
    const _0x441669 = document.getElementById("rating-number-" + _0x20ea82);
    if (_0x441669) {
      _0x441669.textContent = _0x1f760b.avg_score || "";
    }
    const _0x18838c = document.getElementById("rating-display-" + _0x20ea82);
    if (_0x18838c) {
      renderStarRating("rating-display-" + _0x20ea82, _0x1f760b.avg_score, _0x1f760b.avg_score || 0, false);
    }
    if (State.user) {
      const _0x1ff920 = document.getElementById("my-rating-stars-" + _0x20ea82);
      if (_0x1ff920) {
        renderStarRating("my-rating-stars-" + _0x20ea82, _0x1f760b.avg_score, _0x1f760b.my_score || 0, true, _0x20ea82);
      }
    }
  } catch (_0x234a22) {}
}
function navigate(_0x40cdf5, _0x2d080b) {
  State.currentPage = _0x40cdf5;
  window.location.hash = _0x40cdf5;
  render(_0x2d080b);
  window.scrollTo({
    top: 0
  });
}
function render(_0x5c0ac7) {
  const _0x46ff07 = State.token;
  if (premiumCatalogueEnabled && _0x46ff07 && State.currentPage === "home") {
    import("/premium-catalogue/promotion.mjs").then(_0x2a53e5 => _0x2a53e5.showHomePromotion(_0x46ff07, () => State.currentPage === "home" && State.token === _0x46ff07)).catch(() => {});
  } else {
    document.querySelector("#home-promotion-dialog")?.close();
  }
  const _0xad7c19 = $("#app");
  _0xad7c19.innerHTML = "";
  _0xad7c19.appendChild(renderHeader());
  switch (State.currentPage) {
    case "home":
      _0xad7c19.appendChild(renderHome());
      break;
    case "browse":
      _0xad7c19.appendChild(renderBrowse());
      break;
    case "premium":
      {
        const _0x1a0c44 = document.createElement("section");
        _0xad7c19.appendChild(_0x1a0c44);
        if (premiumCatalogueEnabled) {
          import("/premium-catalogue/client.mjs").then(_0x834626 => {
            if (_0x1a0c44.isConnected) {
              _0x834626.mountCustomer(_0x1a0c44, {
                initialCourse: window.TuringCourseLinks.parse(window.location.hash),
                token: State.token,
                onLogin: () => showAuthModal(),
                openPremium: openPremiumViewer,
                openLegacy: async _0x20b696 => {
                  await loadProgramsFromDatabase();
                  if (PROGRAMS.some(_0x4f8d80 => _0x4f8d80.id === _0x20b696)) {
                    showDetail(_0x20b696);
                  } else {
                    toast("原作品当前不可用", "error");
                  }
                }
              });
            }
          }).catch(() => {
            _0x1a0c44.textContent = "精品目录暂时无法载入，请稍后重试。";
          });
        } else {
          _0x1a0c44.textContent = "精品课程正在准备中。";
        }
        break;
      }
    case "resources":
      _0xad7c19.appendChild(renderResources());
      break;
    case "membership":
      {
        if (premiumCatalogueEnabled || vipPricingEnabled) {
          const _0xa07ee8 = document.createElement("section");
          _0xad7c19.appendChild(_0xa07ee8);
          import("/premium-catalogue/membership.mjs").then(_0x5e776a => {
            if (_0xa07ee8.isConnected) {
              _0x5e776a.mountMembershipPreview(_0xa07ee8, {
                vipOnly: !premiumCatalogueEnabled,
                token: State.token,
                onLogin: () => showAuthModal(),
                onPaid: () => render(),
                onVipCheckout: _0x435d0c => showPayment(null, _0x435d0c.id === "vip-month" ? "month" : "year", false, _0x435d0c)
              });
            }
          }).catch(() => {
            _0xa07ee8.textContent = "会员方案暂时无法载入。";
          });
        } else {
          _0xad7c19.appendChild(renderMembership());
        }
        break;
      }
    case "upload":
      _0xad7c19.appendChild(renderUpload());
      loadCreatorAgreementStatus();
      setTimeout(function () {
        try {
          var _0x202bc8 = sessionStorage.getItem("tuxiaoling_upload_title");
          var _0x58ecaa = sessionStorage.getItem("tuxiaoling_upload_desc");
          if (_0x202bc8) {
            var _0x1220c0 = document.getElementById("upload-title");
            if (_0x1220c0) {
              _0x1220c0.value = _0x202bc8;
            }
            var _0xf40d55 = document.getElementById("file-name-display");
            if (_0xf40d55) {
              _0xf40d55.innerText = "✅ 已就绪: " + _0x202bc8 + ".html";
            }
            var _0x3c3f5e = document.getElementById("upload-hint");
            if (_0x3c3f5e) {
              _0x3c3f5e.innerText = "由图小灵 AI 生成的 HTML 文件，直接提交即可";
            }
            var _0x42872e = document.getElementById("upload-icon");
            if (_0x42872e) {
              _0x42872e.textContent = "✅";
            }
            genCoverForUpload(_0x202bc8);
            autoGenerateDesc();
          }
          if (_0x58ecaa && !document.querySelector("#upload-desc p")) {
            var _0x552b8f = document.getElementById("upload-desc");
            if (_0x552b8f) {
              _0x552b8f.innerHTML = "<p>" + _0x58ecaa.replace(/</g, "&lt;") + "</p>";
            }
          }
          if (typeof updateGradeLevelOptions === "function") {
            updateGradeLevelOptions("upload");
          }
        } catch (_0x33b26a) {}
      }, 100);
      break;
    case "edit-upload":
      _0xad7c19.appendChild(renderEditUpload());
      break;
    case "dashboard":
      _0xad7c19.appendChild(renderDashboard());
      break;
    case "admin":
      _0xad7c19.appendChild(renderAdmin());
      break;
    default:
      _0xad7c19.appendChild(renderHome());
  }
  _0xad7c19.appendChild(renderFooter());
  revealLinkedCourse();
  window.onscroll = () => {
    const _0x4a2414 = $(".site-header");
    if (_0x4a2414) {
      _0x4a2414.classList.toggle("scrolled", window.scrollY > 10);
    }
  };
  setTimeout(() => {
    $$(".program-card, .feature-card, .membership-card").forEach((_0x5e7425, _0x38af44) => {
      _0x5e7425.style.animationDelay = _0x38af44 * 0.06 + "s";
      _0x5e7425.classList.add("animate-in");
    });
  }, 50);
  if (State.currentPage === "browse" && State.filters.search) {
    searchPrograms(State.filters.search);
  }
}
function renderHeader() {
  const _0x2dc131 = document.createElement("div");
  if (premiumCatalogueEnabled) {
    _0x2dc131.className = "pc-enabled-header";
  }
  _0x2dc131.innerHTML = "\n    <header class=\"site-header\">\n    <div class=\"header-inner\">\n      <a class=\"logo\" href=\"#home\" onclick=\"navigate('home');return false;\">\n        <span class=\"brand-mark\" aria-hidden=\"true\"><img src=\"/assets/turing-brand-mark.svg\" width=\"36\" height=\"36\" alt=\"\"></span>\n        <div class=\"logo-text\">图灵智赋<span>——AI赋能教育教学</span></div>\n      </a>\n      <ul class=\"nav-links\">\n        <li><a href=\"#home\" class=\"" + (State.currentPage === "home" ? "active" : "") + "\" onclick=\"navigate('home');return false;\">\n          <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M3 12l9-8 9 8M5 10v10h14V10\"/></svg>\n          首页</a></li>\n        <li><a href=\"#browse\" class=\"" + (State.currentPage === "browse" ? "active" : "") + "\" onclick=\"navigate('browse');return false;\">\n          <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/></svg>\n          探索程序</a></li>\n        " + (premiumCatalogueEnabled ? "<li><a class=\"pc-nav-label\" href=\"#premium\" onclick=\"navigate('premium');return false;\">精品课</a></li>" : "") + "\n        <li><a href=\"/teacher/\">教师工作平台</a></li>\n        <li><a href=\"#membership\" class=\"" + (State.currentPage === "membership" ? "active" : "") + "\" onclick=\"navigate('membership');return false;\">\n          <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>\n          会员中心</a></li>\n        <li><a href=\"#upload\" class=\"" + (State.currentPage === "upload" ? "active" : "") + "\" onclick=\"navigate('upload');return false;\">\n          <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12\"/></svg>\n          上传作品</a></li>\n      </ul>\n      <div class=\"header-actions\">\n        <button class=\"mobile-menu-btn\" onclick=\"toggleMobileMenu()\">\n          <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M4 6h16M4 12h16M4 18h16\"/></svg>\n        </button>\n        " + (State.user ? "\n          " + (State.user.role === "admin" || State.user.role === "moderator" ? "<button class=\"btn btn-sm\" style=\"background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:12px\" onclick=\"navigate('admin')\">🛡️ 管理控制台</button>" : "") + "\n          <button class=\"btn btn-ghost btn-sm\" onclick=\"navigate('dashboard')\" style=\"position:relative\">\n            <svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>\n            " + State.user.name + "\n            " + (State.membership ? " 👑" : "") + "\n          </button>\n          <button class=\"btn btn-ghost btn-sm\" id=\"header-points-badge\" onclick=\"showPointsModal()\" title=\"查看积分明细\" style=\"gap:3px\">\n            <svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 2L2 8l4 14h12l4-14L12 2z\"/><path d=\"M12 2v20M2 8h20M6 22h12M8 8l4 14M16 8l-4 14\"/></svg>\n            <span id=\"points-display\">" + (pointsWallet?.snapshot().status === "ready" ? pointsWallet.snapshot().total : "—") + "</span>\n          </button>\n          <button class=\"btn btn-outline btn-sm\" onclick=\"logout()\">退出</button>\n          " + (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "<button class=\"btn btn-sm\" style=\"background:#1e293b;color:#94a3b8;font-size:11px;margin-left:6px;border:1px solid #334155\" onclick=\"resetDailyBonus()\" title=\"清空今日登录记录，方便调试每日赠送动画\">🔄 重置每日</button>" : "") + "\n        " : "\n          <button class=\"btn btn-primary btn-sm\" onclick=\"showAuthModal()\">登录 / 注册</button>\n          " + (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "<button class=\"btn btn-sm\" style=\"background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;font-size:12px\" onclick=\"devLogin()\">🛡️ 超级管理员</button><button class=\"btn btn-sm\" style=\"background:linear-gradient(135deg,#64748b,#94a3b8);color:#fff;font-size:12px;margin-left:6px\" onclick=\"devLoginUser()\">👤 普通用户</button><button class=\"btn btn-sm\" style=\"background:#1e293b;color:#94a3b8;font-size:11px;margin-left:6px;border:1px solid #334155\" onclick=\"resetDailyBonus()\" title=\"清空今日登录记录，方便调试每日赠送动画\">🔄 重置每日</button>" : "") + "\n        ") + "\n      </div>\n    </div>\n    </header>\n    <nav class=\"mobile-nav\" id=\"mobile-nav\">\n      <a href=\"#home\" class=\"" + (State.currentPage === "home" ? "active" : "") + "\" onclick=\"navigate('home');closeMobileMenu();return false;\">🏠 首页</a>\n      <a href=\"#browse\" class=\"" + (State.currentPage === "browse" ? "active" : "") + "\" onclick=\"navigate('browse');closeMobileMenu();return false;\">📱 探索程序</a>\n      " + (premiumCatalogueEnabled ? "<a class=\"pc-nav-label\" href=\"#premium\" onclick=\"navigate('premium');closeMobileMenu();return false;\">精品课</a>" : "") + "\n      <a href=\"/teacher/\" onclick=\"closeMobileMenu()\">教师工作平台</a>\n      <a href=\"#membership\" class=\"" + (State.currentPage === "membership" ? "active" : "") + "\" onclick=\"navigate('membership');closeMobileMenu();return false;\">⭐ 会员中心</a>\n      <a href=\"#upload\" class=\"" + (State.currentPage === "upload" ? "active" : "") + "\" onclick=\"navigate('upload');closeMobileMenu();return false;\">📤 上传作品</a>\n      " + (State.user ? "<a href=\"#dashboard\" class=\"" + (State.currentPage === "dashboard" ? "active" : "") + "\" onclick=\"navigate('dashboard');closeMobileMenu();return false;\">👤 个人中心</a>" : "") + "\n      " + (State.user && (State.user.role === "admin" || State.user.role === "moderator") ? "<a href=\"#admin\" class=\"" + (State.currentPage === "admin" ? "active" : "") + "\" onclick=\"navigate('admin');closeMobileMenu();return false;\">🛡️ 管理控制台</a>" : "") + "\n    </nav>";
  return _0x2dc131;
}
function toggleMobileMenu() {
  const _0x541921 = document.getElementById("mobile-nav");
  if (_0x541921) {
    _0x541921.classList.toggle("open");
  }
}
function closeMobileMenu() {
  const _0x223285 = document.getElementById("mobile-nav");
  if (_0x223285) {
    _0x223285.classList.remove("open");
  }
}
function renderHome() {
  const _0x5127e5 = document.createDocumentFragment();
  const _0x4c6418 = document.createElement("section");
  _0x4c6418.className = "hero home-ai-refined";
  _0x4c6418.innerHTML = "\n    <div class=\"hero-content\">\n      <div class=\"ai-chat-box\" id=\"ai-chat-box\">\n        <iframe src=\"/tuxiaoling/\" title=\"图小灵教学助手\" class=\"ai-chat-iframe\" frameborder=\"0\" allowfullscreen></iframe>\n      </div>\n    </div>";
  _0x5127e5.appendChild(_0x4c6418);
  const _0xbc8548 = document.createElement("section");
  _0xbc8548.className = "announce-section reveal";
  _0xbc8548.id = "announce-bar";
  _0xbc8548.innerHTML = "\n    <div class=\"announce-inner\">\n      <div class=\"announce-icon\">📢</div>\n      <div class=\"home-announce-viewport\"><div class=\"home-announce-track\"><span id=\"announce-content\">加载中...</span><span id=\"announce-copy\" aria-hidden=\"true\"></span></div></div>\n    </div>";
  _0x5127e5.appendChild(_0xbc8548);
  fetch(API_BASE + "/api/announcement").then(_0x1e93b6 => _0x1e93b6.json()).then(_0x5e70ce => {
    const _0x2029b1 = document.getElementById("announce-content");
    if (_0x2029b1 && _0x5e70ce.announcement) {
      _0x2029b1.textContent = _0x5e70ce.announcement;
    } else if (_0x2029b1) {
      _0x2029b1.textContent = "欢迎来到图灵智赋！上传3个原创作品通过审核即可获得3个月VIP会员。";
    }
    const _0x4a49ae = document.getElementById("announce-copy");
    if (_0x4a49ae && _0x2029b1) {
      _0x4a49ae.textContent = _0x2029b1.textContent;
    }
  }).catch(() => {});
  const _0x29a0b3 = document.createElement("section");
  _0x29a0b3.className = "section";
  _0x29a0b3.style.paddingTop = "0";
  _0x29a0b3.innerHTML = "\n    <div class=\"section-header\">\n      <h2>热门推荐</h2>\n      <p>精选推荐与教师们常用的教学小程序</p>\n    </div>\n    <div class=\"programs-grid\">\n      " + TuringPlacement.home(PROGRAMS).map(_0x1c1525 => programCardHTML(_0x1c1525)).join("") + "\n    </div>\n    <div style=\"text-align:center;margin-top:36px;\">\n      <button class=\"btn btn-outline btn-lg\" onclick=\"navigate('browse')\">查看全部程序 →</button>\n    </div>";
  _0x5127e5.appendChild(_0x29a0b3);
  const _0x4fa1f6 = document.createElement("section");
  _0x4fa1f6.className = "section reveal";
  _0x4fa1f6.innerHTML = "\n    <div class=\"section-header\">\n      <h2>教师们的评价</h2>\n      <p>来自全国各地老师的真实反馈</p>\n    </div>\n    <div style=\"display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px\">\n      " + [{
    name: "李老师",
    role: "初中物理 · 杭州",
    text: "电路连接实验室这个程序太棒了！以前每节课都要花大量时间准备实验器材，现在学生直接在平板上做虚拟实验，效果反而更好。",
    avatar: "李"
  }, {
    name: "王老师",
    role: "高中数学 · 北京",
    text: "函数图像绘制器让学生可以直观地看到参数变化对函数图像的影响，比我在黑板上画半天效果好得多，课堂效率提高了一倍。",
    avatar: "王"
  }, {
    name: "赵老师",
    role: "高中物理 · 成都",
    text: "随机点名器和课堂计时器是我每节课必用的工具，简洁好用。最重要的是，AI赋能的理念让我看到了教育的新可能性。",
    avatar: "赵"
  }].map(_0xff28ae => "\n        <div style=\"background:#fff;border-radius:var(--radius-lg);padding:28px;border:1px solid var(--gray-200);transition:all var(--transition)\" onmouseenter=\"this.style.boxShadow='var(--shadow-lg)';this.style.transform='translateY(-3px)'\" onmouseleave=\"this.style.boxShadow='none';this.style.transform='none'\">\n          <div style=\"color:var(--amber-400);font-size:14px;margin-bottom:12px\">★★★★★</div>\n          <p style=\"font-size:14px;color:var(--gray-600);line-height:1.8;margin-bottom:16px\">\"" + _0xff28ae.text + "\"</p>\n          <div style=\"display:flex;align-items:center;gap:10px;border-top:1px solid var(--gray-100);padding-top:14px\">\n            <div style=\"width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--blue-400),var(--blue-600));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px\">" + _0xff28ae.avatar + "</div>\n            <div><div style=\"font-weight:600;font-size:13px;color:var(--gray-800)\">" + _0xff28ae.name + "</div><div style=\"font-size:12px;color:var(--gray-400)\">" + _0xff28ae.role + "</div></div>\n          </div>\n        </div>").join("") + "\n    </div>";
  _0x5127e5.appendChild(_0x4fa1f6);
  const _0x220bd2 = document.createElement("section");
  _0x220bd2.className = "reveal";
  _0x220bd2.style.cssText = "padding:64px 24px;text-align:center;background:linear-gradient(135deg,var(--blue-600),var(--blue-800));color:#fff;";
  _0x220bd2.innerHTML = "\n    <div style=\"max-width:600px;margin:0 auto\">\n      <h2 style=\"font-family:var(--font-serif);font-size:28px;margin-bottom:14px\">加入我们，一起让教育更美好</h2>\n      <p style=\"opacity:.85;font-size:15px;line-height:1.8;margin-bottom:28px\">无论你是想使用精品教学工具的教师，还是想分享自己AI作品的创作者，我们都欢迎你。</p>\n      <div style=\"display:flex;gap:14px;justify-content:center;flex-wrap:wrap\">\n        <button class=\"btn btn-lg\" style=\"background:#fff;color:var(--blue-700);font-weight:700\" onclick=\"navigate('browse')\">开始探索</button>\n        <button class=\"btn btn-lg\" style=\"background:rgba(255,255,255,.15);color:#fff;border:1.5px solid rgba(255,255,255,.3)\" onclick=\"navigate('upload')\">上传我的作品</button>\n      </div>\n    </div>";
  _0x5127e5.appendChild(_0x220bd2);
  (function () {
    try {
      var _0x2eb1f7 = sessionStorage.getItem("tuxiaoling_edit_html");
      var _0x452839 = sessionStorage.getItem("tuxiaoling_edit_title");
      if (_0x2eb1f7) {
        sessionStorage.removeItem("tuxiaoling_edit_html");
        sessionStorage.removeItem("tuxiaoling_edit_title");
        var _0x351201 = setInterval(function () {
          var _0x106772 = document.querySelector(".ai-chat-iframe");
          if (_0x106772 && _0x106772.contentWindow) {
            clearInterval(_0x351201);
            _0x106772.contentWindow.postMessage({
              type: "tuxiaoling-load-html",
              html: _0x2eb1f7,
              title: _0x452839 || "作品",
              prompt: "帮我修改这个页面，"
            }, "*");
            setTimeout(function () {
              var _0x1f2b18 = document.getElementById("ai-chat-box");
              if (_0x1f2b18) {
                _0x1f2b18.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }
            }, 300);
          }
        }, 200);
        setTimeout(function () {
          clearInterval(_0x351201);
        }, 10000);
      }
    } catch (_0x558e39) {}
  })();
  return _0x5127e5;
}
function toggleCategoryMore() {
  var _0x47d0de = document.getElementById("category-bar-compact");
  var _0x5ebaab = document.getElementById("cat-more-btn");
  if (!_0x47d0de || !_0x5ebaab) {
    return;
  }
  var _0x17397d = _0x47d0de.querySelectorAll(".cat-extra");
  var _0xce59fe = _0x47d0de.classList.toggle("expanded");
  _0x17397d.forEach(function (_0x388536) {
    _0x388536.style.display = _0xce59fe ? "" : "none";
  });
  _0x5ebaab.textContent = _0xce59fe ? "收起 ▴" : "更多 ▾";
}
function getGradient(_0x285de2) {
  const _0x4660a7 = {
    物理: "physics",
    化学: "chemistry",
    数学: "math",
    生物: "biology",
    地理: "geography",
    语文: "chinese",
    英语: "english",
    历史: "history",
    "政治/道法": "politics",
    音乐: "music",
    美术: "art",
    体育: "sports",
    信息技术: "tool",
    通用技术: "tool",
    心理健康: "psychology",
    科学: "science",
    课堂小游戏: "tool",
    班级管理: "tool",
    其他: "tool"
  };
  return _0x4660a7[_0x285de2] || "physics";
}
function programUseCount(_0x11aa72) {
  const _0x25cbf4 = Number(_0x11aa72.uses);
  if (Number.isSafeInteger(_0x25cbf4) && _0x25cbf4 >= 0) {
    return _0x25cbf4;
  } else {
    return 0;
  }
}
function programCardHTML(_0x31a537) {
  const _0x774ef7 = programUseCount(_0x31a537);
  return "\n    <div class=\"program-card\" onclick=\"showDetail(" + _0x31a537.id + ")\">\n     <div class=\"card-cover\" data-gradient=\"" + getGradient(_0x31a537.subject) + "\">\n  " + (_0x31a537.cover_url ? "<img src=\"" + (API_BASE + _0x31a537.cover_url) + "\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;\">" : "<div class=\"card-cover-placeholder\">" + _0x31a537.emoji + "</div>") + "\n        " + renderProgramVideoCoverButton(_0x31a537) + "\n        <div class=\"card-badges\">\n          <span class=\"card-badge card-badge-subject\">" + _0x31a537.subject + "</span>\n        </div>\n        <span class=\"card-badge card-badge-grade card-badge-tr\">" + (_0x31a537.grade_level || _0x31a537.grade) + "</span>\n      </div>\n      <div class=\"card-body\">\n        <div class=\"card-title\">" + _0x31a537.title + "</div>\n        <div class=\"card-desc\">" + _0x31a537.desc + "</div>\n        <div class=\"card-meta\">\n          <div class=\"card-author\">\n            <div class=\"card-avatar\">" + _0x31a537.author[0] + "</div>\n            <span>" + _0x31a537.author + "</span>\n          </div>\n          <div class=\"card-stats\">\n            <span class=\"card-rating\">" + starsHTML(_0x31a537.rating) + " " + (_0x31a537.rating || "评分") + "</span>\n            <span>📊 " + (_0x774ef7 > 1000 ? (_0x774ef7 / 1000).toFixed(1) + "k" : _0x774ef7) + "</span>\n          </div>\n        </div>\n      </div>\n    </div>";
}
function renderBrowse() {
  const _0x1f8be8 = document.createElement("div");
  _0x1f8be8.className = "browse-layout";
  const _0x240258 = filteredPrograms();
  _0x1f8be8.innerHTML = "\n    <aside class=\"filter-sidebar\">\n      <div class=\"filter-group\">\n        <div class=\"filter-group-title\">学科</div>\n        <div class=\"filter-options\">\n          " + SUBJECTS.map(_0xac4c89 => {
    const _0x43270e = _0xac4c89 === "全部" ? PROGRAMS.length : PROGRAMS.filter(_0x2fe753 => programSubjects(_0x2fe753).includes(_0xac4c89)).length;
    return "<button class=\"filter-option " + (State.filters.subject === _0xac4c89 ? "active" : "") + "\" onclick=\"State.filters.subject='" + _0xac4c89 + "';render()\">\n              " + _0xac4c89 + " <span class=\"filter-count\">" + _0x43270e + "</span>\n            </button>";
  }).join("") + "\n        </div>\n      </div>\n      <div class=\"filter-group\">\n        <div class=\"filter-group-title\">学段</div>\n        <div class=\"filter-options\">\n          " + GRADES.map(_0x1fdcae => {
    const _0x299e6e = _0x1fdcae === "全部" ? PROGRAMS.length : PROGRAMS.filter(_0x704f52 => _0x704f52.grade === _0x1fdcae).length;
    return "<button class=\"filter-option " + (State.filters.grade === _0x1fdcae ? "active" : "") + "\" onclick=\"State.filters.grade='" + _0x1fdcae + "';State.filters.gradeLevel='';render()\">\n              " + _0x1fdcae + " <span class=\"filter-count\">" + _0x299e6e + "</span>\n            </button>";
  }).join("") + "\n        </div>\n      </div>\n      " + (State.filters.grade !== "全部" && GRADE_LEVELS[State.filters.grade] && GRADE_LEVELS[State.filters.grade].length > 0 ? "\n      <div class=\"filter-group\">\n        <div class=\"filter-group-title\">年级</div>\n        <div class=\"filter-options\">\n          <button class=\"filter-option " + (!State.filters.gradeLevel ? "active" : "") + "\" onclick=\"State.filters.gradeLevel='';render()\">\n            全部 <span class=\"filter-count\">" + PROGRAMS.filter(_0x2e8026 => _0x2e8026.grade === State.filters.grade).length + "</span>\n          </button>\n          " + GRADE_LEVELS[State.filters.grade].map(_0x48145e => {
    const _0x1d5b22 = PROGRAMS.filter(_0x30d141 => _0x30d141.grade === State.filters.grade && _0x30d141.grade_level === _0x48145e).length;
    return "<button class=\"filter-option " + (State.filters.gradeLevel === _0x48145e ? "active" : "") + "\" onclick=\"State.filters.gradeLevel='" + _0x48145e + "';render()\">\n              " + _0x48145e + " <span class=\"filter-count\">" + _0x1d5b22 + "</span>\n            </button>";
  }).join("") + "\n        </div>\n      </div>\n" : "") + "\n      <div class=\"filter-group\">\n        <div class=\"filter-group-title\">类型</div>\n        <div class=\"filter-options\">\n          " + TYPES.map(_0x346b59 => {
    const _0x195026 = _0x346b59 === "全部" ? PROGRAMS.length : PROGRAMS.filter(_0x2a042c => _0x2a042c.type === _0x346b59).length;
    return "<button class=\"filter-option " + (State.filters.type === _0x346b59 ? "active" : "") + "\" onclick=\"State.filters.type='" + _0x346b59 + "';render()\">\n              " + _0x346b59 + " <span class=\"filter-count\">" + _0x195026 + "</span>\n            </button>";
  }).join("") + "\n        </div>\n      </div>\n      <div class=\"filter-group\">\n        <button class=\"btn btn-outline btn-sm btn-block\" onclick=\"State.filters={subject:'全部',grade:'全部',gradeLevel:'',type:'全部',search:''};render()\">重置筛选</button>\n      </div>\n    </aside>\n    <div class=\"browse-content\">\n      <div class=\"browse-topbar\">\n        <div class=\"search-box\" style=\"flex:1;max-width:480px\">\n          <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"M21 21l-4.35-4.35\"/></svg>\n          <input type=\"text\" id=\"program-search-input\" placeholder=\"🔍 搜索小程序名称、关键词...\" value=\"" + State.filters.search + "\"\n            oninput=\"clearTimeout(window._srchTimer);var $el=this;window._srchTimer=setTimeout(function(){if($el.value!=window._srchVal){window._srchVal=$el.value;searchPrograms($el.value)}},600)\">\n        </div>\n        <select class=\"sort-select\" onchange=\"handleSort(this.value)\">\n          <option value=\"recommended\"" + (State.currentSort === "recommended" ? " selected" : "") + ">推荐顺序</option>\n          <option value=\"popular\"" + (State.currentSort === "popular" ? " selected" : "") + ">按热度排序</option>\n          <option value=\"newest\"" + (State.currentSort === "newest" ? " selected" : "") + ">最新发布</option>\n          <option value=\"rating\"" + (State.currentSort === "rating" ? " selected" : "") + ">按评分排序</option>\n        </select>\n      </div>\n      <div class=\"results-info\">共找到 <strong>" + _0x240258.length + "</strong> 个程序</div>\n      <div class=\"programs-grid\">\n        " + (_0x240258.length > 0 ? _0x240258.map(_0x526546 => programCardHTML(_0x526546)).join("") : "<div class=\"dash-empty\"><div class=\"dash-empty-icon\">🔍</div><p>没有找到匹配的程序，试试调整筛选条件</p></div>") + "\n      </div>\n    </div>";
  return _0x1f8be8;
}
function handleSort(_0x1600e3) {
  State.currentSort = ["recommended", "popular", "newest", "rating"].includes(_0x1600e3) ? _0x1600e3 : "recommended";
  render();
}
function searchPrograms(_0x1d71d4) {
  State.filters.search = _0x1d71d4;
  var _0x400eb6 = _0x1d71d4.trim().toLowerCase();
  var _0x363f27 = 0;
  document.querySelectorAll(".program-card").forEach(function (_0x3d0232) {
    if (!_0x400eb6) {
      _0x3d0232.style.display = "";
      _0x3d0232.style.opacity = "1";
      _0x3d0232.classList.remove("animate-in");
      _0x363f27++;
      return;
    }
    var _0x10ee42 = _0x3d0232.textContent.toLowerCase();
    var _0x1995e8 = _0x10ee42.includes(_0x400eb6);
    _0x3d0232.style.display = _0x1995e8 ? "" : "none";
    if (_0x1995e8) {
      _0x3d0232.style.opacity = "1";
      _0x3d0232.classList.remove("animate-in");
      _0x363f27++;
    }
  });
  var _0x54581e = document.querySelector(".results-info");
  if (_0x54581e) {
    _0x54581e.innerHTML = "共找到 <strong>" + _0x363f27 + "</strong> 个程序" + (_0x400eb6 && !_0x363f27 ? " <span style=\"color:var(--red-500);font-size:13px\">没有匹配，试试其他关键词</span>" : "");
  }
  var _0x5f500e = document.querySelector(".dash-empty");
  if (_0x5f500e) {
    _0x5f500e.style.display = !_0x400eb6 || _0x363f27 > 0 ? "none" : "";
  }
}
function copyProgramLink(_0x323cdb) {
  if (!State.user) {
    toast("请先登录", "error");
    return;
  }
  const _0x18240b = PROGRAMS.find(_0x2587ef => _0x2587ef.id === _0x323cdb);
  if (!_0x18240b) {
    toast("程序不存在", "error");
    return;
  }
  const _0x4cd8aa = window.location.origin + "/play/" + _0x323cdb;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      return Promise.resolve(navigator.clipboard.writeText(_0x4cd8aa)).then(function () {
        toast("✅ 链接已复制！粘贴到PPT中，上课时点击即可全屏运行", "success");
      }).catch(function () {
        copyProgramLinkFallback(_0x4cd8aa);
      });
    } catch (_0xe5dffb) {
      copyProgramLinkFallback(_0x4cd8aa);
    }
  } else {
    copyProgramLinkFallback(_0x4cd8aa);
  }
}
function copyProgramLinkFallback(_0x332d8c) {
  var _0x198ebb = document.createElement("textarea");
  _0x198ebb.value = _0x332d8c;
  _0x198ebb.style.position = "fixed";
  _0x198ebb.style.left = "-9999px";
  document.body.appendChild(_0x198ebb);
  _0x198ebb.select();
  var _0x5d615e = false;
  try {
    _0x5d615e = document.execCommand("copy") === true;
  } catch (_0x4fdc02) {}
  document.body.removeChild(_0x198ebb);
  if (_0x5d615e) {
    toast("✅ 链接已复制！可直接粘贴到PPT中打开", "success");
    return;
  }
  toast("自动复制未完成，请手动复制下方链接", "error");
  var _0x31cb7c = document.createElement("div");
  _0x31cb7c.className = "modal-overlay";
  _0x31cb7c.innerHTML = "<div class=\"modal\" style=\"max-width:540px;padding:24px\"><h3>手动复制课件链接</h3><p style=\"margin:12px 0\">选中下方链接，使用浏览器的复制功能后粘贴到PPT中。</p><input type=\"text\" readonly aria-label=\"课件平台链接\" style=\"width:100%;padding:12px\"><button class=\"btn btn-primary\" type=\"button\" style=\"margin-top:16px\">关闭</button></div>";
  var _0x5090a8 = _0x31cb7c.querySelector("input");
  _0x5090a8.value = _0x332d8c;
  _0x31cb7c.querySelector("button").onclick = function () {
    _0x31cb7c.remove();
  };
  _0x31cb7c.onclick = function (_0x17a03d) {
    if (_0x17a03d.target === _0x31cb7c) {
      _0x31cb7c.remove();
    }
  };
  document.body.appendChild(_0x31cb7c);
  _0x31cb7c.classList.add("show");
  _0x5090a8.focus();
  _0x5090a8.select();
}
function fallbackCopy(_0x24b30b) {
  var _0x2e1561 = document.createElement("textarea");
  _0x2e1561.value = _0x24b30b;
  _0x2e1561.style.position = "fixed";
  _0x2e1561.style.left = "-9999px";
  document.body.appendChild(_0x2e1561);
  _0x2e1561.select();
  try {
    document.execCommand("copy");
    toast("✅ 链接已复制！可直接粘贴到PPT中打开", "success");
  } catch (_0x310b60) {
    toast("复制失败，请手动复制链接", "error");
  }
  document.body.removeChild(_0x2e1561);
}
function showDetail(_0x46f8ca) {
  const _0x495965 = PROGRAMS.find(_0x11e2e7 => _0x11e2e7.id === _0x46f8ca);
  if (!_0x495965) {
    return;
  }
  fetch(API_BASE + "/api/programs/click", {
    method: "POST",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, State.token ? {
      Authorization: "Bearer " + State.token
    } : {}),
    body: JSON.stringify({
      id: _0x46f8ca
    })
  }).catch(function () {});
  _0x495965.clicks = (_0x495965.clicks || 0) + 1;
  const _0x46503f = hasPurchased(_0x46f8ca);
  const _0xf272e1 = _0x495965.price === 0;
  const _0x36a47e = hasStaffProgramAccess();
  const _0x49b859 = document.createElement("div");
  _0x49b859.className = "modal-overlay";
  _0x49b859.onclick = _0x956b11 => {
    if (_0x956b11.target === _0x49b859) {
      _0x49b859.classList.remove("show");
    }
    setTimeout(() => _0x49b859.remove(), 300);
  };
  renderDetailContent(_0x49b859, _0x495965, _0x46503f, _0xf272e1, 3, 0, _0x36a47e);
  document.body.appendChild(_0x49b859);
  requestAnimationFrame(() => _0x49b859.classList.add("show"));
  setTimeout(() => loadRating(_0x46f8ca), 100);
  if (!_0x46503f && !_0xf272e1 && !_0x36a47e && State.user) {
    getTrialsAsync(_0x46f8ca).then(_0x17bab3 => {
      if (_0x17bab3.premium) {
        const _0x177534 = _0x49b859.querySelector(".detail-trial-info");
        const _0x608f6d = _0x49b859.querySelector(".detail-use-btn");
        if (_0x177534) {
          _0x177534.textContent = _0x17bab3.unlimited ? "精品套餐权益有效，可使用本课件。" : "指定免费样例 · 累计剩余 " + (_0x17bab3.total - _0x17bab3.used) + "/" + _0x17bab3.total + " 次";
        }
        if (_0x608f6d) {
          _0x608f6d.disabled = !_0x17bab3.unlimited && !_0x17bab3.sampleActive && _0x17bab3.used >= _0x17bab3.total;
          _0x608f6d.textContent = _0x17bab3.unlimited ? "进入课件" : _0x17bab3.sampleActive ? "继续本次体验" : _0x17bab3.used < _0x17bab3.total ? "免费试用" : "免费次数已用完";
          _0x608f6d.style.opacity = _0x608f6d.disabled ? ".5" : "1";
          _0x608f6d.style.cursor = _0x608f6d.disabled ? "not-allowed" : "pointer";
        }
        return;
      }
      const _0x39e132 = _0x17bab3.total - _0x17bab3.used;
      const _0x23961b = _0x49b859.querySelector(".detail-trial-info");
      if (_0x23961b) {
        _0x23961b.innerHTML = "💡 剩余免费试用次数: <strong>" + _0x39e132 + "/" + _0x17bab3.total + "</strong> 次 " + (_0x39e132 <= 0 ? "（试用已用完，请购买后继续使用）" : "") + "<div style=\"font-size:12px;color:var(--blue-500);margin-top:4px\">💎 成为会员可解锁所有程序无限使用</div>";
      }
      const _0x3be7a6 = _0x49b859.querySelector(".detail-use-btn");
      if (_0x3be7a6 && _0x39e132 <= 0) {
        _0x3be7a6.disabled = true;
        _0x3be7a6.style.opacity = ".5";
        _0x3be7a6.style.cursor = "not-allowed";
        _0x3be7a6.innerHTML = "🔒 需要购买";
      }
    });
  }
}
function renderDetailContent(_0x486411, _0x323e68, _0x37bc49, _0x474b9e, _0xb66057, _0xc046f0, _0x273e2a) {
  const _0x22c41a = _0xb66057 - _0xc046f0;
  const _0x3bdc3f = _0x37bc49 || _0x474b9e || _0x273e2a;
  _0x486411.innerHTML = "\n    <div class=\"modal\" onclick=\"event.stopPropagation()\">\n      <div class=\"modal-close\">\n        <button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button>\n      </div>\n      <div class=\"detail-hero\">\n        <div class=\"detail-cover\" data-gradient=\"" + getGradient(_0x323e68.subject) + "\" style=\"position:relative;background:linear-gradient(135deg," + ({
    物理: "#667eea,#764ba2",
    化学: "#f093fb,#f5576c",
    数学: "#4facfe,#00f2fe",
    生物: "#43e97b,#38f9d7",
    地理: "#fa709a,#fee140",
    语文: "#e2725b,#f5af19",
    英语: "#36d1dc,#5b86e5",
    历史: "#c79081,#dfa579",
    "政治/道法": "#4776e6,#8e54e9",
    音乐: "#e8198b,#c7eafd",
    美术: "#f7971e,#ffd200",
    体育: "#56ab2f,#a8e063",
    信息技术: "#6366f1,#8b5cf6",
    通用技术: "#485563,#29323c",
    心理健康: "#11998e,#38ef7d",
    科学: "#2193b0,#6dd5ed",
    课堂小游戏: "#a18cd1,#fbc2eb",
    班级管理: "#667eea,#fbc2eb",
    其他: "#bdc3c7,#2c3e50"
  }[_0x323e68.subject] || "#667eea,#764ba2") + ")\">\n          " + (_0x323e68.cover_url ? "<img src=\"" + (API_BASE + _0x323e68.cover_url) + "\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;\">" : _0x323e68.emoji) + "\n          " + renderProgramVideoCoverButton(_0x323e68) + "\n        </div>\n        <div class=\"detail-info\">\n          <h2 class=\"detail-title\">" + _0x323e68.title + "</h2>\n          <div class=\"detail-tags\">\n            <span class=\"detail-tag\">" + _0x323e68.subject + "</span>\n            <span class=\"detail-tag\">" + (_0x323e68.grade_level || _0x323e68.grade) + "</span>\n            <span class=\"detail-tag\">" + _0x323e68.type + "</span>\n          </div>\n         <p class=\"detail-desc\">" + _0x323e68.desc + "</p>\n          " + renderDescImagesGallery(_0x323e68.desc_images) + "\n          " + renderAdminNoteModule(_0x323e68) + "\n          " + (_0x323e68.has_attachment || _0x323e68.attachment_url ? "\n          <div style=\"margin:16px 0;padding:16px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;\">\n            <div style=\"font-size:13px;font-weight:600;color:var(--gray-700);margin-bottom:10px\">📎 配套资源附件</div>\n            <button type=\"button\" onclick=\"downloadProgramAttachment(" + Number(_0x323e68.id) + ")\"\n               style=\"display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#fff;border:1px solid var(--blue-200);border-radius:8px;color:var(--blue-600);font-size:13px;font-weight:500;text-decoration:none;transition:all .2s;box-shadow:var(--shadow-sm)\"\n               onmouseover=\"this.style.background='var(--blue-50)';this.style.borderColor='var(--blue-400)'\"\n               onmouseout=\"this.style.background='#fff';this.style.borderColor='var(--blue-200)'\">\n              <span style=\"font-size:20px\">" + ((_0x323e68.attachment_name || "").match(/\.(zip|rar)$/i) ? "🗜️" : (_0x323e68.attachment_name || "").match(/\.pdf$/i) ? "📄" : (_0x323e68.attachment_name || "").match(/\.(ppt|pptx)$/i) ? "📊" : "📁") + "</span>\n              <span>" + (_0x323e68.attachment_name || "下载附件") + "</span>\n              <span style=\"color:var(--gray-400);font-size:11px\">点击下载</span>\n            </button>\n          </div>" : "") + "\n          <div class=\"detail-price-row\">\n            <span class=\"detail-price " + (_0x474b9e ? "free" : "") + "\">" + (_0x474b9e ? "免费" : "¥" + _0x323e68.price) + "</span>\n            <span style=\"font-size:13px;color:var(--gray-400)\">已有 " + programUseCount(_0x323e68) + " 次使用</span>\n          </div>\n          " + (!_0x3bdc3f ? "\n          <div class=\"detail-trial-info\">\n            💡 剩余免费试用次数: <strong>" + _0x22c41a + "/3</strong> 次 " + (_0x22c41a <= 0 ? "（试用已用完，请购买后继续使用）" : "") + "\n            <div style=\"font-size:12px;color:var(--blue-500);margin-top:4px\">💎 成为会员可解锁所有程序无限使用</div>\n          </div>" : "") + "\n          " + (_0x273e2a ? "<div class=\"detail-trial-info\" style=\"background:var(--green-50);border-color:#bbf7d0;\">✅ 管理员权限，无限使用</div>" : "") + "\n          " + (!_0x273e2a && (_0x37bc49 || _0x474b9e) ? "<div class=\"detail-trial-info\" style=\"background:var(--green-50);border-color:#bbf7d0;\">✅ " + (_0x474b9e ? "免费程序，无限使用" : "已购买，永久使用") + "</div>" : "") + "\n          " + (_0x3bdc3f ? "<div style=\"margin:8px 0 12px;padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:12px;line-height:1.6;color:#0369a1\">\n            <div style=\"font-weight:600;margin-bottom:4px\">📌 课堂使用说明</div>\n            <div>1. 确保教室电脑已登录图灵智赋账号</div>\n            <div>2. 点击「📋 复制链接」获取直链</div>\n            <div>3. 将链接粘贴到 PPT 超链接中，上课直接点击全屏运行</div>\n          </div>" : "") + "\n          <div class=\"detail-actions\">\n            <button class=\"btn btn-primary btn-lg detail-use-btn\" onclick=\"openViewer(" + _0x323e68.id + ")\" " + (!_0x3bdc3f && _0x22c41a <= 0 ? "disabled style=\"opacity:.5;cursor:not-allowed\"" : "") + ">\n              " + (_0x3bdc3f ? "🚀 立即使用" : _0x22c41a > 0 ? "🎮 免费试用" : "🔒 需要购买") + "\n            </button>\n            " + (!_0x3bdc3f ? "<button class=\"btn btn-amber btn-lg\" onclick=\"showPayment(" + _0x323e68.id + ")\">💳 立即购买</button>" : "") + "\n            " + (_0x3bdc3f ? "<button class=\"btn btn-outline btn-sm\" onclick=\"copyProgramLink(" + _0x323e68.id + ")\" title=\"直接打开或粘贴到PPT中\">📋 复制链接</button>" : "") + "\n            <button class=\"btn btn-outline btn-sm\" onclick=\"showFeedbackForm(" + _0x323e68.id + ", '" + (_0x323e68.title || "").replace(/'/g, "\\'") + "')\">💬 反馈问题</button>\n          </div>\n        </div>\n      </div>\n      <div class=\"detail-author-row\">\n        <div class=\"detail-author-avatar\">" + _0x323e68.author[0] + "</div>\n        <div class=\"detail-author-info\">\n          <div class=\"detail-author-name\">" + _0x323e68.author + "</div>\n          <div class=\"detail-author-bio\">" + (_0x323e68.authorBio || "教育工作者") + "</div>\n        </div>\n      </div>\n      <div class=\"detail-rating-section\">\n        <div class=\"rating-widget\" data-program-id=\"" + _0x323e68.id + "\">\n          <div class=\"rating-summary\">\n            <span class=\"avg-score\">评分</span>\n            <span class=\"star-rating star-rating-readonly\" id=\"rating-display-" + _0x323e68.id + "\"></span>\n            <span class=\"rating-number\" id=\"rating-number-" + _0x323e68.id + "\"></span>\n            <span class=\"rating-count\" id=\"rating-count-" + _0x323e68.id + "\">(0)</span>\n          </div>\n        </div>\n        <div class=\"my-rating-section\" id=\"my-rating-section-" + _0x323e68.id + "\">\n          <span class=\"my-rating-label\">我的评分：</span>\n          <span class=\"star-rating\" id=\"my-rating-stars-" + _0x323e68.id + "\"></span>\n        </div>\n      </div>\n    </div>";
}
function renderDescImagesGallery(_0x459d02) {
  if (!_0x459d02) {
    return "";
  }
  try {
    var _0x153fc3 = JSON.parse(_0x459d02);
    if (!_0x153fc3 || _0x153fc3.length === 0) {
      return "";
    }
    return "<div style=\"margin-top:16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px\">" + _0x153fc3.map(function (_0x4fcc1d) {
      return "<img src=\"" + API_BASE + _0x4fcc1d + "\" style=\"width:100%;aspect-ratio:16/10;border-radius:8px;object-fit:cover;border:1px solid var(--gray-200);box-shadow:var(--shadow-sm);cursor:pointer\" onclick=\"window.open(this.src)\">";
    }).join("") + "</div>";
  } catch (_0x473a00) {
    return "";
  }
}
function renderAdminNoteModule(_0x3f27d3) {
  if (!_0x3f27d3.admin_note && !_0x3f27d3.admin_note_images) {
    return "";
  }
  var _0x6cc9b9 = _0x3f27d3.admin_note || "";
  var _0x42aefd = document.createElement("div");
  _0x42aefd.innerHTML = _0x6cc9b9;
  if (!_0x42aefd.textContent.trim() && !_0x3f27d3.admin_note_images) {
    return "";
  }
  var _0xe1e3ff = "";
  if (_0x3f27d3.admin_note_images) {
    try {
      var _0x2cae36 = JSON.parse(_0x3f27d3.admin_note_images);
      if (_0x2cae36 && _0x2cae36.length > 0) {
        _0xe1e3ff = "<div style=\"margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px\">" + _0x2cae36.map(function (_0x2890fa) {
          return "<img src=\"" + API_BASE + _0x2890fa + "\" style=\"width:100%;aspect-ratio:16/10;border-radius:8px;object-fit:cover;border:1px solid #e9d5ff;cursor:pointer\" onclick=\"window.open(this.src)\">";
        }).join("") + "</div>";
      }
    } catch (_0x4a4bec) {}
  }
  return ["<div style=\"margin:16px 0;padding:16px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;border-radius:12px;\">", "<div style=\"display:flex;align-items:center;gap:6px;margin-bottom:10px\">", "<span style=\"font-size:16px\">📌</span>", "<span style=\"font-size:13px;font-weight:700;color:#6d28d9\">管理员的话</span>", "</div>", _0x6cc9b9 ? "<div style=\"font-size:13px;color:var(--gray-700);line-height:1.7;word-break:break-word\">" + _0x6cc9b9 + "</div>" : "", _0xe1e3ff, "</div>"].join("");
}
async function openCameraProgram(_0x1fb9df) {
  if (!State.user) {
    showAuthModal();
    toast("请先登录后使用", "error");
    return;
  }
  try {
    toast("正在启动摄像头课件...", "info");
    const _0x213786 = await apiFetch("/api/programs/" + _0x1fb9df + "/camera-launch", {
      method: "POST",
      body: JSON.stringify({})
    });
    if (!_0x213786.success || !_0x213786.launchUrl) {
      toast(_0x213786.msg || "摄像头课件启动失败", "error");
      if (_0x213786.reason === "trial_exhausted") {
        showPayment(_0x1fb9df);
      }
      return;
    }
    window.location.href = _0x213786.launchUrl;
  } catch (_0x2e8c57) {
    toast("摄像头课件启动失败：" + _0x2e8c57.message, "error");
  }
}
const openPremiumViewer = (_0x463482, _0x2879e7, _0xa8ee8) => {
  closeViewer(true);
  if (_0x2879e7.microphoneEntry) {
    premiumViewerCleanup = _0xa8ee8;
    import("/premium-catalogue/microphone-viewer.mjs").then(_0x2f3c2d => {
      if (premiumViewerCleanup !== _0xa8ee8) {
        return;
      }
      const _0x2756c9 = _0x2f3c2d.mountMicrophoneViewer(_0x463482, _0x2879e7, () => closeViewer(true));
      premiumViewerCleanup = () => {
        _0x2756c9();
        _0xa8ee8();
      };
    }).catch(() => {
      closeViewer(true);
      toast("麦克风实验暂时无法打开，请重试", "error");
    });
    return;
  }
  const _0x2062d7 = String(_0x463482.title).replace(/[&<>"\']/g, _0x1cc596 => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[_0x1cc596]);
  renderViewer({
    id: _0x463482.programId,
    title: _0x2062d7,
    emoji: "",
    price: 1,
    source_kind: "file"
  }, "/api/program-file/" + _0x463482.programId + "?token=" + encodeURIComponent(_0x2879e7.token), _0x2879e7.sampleRemaining, _0x2879e7.accessType);
  premiumViewerCleanup = _0xa8ee8;
};
async function openViewer(_0x30fb4e, _0x2558bd = null) {
  if (!State.user) {
    showAuthModal();
    toast("请先登录后使用", "error");
    return;
  }
  let _0x3ee5da = _0x2558bd?.id === _0x30fb4e ? _0x2558bd : PROGRAMS.find(_0x1f266f => _0x1f266f.id === _0x30fb4e);
  if (!_0x3ee5da) {
    try {
      const _0x1ccb76 = await fetch(API_BASE + "/api/programs?myOpenid=1", {
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {}
      });
      const _0x168c53 = await _0x1ccb76.json();
      if (_0x168c53.success) {
        _0x3ee5da = (_0x168c53.programs || []).find(_0x3e2dc0 => _0x3e2dc0.id === _0x30fb4e);
      }
    } catch (_0xb214f6) {}
    if (!_0x3ee5da) {
      toast("作品不存在或无权访问", "error");
      return;
    }
  }
  if (Number(_0x3ee5da.id) === 180 && _0x3ee5da.source_kind === "file" && (_0x3ee5da.runtime_mode || "default") === "default" && !_0x3ee5da.reviewed_public_runtime) {
    window.location.assign("/play/180");
    return;
  }
  if (premiumPlaybackEnabled && _0x3ee5da.source_kind === "file" && (_0x3ee5da.runtime_mode || "default") === "default" && !_0x3ee5da.reviewed_public_runtime) {
    try {
      const _0x46d196 = await import("/premium-catalogue/client.mjs");
      if (await _0x46d196.openMarketplacePremium(_0x30fb4e, {
        token: State.token,
        openPremium: openPremiumViewer
      })) {
        const _0xd0efe = $(".modal-overlay");
        _0xd0efe?.remove();
        return;
      }
    } catch (_0x5aee53) {
      toast(_0x5aee53.message, "error");
      return;
    }
  }
  if ((_0x3ee5da.runtime_mode || "default") === "camera") {
    return openCameraProgram(_0x30fb4e);
  }
  const _0x5011ea = $(".modal-overlay");
  if (_0x5011ea) {
    _0x5011ea.classList.remove("show");
    setTimeout(() => _0x5011ea.remove(), 300);
  }
  if (_0x3ee5da.reviewed_public_runtime === 1) {
    return renderReviewedPublicViewer(_0x3ee5da);
  }
  if (_0x3ee5da.source_kind === "long_march_private_v1" && [498, 754].includes(Number(_0x3ee5da.id))) {
    try {
      const _0x3b6f6c = await import("/course-compat/long-march-playback-host.mjs");
      const _0x250342 = await _0x3b6f6c.prepareLongMarchPlayback(Number(_0x3ee5da.id));
      if (_0x250342) {
        renderViewer(_0x3ee5da, _0x250342.url, _0x250342.trialRemaining, _0x250342.accessType === "trial" ? "trial" : _0x250342.accessType === "admin" ? "admin" : "member", _0x250342);
        return;
      }
    } catch (_0x5a0098) {
      toast(_0x5a0098.message || "课件暂时无法打开", "error");
      if (_0x5a0098.trialExhausted) {
        showPayment(_0x3ee5da.id);
        return;
      }
      if (typeof _0x5a0098.resetPlayback === "function") {
        const _0x190d40 = document.createElement("div");
        _0x190d40.className = "modal-overlay show";
        const _0x264e16 = document.createElement("div");
        _0x264e16.className = "modal";
        const _0x4b6e38 = document.createElement("p");
        _0x4b6e38.textContent = _0x5a0098.message;
        const _0x552180 = document.createElement("button");
        _0x552180.className = "btn btn-primary";
        _0x552180.textContent = "重新开始播放";
        _0x552180.onclick = () => {
          _0x5a0098.resetPlayback();
          _0x190d40.remove();
          openViewer(_0x3ee5da.id);
        };
        const _0x2eade4 = document.createElement("button");
        _0x2eade4.className = "btn";
        _0x2eade4.textContent = "返回";
        _0x2eade4.onclick = () => _0x190d40.remove();
        _0x264e16.append(_0x4b6e38, _0x552180, _0x2eade4);
        _0x190d40.append(_0x264e16);
        document.body.append(_0x190d40);
      }
      return;
    }
  }
  toast("正在加载程序...", "info");
  const _0xeb3a6c = _0x3ee5da.price === 0 || !_0x3ee5da.price;
  const _0x545c9c = State.membership;
  const _0x479285 = hasPurchased(_0x3ee5da.id);
  const _0xf11911 = State.user && State.user.wechatId === _0x3ee5da.uploader_openid;
  const _0x262563 = hasStaffProgramAccess();
  let _0x598d4e = "";
  const _0x34af1c = _0x3ee5da.source_kind === "external";
  try {
    if (_0x34af1c) {
      const _0x4a284a = await fetch(API_BASE + "/api/programs/" + _0x30fb4e + "/external-url", {
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {}
      });
      const _0x389fa9 = await _0x4a284a.json();
      if (!_0x389fa9.success) {
        toast(_0x389fa9.msg || "无访问权限", "error");
        if (_0x389fa9.reason === "trial_exhausted") {
          showPayment(_0x30fb4e);
        }
        return;
      }
      _0x598d4e = _0x389fa9.url;
    } else {
      const _0x5e7fd7 = await fetch(API_BASE + "/api/programs/" + _0x30fb4e + "/access-token", {
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {}
      });
      const _0x3d1fc2 = await _0x5e7fd7.json();
      if (!_0x3d1fc2.success) {
        toast(_0x3d1fc2.msg || "无访问权限", "error");
        if (_0x3d1fc2.reason === "trial_exhausted") {
          showPayment(_0x30fb4e);
        }
        return;
      }
      _0x598d4e = API_BASE + "/api/program-file/" + _0x30fb4e + "?token=" + encodeURIComponent(_0x3d1fc2.token);
    }
  } catch (_0x3558c5) {
    toast("加载失败：" + _0x3558c5.message, "error");
    return;
  }
  let _0x3a3d63 = "member";
  if (_0x262563) {
    _0x3a3d63 = "admin";
  } else if (_0xf11911 || _0xeb3a6c || _0x545c9c || _0x479285) {
    _0x3a3d63 = "member";
  } else {
    try {
      const _0x5a19b6 = await fetch(API_BASE + "/api/trials?program_id=" + _0x30fb4e, {
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {}
      });
      const _0x32635f = await _0x5a19b6.json();
      if (_0x32635f.success && _0x32635f.used >= _0x32635f.total) {
        toast("试用次数已用完，请购买后使用", "error");
        showPayment(_0x30fb4e);
        return;
      }
      _0x3a3d63 = "trial";
    } catch (_0x111836) {
      _0x3a3d63 = "trial";
    }
  }
  const _0x1408c1 = _0x3a3d63 === "trial" ? null : null;
  renderViewer(_0x3ee5da, _0x598d4e, _0x1408c1, _0x3a3d63);
}
function showRateLimitAlert() {
  const _0x38c952 = document.createElement("div");
  _0x38c952.className = "sso-alert-overlay";
  _0x38c952.onclick = _0x1cc562 => {
    if (_0x1cc562.target === _0x38c952) {
      _0x38c952.remove();
    }
  };
  _0x38c952.innerHTML = "\n    <div class=\"sso-alert-box\">\n      <div style=\"font-size:48px;margin-bottom:16px\">🚫</div>\n      <h3>操作异常</h3>\n      <p>检测到账号操作频率异常，请稍后再试。如非本人操作，请及时修改密码。</p>\n      <button class=\"btn btn-primary\" onclick=\"this.closest('.sso-alert-overlay').remove()\">我知道了</button>\n    </div>";
  document.body.appendChild(_0x38c952);
}
let reviewedPublicViewer = null;
let longMarchSaveHost = null;
let longMarchSaveClosing = false;
let premiumViewerCleanup = null;
async function renderReviewedPublicViewer(_0x306878) {
  closeViewer(true);
  const _0x15dc6f = document.createElement("div");
  _0x15dc6f.className = "viewer-overlay";
  _0x15dc6f.id = "program-viewer";
  const _0x369db0 = document.createElement("div");
  _0x369db0.className = "viewer-header";
  const _0x450d82 = document.createElement("div");
  _0x450d82.className = "viewer-title";
  _0x450d82.textContent = (_0x306878.emoji || "") + " " + _0x306878.title;
  const _0x36dc62 = document.createElement("span");
  _0x36dc62.className = "viewer-status trial";
  _0x36dc62.textContent = "正在验证权益";
  const _0x8fc994 = document.createElement("button");
  _0x8fc994.className = "viewer-close-btn";
  _0x8fc994.type = "button";
  _0x8fc994.textContent = "✕";
  _0x8fc994.onclick = closeViewer;
  _0x369db0.append(_0x450d82, _0x36dc62, _0x8fc994);
  const _0x5e1aca = document.createElement("div");
  _0x5e1aca.className = "viewer-frame-wrap";
  const _0x383183 = document.createElement("div");
  _0x383183.className = "reviewed-public-mount";
  _0x5e1aca.append(_0x383183);
  _0x15dc6f.append(_0x369db0, _0x5e1aca);
  document.body.append(_0x15dc6f);
  requestAnimationFrame(() => _0x15dc6f.classList.add("show"));
  const _0x35ce35 = async (_0x4f336b, _0xf0ec99) => {
    const _0x2252f9 = await fetch(API_BASE + _0x4f336b, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(State.token ? {
          Authorization: "Bearer " + State.token
        } : {})
      },
      body: JSON.stringify(_0xf0ec99)
    });
    const _0x42e5b3 = await _0x2252f9.json();
    if (!_0x2252f9.ok) {
      throw Error(_0x42e5b3.error || "访问权限已变化，请重新打开课件");
    }
    return _0x42e5b3;
  };
  try {
    const _0x4c9a4d = await import("/admin-large/runtime/public-host.mjs");
    if (!_0x15dc6f.isConnected) {
      return;
    }
    const _0x490920 = await _0x4c9a4d.mountPublicRuntime(_0x383183, _0x306878.id, _0x35ce35);
    if (!_0x15dc6f.isConnected) {
      _0x490920.close();
      return;
    }
    reviewedPublicViewer = _0x490920;
    if (Number.isSafeInteger(_0x490920.uses) && _0x490920.uses >= 0) {
      _0x306878.uses = Math.max(programUseCount(_0x306878), _0x490920.uses);
    }
    _0x36dc62.className = "viewer-status " + (_0x490920.accessType === "trial" ? "trial" : "purchased");
    _0x36dc62.textContent = _0x490920.accessType === "trial" ? "试用中" : "已解锁";
  } catch (_0x47c376) {
    if (_0x15dc6f.isConnected) {
      _0x36dc62.textContent = "无法播放";
      _0x383183.textContent = _0x47c376.message || "课件暂时无法打开。若试用已结束，请购买后重试。";
      if (typeof _0x47c376.resetPlayback === "function") {
        const _0x4c89f5 = document.createElement("button");
        _0x4c89f5.type = "button";
        _0x4c89f5.textContent = "重新开始播放";
        _0x4c89f5.onclick = () => {
          try {
            _0x47c376.resetPlayback();
            _0x4c89f5.disabled = true;
            renderReviewedPublicViewer(_0x306878);
          } catch (_0x233c69) {
            _0x383183.textContent = _0x233c69.message;
          }
        };
        _0x383183.append(_0x4c89f5);
      }
      const _0x2eabb1 = document.createElement("button");
      _0x2eabb1.type = "button";
      _0x2eabb1.textContent = "查看购买方式";
      _0x2eabb1.onclick = () => {
        closeViewer(true);
        showPayment(_0x306878.id);
      };
      _0x383183.append(_0x2eabb1);
    }
  }
}
let pk180BankHostCleanup = null;
function renderViewer(_0x36a55e, _0x12e143, _0x11a5ad, _0x384034, _0x3d8ba2 = null) {
  const _0x4365ca = document.createElement("div");
  _0x4365ca.className = "viewer-overlay";
  _0x4365ca.id = "program-viewer";
  const _0x3122ed = _0x36a55e.price === 0 || !_0x36a55e.price;
  const _0xd2c549 = hasPurchased(_0x36a55e.id);
  let _0x5f562e;
  let _0x318a41;
  if (_0x384034 === "premium" || _0x384034 === "premium_sample") {
    _0x5f562e = _0x384034 === "premium_sample" ? "免费样例 · 剩余 " + _0x11a5ad + " 次" : "已获授权 · 精品课程";
    _0x318a41 = _0x384034 === "premium_sample" ? "trial" : "purchased";
  } else if (_0x384034 === "member" || _0x384034 === "admin" || _0xd2c549 || _0x3122ed) {
    _0x5f562e = _0x384034 === "admin" ? "管理员 · 无限使用" : _0x3122ed ? "免费 · 无限使用" : State.membership ? "会员 · 无限使用" : "已购买 · 永久使用";
    _0x318a41 = "purchased";
  } else {
    _0x5f562e = _0x11a5ad !== null ? "试用中 · 剩余 " + _0x11a5ad + " 次" : "试用中";
    _0x318a41 = "trial";
  }
  let _0x48ce0f = "";
  if (_0x384034 === "trial" || _0x384034 === "premium_sample") {
    _0x48ce0f = "<div class=\"viewer-watermark trial-wm\">\n      <div class=\"wm-line\">图灵智赋</div>\n      <div class=\"wm-url\">aifunengjiaoyu.com</div>\n    </div>";
  } else {
    _0x48ce0f = "<div class=\"viewer-watermark member-wm\">\n      <div class=\"wm-corner wm-tl\">图灵智赋</div>\n      <div class=\"wm-corner wm-br\">aifunengjiaoyu.com</div>\n    </div>";
  }
  let _0x5494f9 = _0x12e143 || "about:blank";
  const _0x3297ba = _0x36a55e.source_kind === "external";
  const _0xd99f25 = !_0x3297ba && Number(_0x36a55e.id) === 208;
  const _0x409014 = _0x3297ba ? "allow-scripts allow-forms allow-popups" : "allow-scripts" + (_0xd99f25 ? " allow-same-origin" : "") + " allow-forms allow-popups allow-downloads allow-modals allow-pointer-lock";
  const _0x3789b7 = _0x3297ba ? "no-referrer" : "strict-origin-when-cross-origin";
  const _0x538b91 = Number(_0x36a55e.id) === 180 && !_0x3297ba && (_0x36a55e.runtime_mode || "default") === "default";
  const _0x1c7d5d = _0x3297ba || _0x36a55e.source_kind === "long_march_private_v1";
  const _0xcdf23c = _0x36a55e.source_kind === "long_march_private_v1" ? "fullscreen *" : "fullscreen";
  const _0x22b49f = "<iframe" + (_0x538b91 ? "" : " src=\"" + _0x5494f9 + "\"") + " sandbox=\"" + _0x409014 + "\"" + (_0x1c7d5d ? " allow=\"" + _0xcdf23c + "\" allowfullscreen" : "") + " referrerpolicy=\"" + _0x3789b7 + "\" loading=\"" + (_0x538b91 ? "eager" : "lazy") + "\"></iframe>";
  _0x4365ca.innerHTML = "\n    <div class=\"viewer-header\">\n      <div class=\"viewer-title\">" + _0x36a55e.emoji + " " + _0x36a55e.title + "</div>\n      <span class=\"viewer-status " + _0x318a41 + "\">" + _0x5f562e + "</span>\n      <button class=\"viewer-close-btn\" onclick=\"closeViewer()\">✕</button>\n    </div>\n    <div class=\"viewer-frame-wrap\">\n      " + _0x22b49f + "\n      " + _0x48ce0f + "\n    </div>";
  document.body.appendChild(_0x4365ca);
  if (_0x538b91) {
    _0x4365ca.querySelector("iframe").src = _0x5494f9;
  }
  requestAnimationFrame(() => _0x4365ca.classList.add("show"));
  if (Number(_0x36a55e.id) === 180 && !_0x3297ba && (_0x36a55e.runtime_mode || "default") === "default") {
    const _0x169e11 = _0x4365ca.querySelector("iframe");
    const _0x57e9f4 = State.user?.wechatId;
    import("/course-compat/pk180-bank-host.mjs").then(async _0x1e7c81 => {
      if (!_0x4365ca.isConnected) {
        return;
      }
      const _0x517f76 = await _0x1e7c81.mountPk180BankHost(_0x169e11, _0x57e9f4, () => State.token && State.user?.wechatId === _0x1e7c81.currentBrowserAccount() ? State.user.wechatId : "");
      if (!_0x4365ca.isConnected) {
        _0x517f76();
      } else {
        pk180BankHostCleanup = _0x517f76;
      }
    }).catch(() => {});
  }
  if (_0x36a55e.source_kind === "long_march_private_v1" && [498, 754].includes(Number(_0x36a55e.id))) {
    import("/course-compat/long-march-save-host.mjs").then(async _0x2cb41e => {
      if (!_0x4365ca.isConnected) {
        return;
      }
      const _0x66170c = _0x3d8ba2 ? await _0x3d8ba2.mount(_0x4365ca.querySelector("iframe")) : await _0x2cb41e.mountLongMarchSaveHost(_0x4365ca.querySelector("iframe"), State.user?.wechatId);
      if (!_0x4365ca.isConnected) {
        _0x66170c.close();
      } else {
        longMarchSaveHost = _0x66170c;
      }
    }).catch(() => {});
  }
  _0x4365ca.addEventListener("contextmenu", _0x2b653a => _0x2b653a.preventDefault());
  _0x4365ca.addEventListener("keydown", _0x3d014f => {
    if ((_0x3d014f.ctrlKey || _0x3d014f.metaKey) && (_0x3d014f.key === "s" || _0x3d014f.key === "u")) {
      _0x3d014f.preventDefault();
    }
    if (_0x3d014f.key === "F12") {
      _0x3d014f.preventDefault();
    }
  });
}
function closeViewer(_0x515da2 = false) {
  if (longMarchSaveHost && _0x515da2 !== true) {
    if (longMarchSaveClosing) {
      return;
    }
    const _0x41b7e2 = longMarchSaveHost;
    longMarchSaveClosing = true;
    _0x41b7e2.checkpoint().then(() => _0x41b7e2.flush()).then(() => {
      if (longMarchSaveHost !== _0x41b7e2) {
        return;
      }
      longMarchSaveHost = null;
      longMarchSaveClosing = false;
      _0x41b7e2.close();
      closeViewer(_0x515da2);
    }).catch(() => {
      longMarchSaveClosing = false;
      toast("进度尚未保存，请保留课件页面并稍后重试。", "error");
    });
    return;
  }
  longMarchSaveHost?.close();
  longMarchSaveHost = null;
  longMarchSaveClosing = false;
  pk180BankHostCleanup?.();
  pk180BankHostCleanup = null;
  const _0x72f26a = premiumViewerCleanup;
  premiumViewerCleanup = null;
  _0x72f26a?.();
  reviewedPublicViewer?.close();
  reviewedPublicViewer = null;
  const _0x12964c = $("#program-viewer");
  if (_0x12964c) {
    const _0x2d8e7a = $("iframe", _0x12964c);
    if (_0x2d8e7a && _0x2d8e7a.src.startsWith("blob:")) {
      URL.revokeObjectURL(_0x2d8e7a.src);
    }
    if (_0x515da2 === true) {
      _0x12964c.remove();
      return;
    }
    _0x12964c.classList.remove("show");
    setTimeout(() => _0x12964c.remove(), 300);
  }
}
function showAuthModal(_0x4236d9 = "login") {
  const _0xe7c36b = document.createElement("div");
  _0xe7c36b.className = "modal-overlay";
  _0xe7c36b.onclick = _0x23c098 => {
    if (_0x23c098.target === _0xe7c36b) {
      _0xe7c36b.classList.remove("show");
      setTimeout(() => _0xe7c36b.remove(), 300);
    }
  };
  _0xe7c36b.innerHTML = "\n    <div class=\"modal auth-modal\" onclick=\"event.stopPropagation()\">\n      <div class=\"modal-close\">\n        <button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button>\n      </div>\n      <div class=\"modal-body\">\n        <div style=\"text-align:center;margin-bottom:20px;\">\n          <div class=\"logo-icon\" style=\"width:48px;height:48px;font-size:20px;margin:0 auto 12px;border-radius:14px;\">Ai</div>\n          <h2 style=\"font-family:var(--font-serif);font-size:20px;color:var(--gray-900)\">欢迎来到图灵智赋</h2>\n          <p style=\"font-size:13px;color:var(--gray-400);margin-top:6px\">微信扫码，安全登录</p>\n        </div>\n        <div class=\"wechat-qr-main\">\n          <div class=\"wechat-qr-box\" id=\"qr-container\">\n            <div class=\"qr-scan-line\"></div>\n            <div id=\"qr-loading\" style=\"display:flex;align-items:center;justify-content:center;width:160px;height:160px;color:var(--gray-400);font-size:13px\">加载中...</div>\n          </div>\n          <p class=\"wechat-qr-hint\">请使用 <strong style=\"color:#07c160\">微信</strong> 扫描二维码登录</p>\n          <p style=\"font-size:12px;color:var(--gray-300);margin-top:6px\">扫码即表示同意《用户服务协议》和《隐私政策》</p>\n          <div id=\"qr-report-area\" style=\"margin-top:12px;min-height:24px\"></div>\n        </div>\n      </div>\n    </div>";
  document.body.appendChild(_0xe7c36b);
  requestAnimationFrame(() => _0xe7c36b.classList.add("show"));
  window._qrReportTimer = null;
  window._qrSceneId = "";
  window._qrReportToken = "";
  fetchQRCode();
}
async function fetchQRCode() {
  const _0x3ffca5 = document.getElementById("qr-container");
  const _0x3690b3 = document.getElementById("qr-loading");
  if (!_0x3ffca5 || !_0x3690b3) {
    return;
  }
  try {
    const _0xdb01f8 = new URLSearchParams(window.location.search);
    const _0x3bd401 = _0xdb01f8.get("invite") || "";
    const _0x494644 = API_BASE + "/api/get-qrcode" + (_0x3bd401 ? "?invite=" + _0x3bd401 : "");
    const _0xf9d5e3 = await fetch(_0x494644, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const _0x3fb8b8 = await _0xf9d5e3.json();
    if (_0x3fb8b8.success && _0x3fb8b8.url) {
      _0x3690b3.outerHTML = "<img src=\"" + _0x3fb8b8.url + "\" alt=\"微信登录二维码\" style=\"width:160px;height:160px;border-radius:4px;display:block\">";
      window._qrSceneId = _0x3fb8b8.scene || "";
      window._qrReportToken = _0x3fb8b8.reportToken || "";
      window._qrReportTimer = setTimeout(showQrReportLink, 15000);
      pollLoginStatus(_0x3fb8b8.scene || _0x3fb8b8.ticket || "");
    } else {
      _0x3690b3.innerHTML = "<div style=\"text-align:center\"><p>二维码加载失败</p><button onclick=\"fetchQRCode()\" style=\"margin-top:8px;padding:4px 12px;border:1px solid var(--gray-300);border-radius:4px;background:#fff;cursor:pointer;font-size:12px\">重试</button></div>";
    }
  } catch (_0xd9729d) {
    if (_0x3690b3) {
      _0x3690b3.innerHTML = "<div style=\"text-align:center\"><p>网络连接失败</p><button onclick=\"fetchQRCode()\" style=\"margin-top:8px;padding:4px 12px;border:1px solid var(--gray-300);border-radius:4px;background:#fff;cursor:pointer;font-size:12px\">重试</button></div>";
    }
  }
}
async function pollLoginStatus(_0x2938d8) {
  let _0x1d948e = 0;
  const _0x78f39f = 60;
  const _0xd74c61 = 2000;
  const _0x335f54 = async () => {
    if (_0x1d948e >= _0x78f39f) {
      return;
    }
    if (!document.querySelector(".auth-modal")) {
      return;
    }
    _0x1d948e++;
    try {
      var _0x137f56 = await fetch(API_BASE + "/api/auth/check-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scene: _0x2938d8
        })
      });
      var _0x26e73c = await _0x137f56.json();
      if (_0x26e73c.success && _0x26e73c.user) {
        if (window._qrReportTimer) {
          clearTimeout(window._qrReportTimer);
          window._qrReportTimer = null;
        }
        handleLoginSuccess(_0x26e73c.user, _0x26e73c.token, _0x26e73c.dailyBonusAwarded);
        return;
      }
    } catch (_0x457b6f) {}
    setTimeout(_0x335f54, _0xd74c61);
  };
  setTimeout(_0x335f54, _0xd74c61);
}
function showQrReportLink() {
  var _0x172e91 = document.getElementById("qr-report-area");
  if (!_0x172e91) {
    return;
  }
  _0x172e91.innerHTML = "<div style=\"font-size:12px;color:var(--gray-400)\"><span>扫码后无反应？</span><button onclick=\"showQrCaptcha()\" style=\"margin-left:4px;padding:2px 8px;border:1px solid var(--gray-300);border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:var(--gray-600)\">报告问题</button></div>";
}
function showQrCaptcha() {
  var _0x10a91b = document.getElementById("qr-report-area");
  if (!_0x10a91b) {
    return;
  }
  _0x10a91b.innerHTML = "<div style=\"font-size:12px;color:var(--gray-500)\"><label style=\"display:flex;align-items:center;gap:6px;justify-content:center;cursor:pointer;user-select:none\"><input type=\"checkbox\" id=\"captcha-chk\" onchange=\"document.getElementById('captcha-btn').disabled=!this.checked\"><span>我不是机器人</span></label><button id=\"captcha-btn\" disabled onclick=\"submitQrReport()\" style=\"margin-top:6px;padding:3px 14px;border:none;border-radius:4px;background:var(--primary,#3b82f6);color:#fff;cursor:pointer;font-size:12px\">提交报告</button><div id=\"report-status\" style=\"margin-top:4px;font-size:11px\"></div></div>";
}
async function submitQrReport() {
  var _0x800b36 = document.getElementById("report-status");
  if (!_0x800b36) {
    return;
  }
  _0x800b36.textContent = "提交中...";
  try {
    var _0x4e58b9 = await fetch(API_BASE + "/api/captcha-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    var _0x5a3051 = await _0x4e58b9.json();
    if (!_0x5a3051.success) {
      _0x800b36.textContent = "验证失败，请重试";
      return;
    }
    var _0x103364 = await fetch(API_BASE + "/api/report-missed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sceneId: window._qrSceneId,
        reportToken: window._qrReportToken,
        captchaToken: _0x5a3051.token
      })
    });
    var _0x5b2bd4 = await _0x103364.json();
    if (_0x5b2bd4.success) {
      _0x800b36.textContent = _0x5b2bd4.msg;
      _0x800b36.style.color = "var(--gray-500)";
      document.getElementById("captcha-btn").disabled = true;
      document.getElementById("captcha-chk").disabled = true;
    } else {
      _0x800b36.textContent = _0x5b2bd4.msg || "提交失败";
      _0x800b36.style.color = "#ef4444";
    }
  } catch (_0x5c0316) {
    _0x800b36.textContent = "网络错误，请稍后重试";
    _0x800b36.style.color = "#ef4444";
  }
}
function reloadTuxiaolingIframe(_0x156d4a) {
  _0x156d4a = _0x156d4a || 0;
  setTimeout(function () {
    var _0x1b28c1 = document.querySelector(".ai-chat-iframe");
    if (_0x1b28c1) {
      var _0x11e3ae = _0x1b28c1.src;
      _0x1b28c1.src = "";
      setTimeout(function () {
        _0x1b28c1.src = _0x11e3ae;
      }, 100);
    }
  }, _0x156d4a);
}
function handleLoginSuccess(_0x20ebc3, _0x4e37c9, _0x1fed7b) {
  if (_0x20ebc3.wechatId === "hzyyiyiyi" || _0x20ebc3.openid === "hzyyiyiyi") {
    _0x20ebc3.role = "admin";
    _0x20ebc3.isMember = true;
    State.membership = true;
  }
  if (!_0x20ebc3.name || _0x20ebc3.name === "null" || _0x20ebc3.name === "教师用户") {
    _0x20ebc3.name = "教师用户";
  }
  pointsWallet?.invalidate();
  State.user = _0x20ebc3;
  State.token = _0x4e37c9 || "tk_" + Date.now().toString(36);
  if (_0x20ebc3.isMember) {
    State.membership = true;
  }
  State.save();
  $(".modal-overlay")?.remove();
  toast("登录成功", "success");
  State.refreshPoints();
  if (_0x1fed7b) {
    setTimeout(function () {
      showDailyBonusAnimation(200);
    }, 1200);
  }
  if (_0x20ebc3.profileCompleted === false || _0x20ebc3.name === "教师用户") {
    showProfileModal();
    setTimeout(function () {
      reloadTuxiaolingIframe(500);
    }, 100);
  } else {
    render();
    if (typeof loadProgramsFromDatabase === "function") {
      loadProgramsFromDatabase();
    }
    setTimeout(function () {
      reloadTuxiaolingIframe(500);
    }, 100);
  }
}
function showProfileModal() {
  const _0x15ad17 = document.createElement("div");
  _0x15ad17.className = "modal-overlay";
  _0x15ad17.innerHTML = "\n    <div class=\"modal auth-modal\" style=\"text-align:center;padding:32px\" onclick=\"event.stopPropagation()\">\n      <h2 style=\"font-family:var(--font-serif);font-size:20px;margin-bottom:8px\">🎉 欢迎加入图灵智赋</h2>\n      <p style=\"font-size:13px;color:var(--gray-500);margin-bottom:24px\">请完善您的个人资料，开启智能教学之旅</p>\n      <div class=\"form-group\" style=\"text-align:left\">\n        <label class=\"form-label\">您的称呼 <span style=\"color:var(--red-500)\">*</span></label>\n        <input class=\"form-input\" type=\"text\" id=\"profile-name\" placeholder=\"例如：李老师\">\n      </div>\n      <div class=\"form-group\" style=\"text-align:left\">\n        <label class=\"form-label\">主授学科</label>\n        <select class=\"form-input\" id=\"profile-subject\">\n          " + SUBJECTS.filter(_0x4f876d => _0x4f876d !== "全部").map(_0x1a9080 => "<option value=\"" + _0x1a9080 + "\">" + _0x1a9080 + "</option>").join("") + "\n        </select>\n      </div>\n      <button class=\"btn btn-primary btn-block\" onclick=\"saveProfile()\" style=\"margin-top:12px\">完成设置</button>\n    </div>";
  document.body.appendChild(_0x15ad17);
  requestAnimationFrame(() => _0x15ad17.classList.add("show"));
}
async function saveProfile() {
  const _0x9b6aa8 = document.getElementById("profile-name").value.trim();
  const _0x5bee8b = document.getElementById("profile-subject").value;
  if (!_0x9b6aa8) {
    toast("请填写您的称呼", "error");
    return;
  }
  toast("保存中...", "info");
  try {
    const _0x110006 = await fetch(API_BASE + "/api/user/update", {
      method: "POST",
      headers: Object.assign({
        "Content-Type": "application/json"
      }, State.token ? {
        Authorization: "Bearer " + State.token
      } : {}),
      body: JSON.stringify({
        nickname: _0x9b6aa8,
        subject: _0x5bee8b
      })
    });
    const _0x3168cb = await _0x110006.json();
    if (_0x3168cb.success) {
      State.user.name = _0x9b6aa8;
      State.user.subject = _0x5bee8b;
      State.user.profileCompleted = true;
      State.save();
      toast("资料已完善", "success");
      $(".modal-overlay").remove();
      render();
      if (typeof loadProgramsFromDatabase === "function") {
        loadProgramsFromDatabase();
      }
    }
  } catch (_0x4f34bf) {}
}
async function logout() {
  const _0x46f79c = State.token;
  try {
    if (_0x46f79c) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + _0x46f79c
        }
      });
    }
  } catch (_0x12fb7f) {} finally {
    State.clear();
    toast("已退出登录");
    navigate("home");
    reloadTuxiaolingIframe(500);
  }
}
async function devLogin() {
  try {
    const _0x38f46b = await fetch("/api/dev-login");
    const _0x297fdc = await _0x38f46b.json();
    if (_0x297fdc.success) {
      State.token = _0x297fdc.token;
      State.user = _0x297fdc.user;
      State.purchases = [];
      State.membership = true;
      if (_0x297fdc.user.points === undefined) {
        State.user.points = 0;
      }
      State.save();
      State.save();
      toast("✅ 已以管理员身份登录", "success");
      navigate("home");
      reloadTuxiaolingIframe(500);
      triggerDailyBonusCheck();
    } else {
      toast("开发者登录失败", "error");
    }
  } catch (_0x441b33) {
    toast("无法连接开发者登录接口", "error");
  }
}
async function devLoginUser() {
  try {
    const _0x4b475f = await fetch("/api/dev-login-user");
    const _0x453985 = await _0x4b475f.json();
    if (_0x453985.success) {
      State.token = _0x453985.token;
      State.user = _0x453985.user;
      State.purchases = [];
      State.membership = false;
      if (_0x453985.user.points === undefined) {
        State.user.points = 0;
      }
      State.save();
      toast("✅ 已以普通教师身份登录", "success");
      navigate("home");
      reloadTuxiaolingIframe(500);
      triggerDailyBonusCheck();
    } else {
      toast("普通用户登录失败", "error");
    }
  } catch (_0x4812b8) {
    toast("无法连接登录接口", "error");
  }
}
async function resetDailyBonus() {
  if (!State.user || !State.user.wechatId) {
    toast("请先登录", "error");
    return;
  }
  try {
    var _0x4283ab = await fetch("/api/dev-reset-daily", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        openid: State.user.wechatId
      })
    });
    var _0x257bba = await _0x4283ab.json();
    if (!_0x257bba.success) {
      toast(_0x257bba.msg || "重置失败", "error");
      return;
    }
    State.user.points = 0;
    State.save();
    updatePointsDisplay();
    var _0x4920d7 = await apiFetch("/api/points/daily-bonus", {
      method: "POST",
      body: JSON.stringify({})
    });
    var _0x328ec2 = await _0x4920d7.json();
    if (_0x328ec2.success && !_0x328ec2.dailyBonusClaimed) {
      State.user.points = _0x328ec2.points;
      State.save();
      toast("🎁 每日赠送 " + _0x328ec2.bonus + " 积分！", "success");
      setTimeout(function () {
        showDailyBonusAnimation(_0x328ec2.bonus || 200);
      }, 600);
    } else if (_0x328ec2.success && _0x328ec2.dailyBonusClaimed) {
      State.user.points = _0x328ec2.points;
      State.save();
      updatePointsDisplay();
      toast("✅ 已重置（今日已领取过，积分已归零）", "info");
    }
  } catch (_0x4ede23) {
    toast("操作失败: " + _0x4ede23.message, "error");
  }
}
function triggerDailyBonusCheck(_0x59171a) {
  _0x59171a = _0x59171a || 1500;
  setTimeout(async function () {
    try {
      var _0x10b26c = await fetch("/api/auth/verify", {
        headers: {
          Authorization: "Bearer " + State.token
        }
      });
      var _0x1c9027 = await _0x10b26c.json();
      if (_0x1c9027.success && _0x1c9027.user) {
        var _0x4f9df0 = State.user ? State.user.points || 0 : 0;
        State.user = _0x1c9027.user;
        State.save();
        updatePointsDisplay();
        if (_0x1c9027.dailyBonusAwarded && _0x1c9027.user.points > _0x4f9df0) {
          showDailyBonusAnimation(_0x1c9027.user.points - _0x4f9df0);
        }
      }
    } catch (_0x579ee4) {
      console.error("[daily-bonus] verify failed:", _0x579ee4);
    }
  }, 1500);
}
async function showPayment(_0x20eb13, _0x4fc87b, _0x1c8cc9, _0x1145b3) {
  if ((premiumCatalogueEnabled || vipPricingEnabled) && _0x4fc87b && !_0x1145b3) {
    navigate("membership");
    return;
  }
  if (_0x4fc87b && !_0x1145b3) {
    try {
      const _0x360574 = await fetch("/api/pay/vip-prices", {
        cache: "no-store"
      });
      if (!_0x360574.ok) {
        throw Error();
      }
      const _0x987891 = await _0x360574.json();
      _0x1145b3 = _0x987891.plans.find(_0x33e976 => _0x33e976.id === (_0x4fc87b === "month" ? "vip-month" : "vip-year"));
      if (!_0x1145b3) {
        throw Error();
      }
    } catch {
      toast("会员价格暂时无法读取，请稍后重试", "error");
      return;
    }
  }
  if (!State.user) {
    showAuthModal();
    toast("请先登录", "error");
    return;
  }
  const _0x28021b = _0x20eb13 ? _0x1c8cc9 ? RESOURCES.find(_0x3b2315 => _0x3b2315.id === _0x20eb13) : PROGRAMS.find(_0x495ad4 => _0x495ad4.id === _0x20eb13) : null;
  let _0x2e8946;
  let _0x164fad;
  let _0x480dc5;
  let _0x2c212b;
  if (_0x4fc87b) {
    const _0x371798 = {
      month: {
        name: "月度会员",
        price: 39.9,
        icon: "🌙"
      },
      year: {
        name: "年度会员",
        price: 199,
        icon: "⭐"
      }
    };
    const _0x565b0d = _0x371798[_0x4fc87b];
    _0x2e8946 = _0x565b0d.name;
    _0x164fad = _0x1145b3 ? _0x1145b3.effectiveCents / 100 : _0x565b0d.price;
    _0x480dc5 = _0x565b0d.icon;
    _0x2c212b = _0x4fc87b === "month" ? "member_month" : "member_year";
  } else if (_0x28021b) {
    _0x2e8946 = _0x28021b.title;
    _0x164fad = _0x28021b.price;
    _0x480dc5 = _0x28021b.emoji;
    _0x2c212b = _0x1c8cc9 ? "resource" : "program";
  } else {
    return;
  }
  currentCouponDiscount = 1;
  window._activeCouponCode = null;
  window._paymentContext = {
    id: _0x20eb13,
    itemName: _0x2e8946,
    itemPrice: _0x164fad,
    itemIcon: _0x480dc5,
    itemType: _0x2c212b,
    memberPlan: _0x4fc87b,
    isResource: _0x1c8cc9,
    membershipRequestId: _0x4fc87b ? crypto.randomUUID() : null
  };
  $$(".modal-overlay").forEach(_0x2d3941 => {
    _0x2d3941.classList.remove("show");
    setTimeout(() => _0x2d3941.remove(), 300);
  });
  const _0x16f577 = document.createElement("div");
  _0x16f577.className = "modal-overlay";
  _0x16f577.onclick = _0x3a44da => {
    if (_0x3a44da.target === _0x16f577) {
      _0x16f577.classList.remove("show");
      setTimeout(() => _0x16f577.remove(), 300);
    }
  };
  _0x16f577.innerHTML = "\n    <div class=\"modal payment-modal\" onclick=\"event.stopPropagation()\">\n      <div class=\"modal-close\">\n        <button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button>\n      </div>\n      <div class=\"payment-body\">\n        <h2 style=\"font-family:var(--font-serif);font-size:20px;margin-bottom:20px;text-align:center;\">确认购买</h2>\n        <div class=\"payment-item\">\n          <div class=\"payment-item-icon\">" + _0x480dc5 + "</div>\n          <div>\n            <div class=\"payment-item-name\">" + _0x2e8946 + "</div>\n            <div style=\"font-size:12px;color:var(--gray-400)\">" + (_0x2c212b === "member_month" ? "会员服务 · 30天" : _0x2c212b === "member_year" ? "会员服务 · 365天" : "教学小程序 · 购买后永久使用") + "</div>\n          </div>\n          <div class=\"payment-item-price\" id=\"pay-price-display\">¥" + _0x164fad + "</div>\n        </div>\n        <div style=\"text-align:center;padding:20px 0;\">\n          <div id=\"pay-qr-canvas\" style=\"display:inline-block;background:#fff;padding:12px;border-radius:12px;border:1px solid var(--gray-200);\">\n            <div style=\"padding:40px;color:var(--gray-400)\">正在生成支付二维码...</div>\n          </div>\n          <p class=\"payment-qr-hint\" style=\"margin-top:12px;font-size:13px;color:var(--gray-500)\">请使用微信扫描二维码完成支付</p>\n          <p id=\"pay-status-msg\" style=\"margin-top:8px;font-size:12px;color:var(--blue-500);display:none\">⏳ 等待支付中...</p>\n        </div>\n        <div class=\"coupon-section\">\n          <div style=\"font-size:13px;font-weight:600;color:var(--gray-700);margin-bottom:8px\">有优惠码？</div>\n          <div class=\"coupon-row\">\n            <input type=\"text\" id=\"coupon-input\" placeholder=\"输入优惠码/会员码/打折码\" maxlength=\"20\" autocomplete=\"off\">\n            <button onclick=\"applyCoupon(" + _0x164fad + ")\">验证</button>\n          </div>\n          <div class=\"coupon-result\" id=\"coupon-result\"></div>\n        </div>\n      </div>\n    </div>";
  document.body.appendChild(_0x16f577);
  requestAnimationFrame(() => _0x16f577.classList.add("show"));
  createWxPayOrder(_0x164fad, _0x2e8946, _0x2c212b, _0x20eb13 || 0, _0x1c8cc9);
}
function updatePayButton() {
  const _0x5592dc = window._paymentContext;
  if (!_0x5592dc) {
    return;
  }
  const {
    id: _0x24469f,
    itemName: _0x414409,
    itemPrice: _0x39598e,
    itemType: _0x55239e,
    memberPlan: _0x4529af,
    isResource: _0x1c9378
  } = _0x5592dc;
  const _0xe37ea3 = Math.round(Math.round(Number(_0x39598e) * 100) * currentCouponDiscount) / 100;
  if (_0xe37ea3 === 0) {
    document.getElementById("pay-qr-canvas").innerHTML = "<div style=\"padding:30px;font-size:48px\">🎁</div>";
    document.querySelector(".payment-qr-hint").textContent = "优惠码已抵扣全部金额，正在为您开通...";
    if (window._activeCouponCode && State.user) {
      apiFetch("/api/coupon/use", {
        method: "POST",
        body: JSON.stringify({
          code: window._activeCouponCode
        })
      }).catch(() => {});
      window._activeCouponCode = null;
    }
    if (_payPollTimer) {
      clearInterval(_payPollTimer);
      _payPollTimer = null;
    }
    setTimeout(() => paymentSuccess(_0x24469f, _0x4529af, _0x1c9378), 800);
    return;
  }
  document.getElementById("pay-qr-canvas").innerHTML = "<div style=\"padding:40px;color:var(--gray-400)\">正在生成折后价二维码...</div>";
  if (_payPollTimer) {
    clearInterval(_payPollTimer);
    _payPollTimer = null;
  }
  createWxPayOrder(_0xe37ea3, _0x414409, _0x55239e, _0x24469f || 0, _0x1c9378);
}
async function createWxPayOrder(_0x39c335, _0x373690, _0x359cf7, _0x22b814, _0x413fc9) {
  const _0x2b648e = window._payRequestSeq = (window._payRequestSeq || 0) + 1;
  const _0x46f14a = window._activeCouponCode || "";
  try {
    const _0x351e3d = await apiFetch("/api/pay/create-order", {
      method: "POST",
      body: JSON.stringify({
        itemType: _0x359cf7,
        itemId: _0x22b814,
        price: _0x39c335,
        couponCode: _0x46f14a,
        requestId: window._paymentContext?.membershipRequestId,
        itemName: "图灵智赋-" + _0x373690
      })
    });
    if (_0x2b648e !== window._payRequestSeq || !document.getElementById("pay-qr-canvas")) {
      return;
    }
    if (_0x351e3d.success && _0x351e3d.code_url) {
      const _0x411709 = document.getElementById("pay-qr-canvas");
      _0x411709.innerHTML = "";
      const _0x163e8e = document.createElement("canvas");
      _0x411709.appendChild(_0x163e8e);
      QRCode.toCanvas(_0x163e8e, _0x351e3d.code_url, {
        width: 200,
        margin: 2
      });
      const _0x2aa146 = document.getElementById("pay-status-msg");
      if (_0x2aa146) {
        _0x2aa146.style.display = "block";
      }
      pollPaymentResult(_0x351e3d.out_trade_no, _0x22b814, _0x359cf7.startsWith("member_") ? _0x359cf7 : null, _0x413fc9);
    } else {
      const _0x336005 = document.getElementById("pay-status-msg");
      if (_0x336005) {
        _0x336005.style.display = "none";
      }
      document.getElementById("pay-qr-canvas").innerHTML = "<div style=\"padding:20px;color:var(--red-500)\">⚠️ " + (_0x351e3d.msg || "下单失败") + "</div>";
    }
  } catch (_0x295164) {
    if (_0x2b648e !== window._payRequestSeq || !document.getElementById("pay-qr-canvas")) {
      return;
    }
    console.error("[支付下单失败]", _0x295164);
    document.getElementById("pay-qr-canvas").innerHTML = "<div style=\"padding:20px;color:var(--red-500)\">⚠️ 支付服务暂时不可用，请稍后再试<br><small style=\"color:var(--gray-400);font-size:11px\">" + (_0x295164.message || "") + "</small></div>";
  }
}
let _payPollTimer = null;
function pollPaymentResult(_0x22bc54, _0x4d955b, _0x2258a5, _0x11fc73) {
  if (_payPollTimer) {
    clearInterval(_payPollTimer);
  }
  let _0x31f34b = 0;
  _payPollTimer = setInterval(async () => {
    _0x31f34b++;
    if (_0x31f34b > 180) {
      clearInterval(_payPollTimer);
      return;
    }
    try {
      const _0x669aa0 = await apiFetch("/api/pay/query?out_trade_no=" + _0x22bc54);
      if (_0x669aa0.success && _0x669aa0.status === "paid") {
        clearInterval(_payPollTimer);
        paymentSuccess(_0x669aa0.item_id || _0x4d955b, _0x2258a5, _0x11fc73);
      }
    } catch (_0x22dcc7) {}
  }, 1000);
}
function paymentSuccess(_0x315e1b, _0x309d04, _0x223898) {
  if (_payPollTimer) {
    clearInterval(_payPollTimer);
  }
  if (window._activeCouponCode && State.user) {
    apiFetch("/api/coupon/use", {
      method: "POST",
      body: JSON.stringify({
        code: window._activeCouponCode
      })
    }).catch(() => {});
    window._activeCouponCode = null;
  }
  currentCouponDiscount = 1;
  if (_0x309d04 === "member_month" || _0x309d04 === "member_year" || _0x309d04 === "month" || _0x309d04 === "year") {
    State.membership = true;
    State.user.isMember = true;
    State.save();
    toast("🎉 会员购买成功！现在可以无限使用所有程序和资源", "success");
  } else if (_0x315e1b && _0x223898) {
    if (!State.resPurchases.includes(_0x315e1b)) {
      State.resPurchases.push(_0x315e1b);
    }
    State.save();
    const _0x2c7360 = RESOURCES.find(_0x1e48d9 => _0x1e48d9.id === _0x315e1b);
    toast("🎉 购买成功！「" + (_0x2c7360?.title || "") + "」已解锁", "success");
  } else if (_0x315e1b) {
    if (!State.purchases.includes(_0x315e1b)) {
      State.purchases.push(_0x315e1b);
    }
    State.save();
    const _0xdb2a15 = PROGRAMS.find(_0x10cf4e => _0x10cf4e.id === _0x315e1b);
    toast("🎉 购买成功！「" + (_0xdb2a15?.title || "") + "」已永久解锁", "success");
  }
  const _0xc9137 = $(".modal-overlay");
  if (_0xc9137) {
    _0xc9137.classList.remove("show");
    setTimeout(() => _0xc9137.remove(), 300);
  }
  render();
}
let currentCouponDiscount = 1;
async function applyCoupon(_0x5def9a) {
  const _0x165a9c = $("#coupon-input");
  const _0x436d91 = $("#coupon-result");
  const _0x395a74 = $("#pay-price-display");
  if (!_0x165a9c || !_0x436d91 || !_0x395a74) {
    return;
  }
  const _0x50fd7f = _0x165a9c.value.trim().toUpperCase();
  if (!_0x50fd7f) {
    toast("请输入优惠码", "error");
    return;
  }
  const _0x311024 = window._paymentContext;
  const _0x293d2c = window._couponVerifySeq = (window._couponVerifySeq || 0) + 1;
  const _0xde6732 = () => window._paymentContext === _0x311024 && $("#coupon-input") === _0x165a9c && window._couponVerifySeq === _0x293d2c;
  try {
    const _0x2a8a27 = await fetch(API_BASE + "/api/coupon/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: _0x50fd7f
      })
    });
    const _0x445795 = await _0x2a8a27.json();
    if (!_0xde6732()) {
      return;
    }
    if (_0x445795.success) {
      if (_0x445795.type === "member") {
        activateMemberCode(_0x50fd7f);
        return;
      }
      currentCouponDiscount = _0x445795.discount;
      window._activeCouponCode = _0x50fd7f;
      const _0x43c3c4 = (Math.round(Math.round(Number(_0x5def9a) * 100) * _0x445795.discount) / 100).toFixed(2);
      _0x436d91.className = "coupon-result valid";
      const _0x5671f8 = _0x445795.discount === 0 ? "免费体验" : Math.round(_0x445795.discount * 10) + "折优惠";
      _0x436d91.innerHTML = "<span>&#10003;</span> " + (_0x445795.label || _0x5671f8) + (_0x445795.discount > 0 ? " · 实付 ¥" + _0x43c3c4 : "");
      _0x395a74.innerHTML = _0x43c3c4 == 0 ? "<span class=\"price-original\">¥" + _0x5def9a + "</span> ¥0" : "<span class=\"price-original\">¥" + _0x5def9a + "</span> ¥" + _0x43c3c4;
      toast("优惠码验证成功" + (_0x445795.discount > 0 ? "，享" + Math.round(_0x445795.discount * 10) + "折" : "，免费领取"), "success");
      updatePayButton();
    } else {
      currentCouponDiscount = 1;
      window._activeCouponCode = null;
      _0x436d91.className = "coupon-result invalid";
      _0x436d91.innerHTML = "<span>&#10007;</span> " + (_0x445795.msg || "无效的优惠码");
      _0x395a74.textContent = "¥" + _0x5def9a;
      updatePayButton();
    }
  } catch (_0x516df6) {
    if (!_0xde6732()) {
      return;
    }
    toast("网络错误", "error");
  }
}
async function activateMemberCode(_0x1217f1) {
  if (!State.user) {
    toast("请先登录", "error");
    return;
  }
  try {
    const _0x4fa9ea = await apiFetch("/api/redeem-member-code", {
      method: "POST",
      body: JSON.stringify({
        code: _0x1217f1
      })
    });
    if (_0x4fa9ea.success) {
      State.membership = true;
      State.user.isMember = true;
      State.save();
      toast("会员码兑换成功！已获得 " + (_0x4fa9ea.days || "") + " 天 VIP", "success");
      if (window._dynamicCoupons) {
        delete window._dynamicCoupons[_0x1217f1];
      }
      const _0x2dcf3f = document.querySelector(".modal-overlay");
      if (_0x2dcf3f) {
        _0x2dcf3f.classList.remove("show");
        setTimeout(() => _0x2dcf3f.remove(), 300);
      }
      render();
    } else {
      toast("兑换失败: " + (_0x4fa9ea.msg || "未知错误"), "error");
    }
  } catch (_0x5e59ab) {
    toast("网络错误", "error");
  }
}
function renderMembership() {
  const _0x392a0c = document.createElement("div");
  const _0x4b24f1 = document.createElement("section");
  _0x4b24f1.className = "membership-hero";
  _0x4b24f1.innerHTML = "\n    <div class=\"membership-hero-inner\">\n      <div class=\"membership-kicker\">会员服务</div>\n      <h1>让课堂工具用得更从容</h1>\n      <p>适合需要持续备课、课堂演示和探索精品小程序的老师，按自己的节奏选择即可。</p>\n      <div class=\"membership-cards\">\n        <div class=\"membership-card\">\n          <div class=\"mc-name\">月度会员</div>\n          <div class=\"mc-desc\">适合短期体验与阶段性教学使用</div>\n          <div class=\"mc-price\">¥39.9<span>/月</span></div>\n          <ul class=\"mc-features\">\n            <li>全部小程序持续可用</li>\n            <li>适合先体验完整功能</li>\n            <li>到期前可灵活调整</li>\n            <li>基础服务支持</li>\n          </ul>\n          <button class=\"btn btn-outline btn-block\" onclick=\"showPayment(null,'month')\">选择月度方案</button>\n        </div>\n        <div class=\"membership-card popular\">\n          <div class=\"mc-name\">年度会员</div>\n          <div class=\"mc-desc\">适合长期备课与课堂高频使用</div>\n          <div class=\"mc-price\">¥199<span>/年</span></div>\n          <ul class=\"mc-features\">\n            <li>全部小程序持续可用</li>\n            <li>折合每月约 ¥16.6</li>\n            <li>新程序优先体验</li>\n            <li>服务支持更稳定</li>\n          </ul>\n          <button class=\"btn btn-primary btn-block\" onclick=\"showPayment(null,'year')\">选择年度方案</button>\n        </div>\n      </div>\n    </div>";
  _0x392a0c.appendChild(_0x4b24f1);
  const _0x2155b6 = document.createElement("section");
  _0x2155b6.className = "section";
  _0x2155b6.innerHTML = "\n    <div class=\"section-header\">\n      <h2>不同使用方式的差异</h2>\n      <p>免费试用适合了解作品，会员方案更适合持续课堂使用</p>\n    </div>\n    <div style=\"max-width:700px;margin:0 auto;background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);overflow:hidden;\">\n      <table style=\"width:100%;border-collapse:collapse;font-size:14px;\">\n        <thead>\n          <tr style=\"background:var(--gray-50)\">\n            <th style=\"padding:14px 20px;text-align:left;font-weight:600;color:var(--gray-700)\">权益</th>\n            <th style=\"padding:14px 20px;text-align:center;font-weight:600;color:var(--gray-500)\">免费用户</th>\n            <th style=\"padding:14px 20px;text-align:center;font-weight:600;color:var(--blue-600)\">会员</th>\n          </tr>\n        </thead>\n        <tbody>\n          <tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:12px 20px\">免费试用</td><td style=\"text-align:center\">每个程序3次</td><td style=\"text-align:center;color:var(--green-600)\">不受试用次数限制 ✓</td></tr>\n          <tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:12px 20px\">程序使用</td><td style=\"text-align:center\">可按需单独购买</td><td style=\"text-align:center;color:var(--green-600)\">会员期内持续可用 ✓</td></tr>\n          <tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:12px 20px\">上传作品</td><td style=\"text-align:center;color:var(--green-600)\">✓</td><td style=\"text-align:center;color:var(--green-600)\">✓</td></tr>\n          <tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:12px 20px\">售卖作品</td><td style=\"text-align:center;color:var(--green-600)\">✓</td><td style=\"text-align:center;color:var(--green-600)\">✓</td></tr>\n          <tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:12px 20px\">优先体验新程序</td><td style=\"text-align:center;color:var(--gray-400)\">✗</td><td style=\"text-align:center;color:var(--green-600)\">✓</td></tr>\n          <tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:12px 20px\">专属客服</td><td style=\"text-align:center;color:var(--gray-400)\">✗</td><td style=\"text-align:center;color:var(--green-600)\">✓</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div style=\"max-width:700px;margin:48px auto 0;\">\n      <div class=\"section-header\"><h2>常见问题</h2></div>\n      <div id=\"faq-list\">\n        " + [["购买会员后可以退款吗？", "购买后 7 天内如未实际使用付费权益，可联系我们协助处理退款；如已开始使用相关权益，我们会根据实际情况沟通处理。"], ["会员到期后已使用的程序还能用吗？", "会员期间体验过的程序，到期后可根据需要续费或单独购买继续使用。单独购买的程序不受会员到期影响。"], ["我上传的程序如何定价？", "您可以自由定价，也可以设为免费。收益按订单创建时生效的比例结算，当前比例可在上传页和“我的收益”查看，历史订单保持原规则。"], ["如何保护我的HTML源代码？", "平台通过沙箱化iframe加载、禁止右键查看源码、水印保护等多重措施保护您的代码版权。用户只能在线使用，无法下载源文件。"], ["支持哪些支付方式？", "目前支持微信支付和支付宝两种主流支付方式，支持扫码支付和手机端支付。"], ["免费用户和邀请福利有哪些？", "免费用户每个程序可试用3次（带防盗水印）。邀请1名新老师注册，赠送全站3天VIP。成功上传3个原创小程序，赠送3个月VIP及共创达人称号。"]].map((_0x367974, _0x45e0b2) => "\n          <div style=\"border:1px solid var(--gray-200);border-radius:var(--radius-sm);margin-bottom:8px;background:#fff;\">\n            <button style=\"width:100%;padding:16px 20px;text-align:left;font-size:14px;font-weight:600;color:var(--gray-800);border:none;background:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:var(--font-sans)\" onclick=\"this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('span').textContent=this.nextElementSibling.style.display==='none'?'+':'−'\">\n              " + _0x367974[0] + " <span style=\"color:var(--gray-400);font-size:18px\">+</span>\n            </button>\n            <div style=\"display:none;padding:0 20px 16px;font-size:13.5px;color:var(--gray-600);line-height:1.7\">" + _0x367974[1] + "</div>\n          </div>\n        ").join("") + "\n      </div>\n    </div>";
  _0x392a0c.appendChild(_0x2155b6);
  return _0x392a0c;
}
function getResTrials(_0x2fe38e) {
  if (State.resTrials[_0x2fe38e] !== undefined) {
    return State.resTrials[_0x2fe38e];
  } else {
    return 3;
  }
}
function hasResPurchased(_0x3052b3) {
  return State.membership || State.resPurchases.includes(_0x3052b3);
}
function useResTrialOnce(_0x189b44) {
  if (hasResPurchased(_0x189b44)) {
    return true;
  }
  const _0x88f60c = getResTrials(_0x189b44);
  if (_0x88f60c <= 0) {
    return false;
  }
  State.resTrials[_0x189b44] = _0x88f60c - 1;
  State.save();
  return true;
}
function filteredResources() {
  return RESOURCES.filter(_0x1aafe6 => {
    if (State.resFilters.resType !== "全部" && _0x1aafe6.resType !== State.resFilters.resType) {
      return false;
    }
    if (State.resFilters.subject !== "全部" && _0x1aafe6.subject !== State.resFilters.subject) {
      return false;
    }
    if (State.resFilters.search && !_0x1aafe6.title.includes(State.resFilters.search) && !_0x1aafe6.desc.includes(State.resFilters.search)) {
      return false;
    }
    return true;
  });
}
function getResGradient(_0x3d30c6) {
  return {
    课件: "#8b5cf6,#6d28d9",
    视频: "#ef4444,#dc2626",
    文档: "#0ea5e9,#0284c7",
    图片素材: "#f59e0b,#d97706",
    音频: "#10b981,#059669"
  }[_0x3d30c6] || "#6b7280,#4b5563";
}
function getResBadgeClass(_0x57340d) {
  return {
    课件: "res-badge-courseware",
    视频: "res-badge-video",
    文档: "res-badge-document",
    图片素材: "res-badge-image",
    音频: "res-badge-audio"
  }[_0x57340d] || "";
}
function renderResources() {
  const _0x53ab39 = document.createElement("div");
  _0x53ab39.className = "browse-page";
  const _0x212773 = filteredResources();
  _0x53ab39.innerHTML = "\n    <div class=\"browse-header reveal\">\n      <h1>📚 教学资源中心</h1>\n      <p class=\"page-desc\">精选课件、教学视频、文档、图片素材等教学资源，所有资源预览均带水印保护</p>\n    </div>\n    <div class=\"browse-layout\">\n      <aside class=\"browse-sidebar reveal\">\n        <div class=\"sidebar-section\">\n          <h3>资源类型</h3>\n          <div class=\"filter-group\">\n            " + RES_TYPES.map(_0x1ab767 => "<button class=\"filter-btn " + (State.resFilters.resType === _0x1ab767 ? "active" : "") + "\" onclick=\"State.resFilters.resType='" + _0x1ab767 + "';render()\">" + _0x1ab767 + "</button>").join("") + "\n          </div>\n        </div>\n        <div class=\"sidebar-section\">\n          <h3>学科</h3>\n          <div class=\"filter-group\">\n            " + SUBJECTS.map(_0x52a83e => "<button class=\"filter-btn " + (State.resFilters.subject === _0x52a83e ? "active" : "") + "\" onclick=\"State.resFilters.subject='" + _0x52a83e + "';render()\">" + _0x52a83e + "</button>").join("") + "\n          </div>\n        </div>\n        <div class=\"sidebar-section\">\n          <h3>搜索</h3>\n          <input class=\"form-input\" placeholder=\"搜索资源...\" value=\"" + State.resFilters.search + "\" oninput=\"State.resFilters.search=this.value;render()\">\n        </div>\n        <button class=\"btn btn-outline\" style=\"width:100%;margin-top:12px\" onclick=\"State.resFilters={resType:'全部',subject:'全部',search:''};render()\">清除筛选</button>\n      </aside>\n      <main class=\"browse-main\">\n        <div class=\"browse-result-bar reveal\">\n          <span>找到 <strong>" + _0x212773.length + "</strong> 个教学资源</span>\n        </div>\n        <div class=\"resource-grid reveal\">\n          " + _0x212773.map(_0x5c98d1 => {
    return "<div class=\"resource-card\" onclick=\"showResDetail(" + _0x5c98d1.id + ")\">\n              <div class=\"resource-card-cover\" style=\"background:linear-gradient(135deg," + getResGradient(_0x5c98d1.resType) + ")\">\n                " + _0x5c98d1.emoji + "\n                <span class=\"res-type-badge " + getResBadgeClass(_0x5c98d1.resType) + "\">" + _0x5c98d1.resType + " · " + _0x5c98d1.format + "</span>\n              </div>\n              <div class=\"resource-card-body\">\n                <div class=\"resource-card-title\">" + _0x5c98d1.title + "</div>\n                <div class=\"resource-card-meta\">\n                  <span>" + _0x5c98d1.subject + "</span><span>·</span><span>" + (_0x5c98d1.grade_level || _0x5c98d1.grade) + "</span><span>·</span><span>" + _0x5c98d1.size + "</span>\n                </div>\n                <div class=\"resource-card-bottom\">\n                  <span class=\"resource-card-author\">⭐" + _0x5c98d1.rating + " · " + _0x5c98d1.author + "</span>\n                </div>\n              </div>\n            </div>";
  }).join("") + "\n        </div>\n        " + (_0x212773.length === 0 ? "<div style=\"text-align:center;padding:80px 20px;color:var(--gray-400)\"><div style=\"font-size:48px;margin-bottom:16px\">📭</div><p>没有找到匹配的资源</p></div>" : "") + "\n      </main>\n    </div>";
  return _0x53ab39;
}
function showResDetail(_0x4ca4f3) {
  const _0x6f8bcc = RESOURCES.find(_0xbcbd09 => _0xbcbd09.id === _0x4ca4f3);
  if (!_0x6f8bcc) {
    return;
  }
  const _0xafb20b = _0x6f8bcc.price === 0;
  const _0xf629b5 = hasResPurchased(_0x4ca4f3);
  const _0x13047e = getResTrials(_0x4ca4f3);
  const _0x20c938 = document.createElement("div");
  _0x20c938.className = "modal-overlay";
  _0x20c938.onclick = _0x56e239 => {
    if (_0x56e239.target === _0x20c938) {
      _0x20c938.classList.remove("show");
      setTimeout(() => _0x20c938.remove(), 300);
    }
  };
  _0x20c938.innerHTML = "\n    <div class=\"modal\" onclick=\"event.stopPropagation()\">\n      <div class=\"modal-close\">\n        <button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button>\n      </div>\n      <div class=\"detail-hero\">\n        <div class=\"detail-cover\" style=\"background:linear-gradient(135deg," + getResGradient(_0x6f8bcc.resType) + ")\">" + _0x6f8bcc.emoji + "</div>\n        <div class=\"detail-info\">\n          <h2 class=\"detail-title\">" + _0x6f8bcc.title + "</h2>\n          <div class=\"detail-tags\">\n            <span class=\"detail-tag\">" + _0x6f8bcc.resType + "</span>\n            <span class=\"detail-tag\">" + _0x6f8bcc.subject + "</span>\n            <span class=\"detail-tag\">" + (_0x6f8bcc.grade_level || _0x6f8bcc.grade) + "</span>\n            <span class=\"detail-tag\">" + _0x6f8bcc.format + " · " + _0x6f8bcc.size + "</span>\n          </div>\n          <p class=\"detail-desc\">" + _0x6f8bcc.desc + "</p>\n          <div class=\"detail-price-row\">\n            <span class=\"detail-price " + (_0xafb20b ? "free" : "") + "\">" + (_0xafb20b ? "免费" : "¥" + _0x6f8bcc.price) + "</span>\n            <span style=\"font-size:13px;color:var(--gray-400)\">已有 " + _0x6f8bcc.uses + " 次使用</span>\n          </div>\n          " + (!_0xf629b5 && !_0xafb20b ? "\n          <div class=\"detail-trial-info\">\n            💡 剩余免费预览次数: <strong>" + _0x13047e + "/3</strong> 次 " + (_0x13047e <= 0 ? "（预览次数已用完，请购买后使用）" : "") + "\n            <br><small style=\"color:var(--gray-400)\">预览时将带有平台和作者水印</small>\n          </div>" : "") + "\n          " + (_0xf629b5 || _0xafb20b ? "<div class=\"detail-trial-info\" style=\"background:var(--green-50);border-color:#bbf7d0;\">✅ " + (_0xafb20b ? "免费资源" : "已购买") + "（预览仍带水印保护原创）</div>" : "") + "\n          <div class=\"detail-actions\">\n            <button class=\"btn btn-primary btn-lg\" onclick=\"openResViewer(" + _0x6f8bcc.id + ")\" " + (!_0xf629b5 && !_0xafb20b && _0x13047e <= 0 ? "disabled style=\"opacity:.5;cursor:not-allowed\"" : "") + ">\n              👁️ " + (_0xf629b5 || _0xafb20b ? "预览资源" : _0x13047e > 0 ? "免费预览" : "需要购买") + "\n            </button>\n            " + (!_0xf629b5 && !_0xafb20b ? "<button class=\"btn btn-amber btn-lg\" onclick=\"showPayment(" + _0x6f8bcc.id + ", null, true)\">💳 购买并下载</button>" : "") + "\n            " + (_0xf629b5 ? "<button class=\"btn btn-amber btn-lg\" onclick=\"toast('下载功能将在服务器上线后启用','info')\">⬇️ 下载原件</button>" : "") + "\n          </div>\n        </div>\n      </div>\n      <div class=\"detail-author-row\">\n        <div class=\"detail-author-avatar\">" + _0x6f8bcc.author[0] + "</div>\n        <div class=\"detail-author-info\">\n          <div class=\"detail-author-name\">" + _0x6f8bcc.author + "</div>\n          <div class=\"detail-author-bio\">教育工作者</div>\n        </div>\n        <span style=\"font-size:13px;color:var(--gray-400)\">⭐ " + _0x6f8bcc.rating + " 评分</span>\n      </div>\n    </div>";
  document.body.appendChild(_0x20c938);
  requestAnimationFrame(() => _0x20c938.classList.add("show"));
}
function openResViewer(_0x4fc055) {
  if (!State.user) {
    showAuthModal();
    toast("请先登录后预览", "error");
    return;
  }
  const _0x1938a3 = RESOURCES.find(_0x2cf48a => _0x2cf48a.id === _0x4fc055);
  if (!_0x1938a3) {
    return;
  }
  const _0x5c8f22 = _0x1938a3.price === 0;
  const _0x4f21fe = hasResPurchased(_0x4fc055);
  if (!_0x5c8f22 && !_0x4f21fe) {
    if (!useResTrialOnce(_0x4fc055)) {
      toast("免费预览次数已用完，请购买后使用", "error");
      return;
    }
    toast("预览中 · 剩余 " + getResTrials(_0x4fc055) + " 次免费预览");
  }
  const _0x1198d7 = $(".modal-overlay");
  if (_0x1198d7) {
    _0x1198d7.classList.remove("show");
    setTimeout(() => _0x1198d7.remove(), 300);
  }
  const _0x3841e9 = State.user ? State.user.name : "";
  const _0x470578 = "图灵智赋 · " + _0x1938a3.author + " · " + _0x3841e9;
  const _0x49496c = 15;
  const _0x3616c6 = document.createElement("div");
  _0x3616c6.className = "res-viewer-overlay";
  _0x3616c6.id = "res-viewer";
  const _0x1af926 = _0x4f21fe || _0x5c8f22 ? _0x5c8f22 ? "免费资源" : "已购买" : "预览中 · 剩余 " + getResTrials(_0x4fc055) + " 次";
  const _0x30fa2c = _0x4f21fe || _0x5c8f22 ? "purchased" : "trial";
  let _0x49561d = "";
  const _0x5267d3 = _0x1938a3.previewContent === "video" || _0x1938a3.previewContent === "audio";
  if (_0x1938a3.previewContent === "video") {
    _0x49561d = "\n      <video controls autoplay style=\"max-width:90%;max-height:80vh;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.5)\">\n        <source src=\"data:video/mp4;base64,\" type=\"video/mp4\">\n      </video>\n      <div style=\"position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;padding:12px 28px;border-radius:12px;text-align:center;backdrop-filter:blur(8px)\">\n        <div style=\"font-size:18px;font-weight:700;margin-bottom:4px\">" + _0x1938a3.emoji + " " + _0x1938a3.title + "</div>\n        <div style=\"font-size:13px;opacity:.8\">模拟视频预览 · 实际部署后将播放真实视频</div>\n      </div>";
  } else if (_0x1938a3.previewContent === "image") {
    const _0x22dd13 = getResGradient(_0x1938a3.resType).split(",");
    _0x49561d = "\n      <div style=\"background:linear-gradient(135deg," + _0x22dd13[0] + "," + _0x22dd13[1] + ");width:80%;max-width:700px;aspect-ratio:4/3;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.5)\">\n        <div style=\"font-size:72px;margin-bottom:16px\">" + _0x1938a3.emoji + "</div>\n        <div style=\"color:#fff;font-size:20px;font-weight:700\">" + _0x1938a3.title + "</div>\n        <div style=\"color:rgba(255,255,255,.7);font-size:14px;margin-top:8px\">图片预览示意 · " + _0x1938a3.format + " · " + _0x1938a3.size + "</div>\n      </div>";
  } else if (_0x1938a3.previewContent === "courseware") {
    _0x49561d = "\n      <div class=\"doc-preview\" style=\"position:relative\">\n        <div style=\"text-align:center;margin-bottom:32px;padding:24px;background:linear-gradient(135deg," + getResGradient(_0x1938a3.resType) + ");border-radius:12px;color:#fff\">\n          <div style=\"font-size:48px;margin-bottom:12px\">" + _0x1938a3.emoji + "</div>\n          <h2 style=\"color:#fff;font-size:22px\">" + _0x1938a3.title + "</h2>\n          <p style=\"opacity:.8;margin-top:8px\">作者: " + _0x1938a3.author + " | 格式: " + _0x1938a3.format + " | 大小: " + _0x1938a3.size + "</p>\n        </div>\n        <h2>课件预览</h2>\n        <p>" + _0x1938a3.desc + "</p>\n        <div style=\"background:var(--gray-50);border-radius:8px;padding:20px;margin:16px 0;border:1px dashed var(--gray-300);text-align:center;color:var(--gray-400)\">\n          <p style=\"font-size:36px;margin-bottom:8px\">📊</p>\n          <p>课件幻灯片内容预览区域</p>\n          <p style=\"font-size:12px;margin-top:4px\">完整课件包含多页幻灯片，购买后可下载原始" + _0x1938a3.format + "文件</p>\n        </div>\n        <p style=\"color:var(--gray-400);font-size:13px;text-align:center\">— 预览内容到此结束，购买后可获取完整文件 —</p>\n      </div>";
  } else if (_0x1938a3.previewContent === "audio") {
    _0x49561d = "\n      <div style=\"background:rgba(255,255,255,.05);border-radius:24px;padding:48px;text-align:center;max-width:500px;backdrop-filter:blur(20px)\">\n        <div style=\"font-size:72px;margin-bottom:20px\">" + _0x1938a3.emoji + "</div>\n        <div style=\"color:#fff;font-size:20px;font-weight:700;margin-bottom:8px\">" + _0x1938a3.title + "</div>\n        <div style=\"color:rgba(255,255,255,.5);font-size:14px;margin-bottom:24px\">" + _0x1938a3.format + " · " + _0x1938a3.size + " · " + _0x1938a3.author + "</div>\n        <div style=\"background:rgba(255,255,255,.1);border-radius:12px;padding:16px\">\n          <div style=\"display:flex;align-items:center;gap:12px;justify-content:center\">\n            <button onclick=\"toast('音频播放模拟中','info')\" style=\"width:48px;height:48px;border-radius:50%;background:#10b981;border:none;color:#fff;font-size:20px;cursor:pointer\">▶</button>\n            <div style=\"flex:1;height:4px;background:rgba(255,255,255,.2);border-radius:2px;max-width:250px;position:relative\">\n              <div style=\"width:35%;height:100%;background:#10b981;border-radius:2px\"></div>\n            </div>\n            <span style=\"color:rgba(255,255,255,.5);font-size:13px\">1:23 / 3:45</span>\n          </div>\n        </div>\n      </div>";
  } else {
    _0x49561d = "\n      <div class=\"doc-preview\">\n        <h2>" + _0x1938a3.emoji + " " + _0x1938a3.title + "</h2>\n        <p>" + _0x1938a3.desc + "</p>\n        <div style=\"background:var(--gray-50);border-radius:8px;padding:20px;margin:16px 0;border:1px dashed var(--gray-300);text-align:center;color:var(--gray-400)\">\n          <p style=\"font-size:36px;margin-bottom:8px\">📄</p>\n          <p>文档内容预览区域</p>\n          <p style=\"font-size:12px;margin-top:4px\">购买后可下载完整" + _0x1938a3.format + "文件</p>\n        </div>\n      </div>";
  }
  _0x3616c6.innerHTML = "\n    <div class=\"viewer-header\">\n      <div class=\"viewer-title\">" + _0x1938a3.emoji + " " + _0x1938a3.title + " <span style=\"opacity:.5;font-size:12px;margin-left:8px\">" + _0x1938a3.resType + " · " + _0x1938a3.format + "</span></div>\n      <span class=\"viewer-status " + _0x30fa2c + "\">" + _0x1af926 + "</span>\n      <button class=\"viewer-close-btn\" onclick=\"closeResViewer()\">✕</button>\n    </div>\n    <div class=\"res-viewer-content\">\n      " + _0x49561d + "\n      <div class=\"res-viewer-watermark-layer " + (_0x5267d3 ? "" : "dark-wm") + "\">\n        " + ("<span>" + _0x470578 + "</span>".repeat(_0x49496c)) + "\n      </div>\n    </div>";
  document.body.appendChild(_0x3616c6);
  requestAnimationFrame(() => _0x3616c6.classList.add("show"));
  _0x3616c6.addEventListener("contextmenu", _0x5bc2e9 => _0x5bc2e9.preventDefault());
  _0x3616c6.addEventListener("keydown", _0x56313e => {
    if ((_0x56313e.ctrlKey || _0x56313e.metaKey) && (_0x56313e.key === "s" || _0x56313e.key === "u" || _0x56313e.key === "p")) {
      _0x56313e.preventDefault();
    }
  });
}
function closeResViewer() {
  const _0x10f5e9 = $("#res-viewer");
  if (_0x10f5e9) {
    _0x10f5e9.classList.remove("show");
    setTimeout(() => _0x10f5e9.remove(), 300);
  }
}
function renderUpload() {
  if (!State.user) {
    setTimeout(() => {
      showAuthModal();
      toast("请先登录后上传作品", "error");
    }, 100);
    const _0x4b06b3 = document.createElement("div");
    _0x4b06b3.style.cssText = "margin-top:var(--header-h);padding:120px 24px;text-align:center;color:var(--gray-400)";
    _0x4b06b3.innerHTML = "<div style=\"font-size:48px;margin-bottom:16px\">🔒</div><p style=\"font-size:16px\">请先登录后访问此页面</p>";
    return _0x4b06b3;
  }
  const _0x27a45f = document.createElement("div");
  _0x27a45f.className = "upload-page";
  _0x27a45f.innerHTML = "\n    <h1>📤 上传我的作品</h1>\n    <p class=\"page-desc\">分享您的教学小程序、课件、视频等资源，与更多老师一起让课堂更精彩</p>\n\n    <div class=\"upload-section\">\n      <h3>0. 选择资源类型</h3>\n      <div class=\"upload-type-selector\">\n        <button class=\"upload-type-btn active\" onclick=\"switchUploadType(this,'program')\">\n          <div class=\"utb-icon\">💻</div>\n          <div class=\"utb-label\">HTML小程序</div>\n          <div class=\"utb-hint\">交互式教学程序</div>\n        </button>\n        <button class=\"upload-type-btn\" onclick=\"switchUploadType(this,'courseware')\">\n          <div class=\"utb-icon\">📑</div>\n          <div class=\"utb-label\">教学课件</div>\n          <div class=\"utb-hint\">PPT / Keynote</div>\n        </button>\n        <button class=\"upload-type-btn\" onclick=\"switchUploadType(this,'video')\">\n          <div class=\"utb-icon\">🎬</div>\n          <div class=\"utb-label\">教学视频</div>\n          <div class=\"utb-hint\">MP4 / MOV</div>\n        </button>\n        <button class=\"upload-type-btn\" onclick=\"switchUploadType(this,'document')\">\n          <div class=\"utb-icon\">📄</div>\n          <div class=\"utb-label\">文档资料</div>\n          <div class=\"utb-hint\">PDF / Word</div>\n        </button>\n        <button class=\"upload-type-btn\" onclick=\"switchUploadType(this,'image')\">\n          <div class=\"utb-icon\">🖼️</div>\n          <div class=\"utb-label\">图片素材</div>\n          <div class=\"utb-hint\">PNG / JPG / SVG</div>\n        </button>\n        <button class=\"upload-type-btn\" onclick=\"switchUploadType(this,'audio')\">\n          <div class=\"utb-icon\">🔊</div>\n          <div class=\"utb-label\">音频素材</div>\n          <div class=\"utb-hint\">MP3 / WAV</div>\n        </button>\n        <button class=\"upload-type-btn\" onclick=\"switchUploadType(this,'external')\">\n          <div class=\"utb-icon\">🌐</div>\n          <div class=\"utb-label\">网页/外链</div>\n          <div class=\"utb-hint\">iframe 嵌入站点</div>\n        </button>\n      </div>\n    </div>\n\n    <div class=\"upload-section\" id=\"upload-section-file\">\n      <h3>1. 上传文件</h3>\n      <div class=\"dual-upload\">\n        <div>\n          <div class=\"upload-label\"><span class=\"required\">*</span> 核心文件（必填）</div>\n          <div class=\"upload-dropzone\" onclick=\"document.getElementById('file-input').click()\" ondragover=\"event.preventDefault();this.style.borderColor='var(--blue-400)'\" ondrop=\"event.preventDefault();handleFileDrop(event)\" ondragleave=\"this.style.borderColor='var(--gray-300)'\">\n            <div class=\"upload-dropzone-icon\" id=\"upload-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div>\n            <p id=\"file-name-display\">点击选择或拖拽文件</p>\n            <p class=\"hint\" id=\"upload-hint\">支持 .html 或 .zip 项目包（含JS/GLB/JSON等依赖），不超过 500MB</p>\n          </div>\n          <input type=\"file\" id=\"file-input\" accept=\".html,.htm,.zip\" style=\"display:none\" onchange=\"handleFileSelect(this)\">\n        </div>\n        <div>\n          <div class=\"upload-label\">配套教案/附件（可选）</div>\n          <div class=\"upload-dropzone\" onclick=\"document.getElementById('attach-input').click()\" ondragover=\"event.preventDefault();this.style.borderColor='var(--blue-400)'\" ondragleave=\"this.style.borderColor='var(--gray-300)'\">\n            <div class=\"upload-dropzone-icon\" id=\"attach-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div>\n            <p id=\"attach-name-display\">教案、课件或资源包</p>\n            <p class=\"hint\">ZIP / PDF / PPT / 图片，不超过 50MB</p>\n          </div>\n          <input type=\"file\" id=\"attach-input\" accept=\".zip,.rar,.pdf,.ppt,.pptx,.doc,.docx,.jpg,.png\" style=\"display:none\" onchange=\"handleAttachSelect(this)\">\n        </div>\n      </div>\n    </div>\n\n    <div class=\"upload-section\" id=\"upload-section-external\" style=\"display:none\">\n      <h3>1. 网页地址 <span style=\"color:var(--red-500)\">*</span></h3>\n      <div class=\"form-group\">\n        <input class=\"form-input\" type=\"url\" id=\"upload-external-url\" placeholder=\"https://example.com/  （仅支持 https，不支持 http）\" autocomplete=\"off\">\n        <p class=\"hint\" style=\"margin-top:8px;color:var(--gray-500);font-size:12px\">\n          仅支持 https:// 链接。该链接将以受限 iframe 嵌入展示（沙箱隔离）。<br>\n          ⚠️ 若目标网站禁止被嵌入（X-Frame-Options/CSP），将无法正常显示，请提前自测；普通用户提交后需管理员审核。\n        </p>\n      </div>\n    </div>\n\n    <div class=\"upload-section\">\n      <h3>2. 上传封面图片 <span style=\"color:var(--red-500)\">*</span> <span style=\"font-size:12px;color:var(--gray-400);font-weight:400\">(必填)</span></h3>\n      <div class=\"upload-dropzone\" id=\"cover-dropzone\" onclick=\"document.getElementById('cover-input').click()\" style=\"padding:32px;position:relative\">\n        <img id=\"cover-preview\" style=\"display:none;width:100%;max-height:200px;object-fit:contain;border-radius:8px\">\n        <div id=\"cover-placeholder\">\n          <div class=\"upload-dropzone-icon\" id=\"cover-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div>\n          <p id=\"cover-name-display\">点击选择封面图片</p>\n          <p class=\"hint\">建议尺寸 800x500，支持 JPG/PNG 格式</p>\n        </div>\n      </div>\n      <input type=\"file\" id=\"cover-input\" accept=\"image/*\" style=\"display:none\" onchange=\"handleCoverSelect(this)\">\n    </div>\n\n    <div class=\"upload-section\">\n      <h3>可选：作品演示视频</h3>\n      <p style=\"font-size:12px;color:var(--gray-400);margin-bottom:12px\">支持 MP4 / MOV，普通作者不超过 200MB。提交后会进入管理员审核，通过后所有访客都能观看。</p>\n      <div class=\"upload-dropzone\" onclick=\"document.getElementById('program-video-input').click()\" style=\"padding:24px\">\n        <div class=\"upload-dropzone-icon\" id=\"program-video-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div>\n        <p id=\"program-video-name-display\">点击选择演示视频</p>\n        <p class=\"hint\">没有视频可以不上传，作品会保持原来的封面展示</p>\n      </div>\n      <input type=\"file\" id=\"program-video-input\" accept=\"video/mp4,video/quicktime,.mp4,.mov\" style=\"display:none\" onchange=\"handleProgramVideoSelect(this)\">\n    </div>\n\n   <div class=\"upload-section\">\n      <h3>新增：作品展示图 (选填，最多5张)</h3>\n      <p style=\"font-size:12px;color:var(--gray-400);margin-bottom:12px\">像淘宝一样，展示您作品的精彩截图和使用说明</p>\n      <div class=\"upload-dropzone\" onclick=\"document.getElementById('desc-images-input').click()\" style=\"padding:24px\">\n        <div id=\"desc-images-icon\" style=\"font-size:32px;margin-bottom:8px;color:#bbb;font-weight:200\">+</div>\n        <p id=\"desc-images-display\">点击选择多张图片</p>\n      </div>\n      <input type=\"file\" id=\"desc-images-input\" accept=\"image/*\" multiple style=\"display:none\" onchange=\"handleDescImagesSelect(this)\">\n      <div id=\"desc-images-preview\" style=\"display:flex;gap:10px;margin-top:12px;flex-wrap:wrap\"></div>\n    </div>\n\n    <div class=\"upload-section\">\n      <h3>3. 基本信息</h3>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:14px\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">作品标题 <span style=\"color:var(--red-500)\">*</span></label>\n          <input class=\"form-input\" type=\"text\" id=\"upload-title\" placeholder=\"例如：牛顿第二定律交互演示器\">\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">作者署名 <span style=\"font-size:11px;color:var(--gray-400);font-weight:400\">(前台展示名)</span></label>\n          " + (() => {
    const _0x435e42 = State.user ? htmlEscape(State.user.name) : "";
    const _0x4919b7 = State.user && (State.user.role === "admin" || State.user.role === "moderator");
    if (_0x4919b7) {
      return "<input class=\"form-input\" type=\"text\" id=\"upload-author-alias\" placeholder=\"输入展示给用户的老师名字\" value=\"" + _0x435e42 + "\">";
    }
    return "<input class=\"form-input\" type=\"text\" id=\"upload-author-alias\" readonly value=\"" + _0x435e42 + "\" style=\"background:var(--gray-100);cursor:not-allowed\" title=\"署名默认使用您的用户名，如需修改请联系管理员\">";
  })() + "\n        </div>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">作品详细介绍</label>\n        <div class=\"rich-editor-wrap\">\n          <div class=\"rich-editor-toolbar\">\n            <button title=\"加粗\" onclick=\"document.execCommand('bold')\"><b>B</b></button>\n            <button title=\"斜体\" onclick=\"document.execCommand('italic')\"><i>I</i></button>\n            <button title=\"下划线\" onclick=\"document.execCommand('underline')\"><u>U</u></button>\n            <div class=\"sep\"></div>\n            <button title=\"标题\" onclick=\"document.execCommand('formatBlock',false,'h3')\">H</button>\n            <button title=\"有序列表\" onclick=\"document.execCommand('insertOrderedList')\">1.</button>\n            <button title=\"无序列表\" onclick=\"document.execCommand('insertUnorderedList')\">-</button>\n            <div class=\"sep\"></div>\n            <button title=\"插入图片\" onclick=\"insertEditorImage()\">IMG</button>\n            <button title=\"分隔线\" onclick=\"document.execCommand('insertHorizontalRule')\">--</button>\n          </div>\n          <div class=\"rich-editor-area\" id=\"upload-desc\" contenteditable=\"true\" data-placeholder=\"图文并茂地介绍您的作品：功能亮点、适用年级、课堂使用场景等...\"></div>\n        </div>\n      </div>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">学科</label>\n          <select class=\"form-input\" id=\"upload-subject\">\n            " + SUBJECTS.filter(_0xed330a => _0xed330a !== "全部").map(_0x184ee6 => "<option value=\"" + _0x184ee6 + "\">" + _0x184ee6 + "</option>").join("") + "\n          </select>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">学段</label>\n          <select class=\"form-input\" id=\"upload-grade\" onchange=\"updateGradeLevelOptions('upload')\">\n            " + GRADES.filter(_0x36be0b => _0x36be0b !== "全部").map(_0x17cdfd => "<option value=\"" + _0x17cdfd + "\">" + _0x17cdfd + "</option>").join("") + "\n          </select>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">年级</label>\n          <select class=\"form-input\" id=\"upload-grade-level\">\n            <option value=\"\">不限</option>\n          </select>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">类型</label>\n          <select class=\"form-input\" id=\"upload-type\">\n            " + TYPES.filter(_0x107950 => _0x107950 !== "全部").map(_0x1d98e2 => "<option value=\"" + _0x1d98e2 + "\">" + _0x1d98e2 + "</option>").join("") + "\n          </select>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"upload-section\">\n      <h3>4. 定价设置</h3>\n      <div class=\"pricing-options\">\n        <button class=\"pricing-option active\" onclick=\"selectPricing(this,'free')\">\n          <div class=\"po-label\">🆓 免费</div>\n        </button>\n        <button class=\"pricing-option\" onclick=\"selectPricing(this,'paid')\">\n          <div class=\"po-label\">💰 付费</div>\n        </button>\n      </div>\n      <div id=\"price-input-area\" style=\"display:none\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">定价（元）</label>\n          <input class=\"form-input\" type=\"number\" id=\"upload-price\" min=\"0.1\" step=\"0.1\" placeholder=\"建议 1.0 ~ 50.0 元\">\n        </div>\n      </div>\n      <div class=\"revenue-note\">\n        💡 <strong>收益说明：</strong><span id=\"creator-share-note\">正在读取当前分成比例…</span>\n      </div>\n      <div class=\"revenue-note\" style=\"margin-top:8px;background:var(--blue-50);border-color:var(--blue-200)\">\n        🔒 <strong>版权保护：</strong>所有资源在预览/试用时均会自动添加 <strong>平台水印+作者水印+用户水印</strong>，有效防止未授权传播。购买后可下载无水印原件。\n      </div>\n    </div>\n\n    <div class=\"upload-section\">\n      <h3>摄像头权限</h3>\n      <label style=\"display:flex;align-items:flex-start;gap:10px;cursor:pointer;line-height:1.7\">\n        <input type=\"checkbox\" id=\"upload-runtime-camera\"\n          style=\"width:18px;height:18px;margin-top:4px;flex:0 0 auto\">\n        <span>\n          此作品需要使用摄像头\n          <span style=\"display:block;font-size:12px;color:var(--gray-400);margin-top:2px\">\n            仅用于 AR 手势、体感交互等课件。普通作品请不要勾选；管理员审核后才会按摄像头模式运行。\n          </span>\n        </span>\n      </label>\n    </div>\n\n    <div class=\"upload-section\">\n      <h3>5. 创作者承诺</h3>\n      <label style=\"display:flex;align-items:flex-start;gap:10px;cursor:pointer;line-height:1.7\">\n        <input type=\"checkbox\" id=\"creator-agreement-checkbox\" disabled\n          style=\"width:18px;height:18px;margin-top:4px;flex:0 0 auto\">\n        <span>\n          我已阅读并同意\n          <a href=\"/legal/creator-service-agreement.html\" target=\"_blank\" rel=\"noopener\"\n            onclick=\"event.stopPropagation()\" style=\"color:var(--blue-600);font-weight:600\">《创作者服务协议》</a>，\n          并确认作品为本人原创或已取得上传、展示、销售及授权用户使用所需的合法权利。\n        </span>\n      </label>\n      <p id=\"creator-agreement-status\" style=\"font-size:12px;color:var(--gray-400);margin:8px 0 0 28px\">\n        正在检查协议确认状态...\n      </p>\n    </div>\n\n    <div style=\"text-align:center;margin-top:8px\">\n      <button id=\"upload-submit-button\" class=\"btn btn-primary btn-lg\" onclick=\"submitUpload()\" style=\"min-width:240px\">\n        🚀 提交审核并发布\n      </button>\n      <p style=\"font-size:12px;color:var(--gray-400);margin-top:12px\">提交后将在1-2个工作日内完成审核</p>\n    </div>";
  return _0x27a45f;
}
let uploadedFile = null;
let currentUploadType = "program";
let creatorAgreementState = null;
async function loadCreatorShareNote(_0x1e3a54 = document) {
  const _0x33730f = _0x1e3a54.querySelector("#creator-share-note");
  if (!_0x33730f) {
    return;
  }
  try {
    const _0x5a94dc = await apiFetch("/api/creator-agreement/share-policy");
    if (!_0x33730f.isConnected) {
      return;
    }
    if (!_0x5a94dc.success || !_0x5a94dc.policy) {
      throw Error("unavailable");
    }
    const _0x2a30f1 = _0x5a94dc.policy;
    _0x33730f.textContent = "当前新订单：教师 " + _0x2a30f1.teacherBps / 100 + "%，平台 " + _0x2a30f1.platformBps / 100 + "%。以订单创建时比例为准，历史订单和已入账收益保持原规则。";
  } catch (_0x2c816d) {
    if (_0x33730f.isConnected) {
      _0x33730f.textContent = "当前分成比例暂时无法读取，请刷新后核对再定价。";
    }
  }
}
async function loadCreatorAgreementStatus() {
  loadCreatorShareNote();
  const _0x191e70 = document.getElementById("creator-agreement-checkbox");
  const _0x5a2f15 = document.getElementById("creator-agreement-status");
  if (!_0x191e70 || !_0x5a2f15 || !State.user) {
    return;
  }
  creatorAgreementState = null;
  const _0x5ded08 = await apiFetch("/api/creator-agreement/status");
  if (!_0x5ded08.success || !_0x5ded08.agreement) {
    _0x191e70.disabled = false;
    _0x191e70.checked = false;
    _0x5a2f15.textContent = _0x5ded08.msg || "协议状态加载失败，请阅读后手动勾选";
    _0x5a2f15.style.color = "var(--red-500)";
    return;
  }
  creatorAgreementState = _0x5ded08.agreement;
  _0x191e70.disabled = false;
  _0x191e70.checked = !!_0x5ded08.agreement.accepted;
  _0x5a2f15.textContent = _0x5ded08.agreement.accepted ? "您已同意当前版本（v" + _0x5ded08.agreement.version + "），本次默认勾选" : "首次上传或协议更新后，需要重新阅读并勾选（v" + _0x5ded08.agreement.version + "）";
  _0x5a2f15.style.color = _0x5ded08.agreement.accepted ? "var(--green-600)" : "var(--amber-600)";
}
async function acceptCreatorAgreement() {
  if (creatorAgreementState && creatorAgreementState.accepted) {
    return true;
  }
  if (!creatorAgreementState) {
    await loadCreatorAgreementStatus();
  }
  if (!creatorAgreementState) {
    return false;
  }
  const _0x2ebaa2 = await apiFetch("/api/creator-agreement/accept", {
    method: "POST",
    body: JSON.stringify({
      version: creatorAgreementState.version,
      sha256: creatorAgreementState.sha256
    })
  });
  if (!_0x2ebaa2.success || !_0x2ebaa2.agreement) {
    if (_0x2ebaa2.agreement) {
      creatorAgreementState = _0x2ebaa2.agreement;
    }
    return false;
  }
  creatorAgreementState = _0x2ebaa2.agreement;
  return true;
}
function genCoverForUpload(_0x466d23) {
  var _0x2de152 = "";
  try {
    _0x2de152 = sessionStorage.getItem("tuxiaoling_upload_html") || "";
  } catch (_0x3b6b23) {}
  if (!_0x2de152) {
    genFallbackCover(_0x466d23);
    return;
  }
  if (!window.html2canvas) {
    var _0x46c247 = document.createElement("script");
    _0x46c247.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    _0x46c247.onload = function () {
      renderCoverFromHtml(_0x466d23, _0x2de152);
    };
    _0x46c247.onerror = function () {
      genFallbackCover(_0x466d23);
    };
    document.head.appendChild(_0x46c247);
  } else {
    renderCoverFromHtml(_0x466d23, _0x2de152);
  }
}
function renderCoverFromHtml(_0x3d0855, _0x20f685) {
  try {
    var _0xc22b69 = document.createElement("div");
    _0xc22b69.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;height:500px;overflow:hidden;z-index:-1;pointer-events:none";
    var _0x8e9ade = document.createElement("iframe");
    _0x8e9ade.style.cssText = "width:800px;height:500px;border:none";
    _0xc22b69.appendChild(_0x8e9ade);
    document.body.appendChild(_0xc22b69);
    _0x8e9ade.srcdoc = _0x20f685;
    _0x8e9ade.onload = function () {
      setTimeout(function () {
        try {
          html2canvas(_0x8e9ade.contentDocument.body, {
            width: 800,
            height: 500,
            scale: 0.5,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff"
          }).then(function (_0x26dc1f) {
            _0x26dc1f.toBlob(function (_0x12959a) {
              _0xc22b69.remove();
              if (!_0x12959a) {
                genFallbackCover(_0x3d0855);
                return;
              }
              var _0x126c16 = new File([_0x12959a], "cover_" + Date.now() + ".png", {
                type: "image/png"
              });
              var _0x5beda7 = new DataTransfer();
              _0x5beda7.items.add(_0x126c16);
              var _0x478f82 = document.getElementById("cover-input");
              if (_0x478f82) {
                _0x478f82.files = _0x5beda7.files;
                var _0x15cc3f = document.getElementById("cover-name-display");
                if (_0x15cc3f) {
                  _0x15cc3f.textContent = "✅ 已从页面生成封面 (" + _0x3d0855.slice(0, 12) + "...) ";
                }
              }
            }, "image/png", 0.85);
          }).catch(function () {
            _0xc22b69.remove();
            genFallbackCover(_0x3d0855);
          });
        } catch (_0x105af4) {
          _0xc22b69.remove();
          genFallbackCover(_0x3d0855);
        }
      }, 1500);
    };
    _0x8e9ade.onerror = function () {
      _0xc22b69.remove();
      genFallbackCover(_0x3d0855);
    };
  } catch (_0x413dd7) {
    genFallbackCover(_0x3d0855);
  }
}
function genFallbackCover(_0x2ae2c2) {
  try {
    var _0x25c376 = document.createElement("canvas");
    _0x25c376.width = 800;
    _0x25c376.height = 500;
    var _0x43e4f1 = _0x25c376.getContext("2d");
    var _0x49b80e = _0x43e4f1.createLinearGradient(0, 0, 800, 500);
    _0x49b80e.addColorStop(0, "#667eea");
    _0x49b80e.addColorStop(1, "#764ba2");
    _0x43e4f1.fillStyle = _0x49b80e;
    _0x43e4f1.fillRect(0, 0, 800, 500);
    _0x43e4f1.fillStyle = "#fff";
    _0x43e4f1.font = "bold 28px sans-serif";
    _0x43e4f1.textAlign = "center";
    _0x43e4f1.textBaseline = "middle";
    var _0x180d6d = _0x2ae2c2;
    if (_0x180d6d.length > 18) {
      _0x180d6d = _0x180d6d.slice(0, 16) + "...";
    }
    _0x43e4f1.fillText(_0x180d6d, 400, 240);
    _0x43e4f1.font = "16px sans-serif";
    _0x43e4f1.fillStyle = "rgba(255,255,255,0.7)";
    _0x43e4f1.fillText("图灵智赋 · AI 生成", 400, 310);
    _0x25c376.toBlob(function (_0x14500f) {
      if (!_0x14500f) {
        return;
      }
      var _0x57b209 = new File([_0x14500f], "cover_" + Date.now() + ".png", {
        type: "image/png"
      });
      var _0x2fabcf = new DataTransfer();
      _0x2fabcf.items.add(_0x57b209);
      var _0x41369d = document.getElementById("cover-input");
      if (_0x41369d) {
        _0x41369d.files = _0x2fabcf.files;
        var _0x4cdbe2 = document.getElementById("cover-name-display");
        if (_0x4cdbe2) {
          _0x4cdbe2.textContent = "✅ 已自动生成封面 (渐变) ";
        }
      }
    }, "image/png", 0.9);
  } catch (_0x3fb21f) {}
}
async function autoGenerateDesc() {
  try {
    var _0x2b1f83 = sessionStorage.getItem("tuxiaoling_upload_html") || "";
    if (!_0x2b1f83) {
      return;
    }
    var _0x62c8ee = document.getElementById("upload-desc");
    if (!_0x62c8ee) {
      return;
    }
    if (_0x62c8ee.innerText.trim().length > 20) {
      return;
    }
    _0x62c8ee.innerHTML = "<p style=\"color:#999\">⏳ AI 正在生成介绍...</p>";
    var _0x19b1fe = await fetch(API_BASE + "/api/programs/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        html: _0x2b1f83.slice(0, 30000)
      })
    });
    var _0x274551 = await _0x19b1fe.json();
    if (_0x274551.success && _0x274551.summary) {
      _0x62c8ee.innerHTML = "<p>" + _0x274551.summary.replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>";
    } else {
      _0x62c8ee.innerHTML = "";
    }
  } catch (_0x12c31d) {}
}
const UPLOAD_TYPE_CONFIG = {
  program: {
    icon: "+",
    accept: ".html,.htm,.zip",
    hint: "支持 .html 或 .zip 项目包（含JS/GLB/JSON等依赖），不超过 500MB",
    maxSize: 500
  },
  courseware: {
    icon: "+",
    accept: ".ppt,.pptx,.key,.pdf",
    hint: "支持 PPT/PPTX/KEY/PDF 格式，不超过 100MB",
    maxSize: 100
  },
  video: {
    icon: "+",
    accept: ".mp4,.mov,.avi,.mkv",
    hint: "支持 MP4/MOV/AVI 格式，不超过 500MB",
    maxSize: 500
  },
  document: {
    icon: "+",
    accept: ".pdf,.doc,.docx,.txt",
    hint: "支持 PDF/Word/TXT 格式，不超过 50MB",
    maxSize: 50
  },
  image: {
    icon: "+",
    accept: ".jpg,.jpeg,.png,.svg,.webp",
    hint: "支持 JPG/PNG/SVG/WebP 格式，不超过 20MB",
    maxSize: 20
  },
  audio: {
    icon: "+",
    accept: ".mp3,.wav,.aac,.flac",
    hint: "支持 MP3/WAV/AAC/FLAC 格式，不超过 100MB",
    maxSize: 100
  }
};
function switchUploadType(_0x175ee8, _0x289ef7) {
  $$(".upload-type-btn").forEach(_0x2864e6 => _0x2864e6.classList.remove("active"));
  _0x175ee8.classList.add("active");
  currentUploadType = _0x289ef7;
  uploadedFile = null;
  const _0x2bdf32 = document.getElementById("upload-section-file");
  const _0x30602c = document.getElementById("upload-section-external");
  if (_0x289ef7 === "external") {
    if (_0x2bdf32) {
      _0x2bdf32.style.display = "none";
    }
    if (_0x30602c) {
      _0x30602c.style.display = "";
    }
    return;
  }
  if (_0x2bdf32) {
    _0x2bdf32.style.display = "";
  }
  if (_0x30602c) {
    _0x30602c.style.display = "none";
  }
  const _0xb85e04 = UPLOAD_TYPE_CONFIG[_0x289ef7];
  if (!_0xb85e04) {
    return;
  }
  const _0x572fa5 = $("#upload-icon");
  const _0x50d0bb = $("#upload-hint");
  const _0x3dac1a = $("#file-name-display");
  const _0x5e7347 = $("#file-input");
  if (_0x572fa5) {
    _0x572fa5.textContent = _0xb85e04.icon;
  }
  if (_0x50d0bb) {
    _0x50d0bb.textContent = _0xb85e04.hint;
  }
  if (_0x3dac1a) {
    _0x3dac1a.textContent = "点击选择或拖拽文件到此处";
  }
  if (_0x5e7347) {
    _0x5e7347.setAttribute("accept", _0xb85e04.accept);
  }
}
function handleFileSelect(_0x4d56d6) {
  if (_0x4d56d6.files[0]) {
    const _0x50b72b = UPLOAD_TYPE_CONFIG[currentUploadType];
    const _0x47066a = _0x4d56d6.files[0];
    const _0x5f4e02 = _0x47066a.size / 1048576;
    if (_0x5f4e02 > _0x50b72b.maxSize) {
      toast("文件大小不能超过 " + _0x50b72b.maxSize + "MB", "error");
      return;
    }
    uploadedFile = _0x47066a;
    $("#file-name-display").textContent = "✅ 已选择: " + uploadedFile.name + " (" + _0x5f4e02.toFixed(1) + "MB)";
    var _0x1f94ce = document.getElementById("upload-icon");
    if (_0x1f94ce) {
      _0x1f94ce.textContent = "✅";
      _0x1f94ce.style.color = "#22c55e";
    }
    toast("文件已选择", "success");
  }
}
function handleFileDrop(_0x454e2f) {
  const _0xb82df9 = _0x454e2f.dataTransfer.files[0];
  if (_0xb82df9) {
    const _0x2e3681 = UPLOAD_TYPE_CONFIG[currentUploadType];
    const _0x57cf92 = _0x2e3681.accept.split(",");
    const _0x3f2463 = "." + _0xb82df9.name.split(".").pop().toLowerCase();
    if (!_0x57cf92.includes(_0x3f2463)) {
      toast("不支持此文件格式，请上传: " + _0x2e3681.accept, "error");
      return;
    }
    const _0x126c70 = _0xb82df9.size / 1048576;
    if (_0x126c70 > _0x2e3681.maxSize) {
      toast("文件大小不能超过 " + _0x2e3681.maxSize + "MB", "error");
      return;
    }
    uploadedFile = _0xb82df9;
    $("#file-name-display").textContent = "✅ 已选择: " + _0xb82df9.name + " (" + _0x126c70.toFixed(1) + "MB)";
    var _0x46dc28 = document.getElementById("upload-icon");
    if (_0x46dc28) {
      _0x46dc28.textContent = "✅";
      _0x46dc28.style.color = "#22c55e";
    }
    toast("文件已选择", "success");
  }
}
function handleCoverSelect(_0x480a95) {
  if (_0x480a95.files[0]) {
    $("#cover-name-display").textContent = "已选择: " + _0x480a95.files[0].name;
    var _0x40119b = document.getElementById("cover-icon");
    if (_0x40119b) {
      _0x40119b.textContent = "✅";
      _0x40119b.style.color = "#22c55e";
    }
    var _0x3c5ec9 = new FileReader();
    _0x3c5ec9.onload = function (_0xd2a1e1) {
      var _0x16658b = document.getElementById("cover-preview");
      if (_0x16658b) {
        _0x16658b.src = _0xd2a1e1.target.result;
        _0x16658b.style.display = "block";
      }
      var _0x1512e7 = document.getElementById("cover-placeholder");
      if (_0x1512e7) {
        _0x1512e7.style.display = "none";
      }
    };
    _0x3c5ec9.readAsDataURL(_0x480a95.files[0]);
  }
}
function handleAttachSelect(_0x5905ef) {
  if (_0x5905ef.files[0]) {
    const _0x229851 = (_0x5905ef.files[0].size / 1048576).toFixed(1);
    $("#attach-name-display").textContent = "已选择: " + _0x5905ef.files[0].name + " (" + _0x229851 + "MB)";
    var _0x224993 = document.getElementById("attach-icon");
    if (_0x224993) {
      _0x224993.textContent = "✅";
      _0x224993.style.color = "#22c55e";
    }
    toast("附件已选择", "success");
  }
}
function insertEditorImage() {
  const _0x3753cb = prompt("请输入图片URL（或粘贴图片链接）:");
  if (_0x3753cb) {
    document.execCommand("insertImage", false, _0x3753cb);
  }
}
function selectPricing(_0x5ae8ad, _0x9ba88c) {
  $$(".pricing-option").forEach(_0x326e76 => _0x326e76.classList.remove("active"));
  _0x5ae8ad.classList.add("active");
  $("#price-input-area").style.display = _0x9ba88c === "paid" ? "block" : "none";
}
let uploadedDescImages = [];
let uploadedProgramVideo = null;
function handleProgramVideoSelect(_0xf69004) {
  const _0x1d63c2 = _0xf69004 && _0xf69004.files && _0xf69004.files[0];
  if (!_0x1d63c2) {
    return;
  }
  const _0x5870c8 = /\.(mp4|mov)$/i.test(_0x1d63c2.name || "");
  if (!_0x5870c8) {
    toast("演示视频仅支持 MP4 或 MOV", "error");
    _0xf69004.value = "";
    uploadedProgramVideo = null;
    return;
  }
  const _0x75bc91 = 209715200;
  if (_0x1d63c2.size > _0x75bc91) {
    toast("普通作者演示视频不能超过 200MB", "error");
    _0xf69004.value = "";
    uploadedProgramVideo = null;
    return;
  }
  uploadedProgramVideo = _0x1d63c2;
  const _0x9e636e = (_0x1d63c2.size / 1048576).toFixed(1);
  const _0x20de59 = document.getElementById("program-video-name-display");
  if (_0x20de59) {
    _0x20de59.textContent = "已选择: " + _0x1d63c2.name + " (" + _0x9e636e + "MB)";
  }
  const _0x512c1b = document.getElementById("program-video-icon");
  if (_0x512c1b) {
    _0x512c1b.textContent = "✓";
    _0x512c1b.style.color = "#22c55e";
  }
  toast("演示视频已选择，提交作品后会进入审核", "success");
}
async function submitProgramVideo(_0x256789, _0x574190) {
  if (!_0x256789 || !_0x574190) {
    return {
      success: true,
      skipped: true
    };
  }
  const _0x8e6558 = new FormData();
  _0x8e6558.append("video", _0x574190);
  const _0x5eedc0 = await fetch(API_BASE + "/api/programs/" + encodeURIComponent(_0x256789) + "/video-submission", {
    method: "POST",
    headers: State.token ? {
      Authorization: "Bearer " + State.token
    } : {},
    body: _0x8e6558
  });
  return await _0x5eedc0.json();
}
function handleDescImagesSelect(_0x4ac262) {
  const _0x4d1d4f = Array.from(_0x4ac262.files);
  for (const _0x319508 of _0x4d1d4f) {
    if (uploadedDescImages.length >= 5) {
      toast("最多只能上传5张图哦", "error");
      break;
    }
    uploadedDescImages.push(_0x319508);
  }
  renderDescImagesPreview();
  _0x4ac262.value = "";
}
function renderDescImagesPreview() {
  const _0x19151e = document.getElementById("desc-images-icon");
  if (_0x19151e) {
    _0x19151e.textContent = "✅";
    _0x19151e.style.color = "#22c55e";
  }
  document.getElementById("desc-images-display").textContent = uploadedDescImages.length > 0 ? "✅ 已选择 " + uploadedDescImages.length + "/5 张图片" : "点击选择多张图片";
  const _0x5ea775 = document.getElementById("desc-images-preview");
  _0x5ea775.innerHTML = "";
  uploadedDescImages.forEach((_0x4eb23a, _0x2c3418) => {
    const _0x4f0e46 = new FileReader();
    _0x4f0e46.onload = _0x5a75b1 => {
      _0x5ea775.innerHTML += "<div style=\"position:relative;display:inline-block\">" + ("<img src=\"" + _0x5a75b1.target.result + "\" style=\"width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--gray-200);box-shadow:var(--shadow-sm)\">") + ("<span onclick=\"removeDescImage(" + _0x2c3418 + ")\" style=\"position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#ef4444;color:#fff;border-radius:50%;font-size:12px;text-align:center;line-height:20px;cursor:pointer\">✕</span>") + "</div>";
    };
    _0x4f0e46.readAsDataURL(_0x4eb23a);
  });
  if (uploadedDescImages.length < 5) {
    _0x5ea775.innerHTML += "<div onclick=\"document.getElementById('desc-images-input').click()\" style=\"width:80px;height:80px;border:2px dashed var(--gray-300);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gray-400);font-size:28px;font-weight:200\">+</div>";
  }
}
function removeDescImage(_0x578d2c) {
  uploadedDescImages.splice(_0x578d2c, 1);
  renderDescImagesPreview();
}
function updateGradeLevelOptions(_0x31dafe) {
  const _0x4a5fcd = document.getElementById(_0x31dafe + "-grade");
  const _0x8b93a5 = document.getElementById(_0x31dafe + "-grade-level");
  if (!_0x4a5fcd || !_0x8b93a5) {
    return;
  }
  const _0x2b3ba8 = _0x4a5fcd.value;
  const _0x36180b = GRADE_LEVELS[_0x2b3ba8] || [];
  _0x8b93a5.innerHTML = "<option value=\"\">不限</option>" + _0x36180b.map(_0x4295cc => "<option value=\"" + _0x4295cc + "\">" + _0x4295cc + "</option>").join("");
}
let uploadSubmitInProgress = false;
async function readUploadResponse(_0x2e9342) {
  const _0x5ed568 = new Error("UPLOAD_RESPONSE_UNCONFIRMED");
  _0x5ed568.uploadStatus = _0x2e9342.status;
  if ([408, 504, 413].includes(_0x2e9342.status)) {
    throw _0x5ed568;
  }
  let _0x205486;
  try {
    _0x205486 = await _0x2e9342.json();
  } catch (_0x1e5185) {
    throw _0x5ed568;
  }
  if (!_0x205486 || typeof _0x205486.success !== "boolean" || !_0x2e9342.ok && _0x205486.success || !_0x205486.success && (typeof _0x205486.msg !== "string" || !_0x205486.msg.trim())) {
    throw _0x5ed568;
  }
  return _0x205486;
}
function uploadFailureMessage(_0x4c126e) {
  const _0x1ae107 = _0x4c126e && _0x4c126e.uploadStatus;
  if (_0x1ae107 === 408 || _0x1ae107 === 504) {
    return "上传等待超时，结果尚未确认。请先到作品列表查看，确认未保存后再重试。";
  }
  if (_0x1ae107 === 413) {
    return "上传文件或请求体超过大小限制，请缩小文件后重试。";
  }
  return "网络或服务响应异常，上传结果尚未确认。请先到作品列表查看，确认未保存后再重试。";
}
async function submitUpload() {
  if (uploadSubmitInProgress) {
    toast("作品正在上传处理中，请勿重复提交", "info");
    return;
  }
  uploadSubmitInProgress = true;
  const _0x15c6d8 = document.getElementById("upload-submit-button");
  const _0x5c028e = _0x15c6d8 ? _0x15c6d8.innerHTML : "";
  if (_0x15c6d8) {
    _0x15c6d8.disabled = true;
    _0x15c6d8.textContent = "上传处理中，请稍候…";
  }
  try {
    if (!State.user) {
      showAuthModal();
      return;
    }
    const _0x383628 = document.getElementById("creator-agreement-checkbox");
    if (!_0x383628 || _0x383628.disabled || !_0x383628.checked) {
      toast("请先阅读并勾选《创作者服务协议》", "error");
      return;
    }
    if (!(await acceptCreatorAgreement())) {
      toast("协议确认失败或协议已更新，请重新阅读并勾选", "error");
      await loadCreatorAgreementStatus();
      return;
    }
    const _0x41175c = document.getElementById("upload-title")?.value;
    const _0x504e7e = document.getElementById("upload-desc");
    const _0x20946c = _0x504e7e?.innerHTML || _0x504e7e?.value || "";
    if (!_0x41175c) {
      toast("请填写作品标题", "error");
      return;
    }
    const _0xe6e99b = currentUploadType === "external";
    let _0x1f5581 = "";
    if (_0xe6e99b) {
      _0x1f5581 = (document.getElementById("upload-external-url")?.value || "").trim();
      if (!_0x1f5581) {
        toast("请填写网页 URL", "error");
        return;
      }
      if (!/^https:\/\//i.test(_0x1f5581)) {
        toast("仅支持 https:// 链接", "error");
        return;
      }
    } else {
      try {
        var _0x4f7ffe = sessionStorage.getItem("tuxiaoling_upload_html") || "";
        if (!uploadedFile && _0x4f7ffe) {
          uploadedFile = new File([_0x4f7ffe], _0x41175c + ".html", {
            type: "text/html"
          });
        }
      } catch (_0x585f0e) {}
      if (!uploadedFile) {
        toast("请必须上传核心 HTML 文件", "error");
        return;
      }
    }
    toast("正在打包上传，请稍候...", "info");
    const _0x2463ff = new FormData();
    _0x2463ff.append("title", _0x41175c);
    _0x2463ff.append("desc", _0x20946c);
    _0x2463ff.append("subject", document.getElementById("upload-subject")?.value || "通用");
    _0x2463ff.append("grade", document.getElementById("upload-grade")?.value || "通用");
    _0x2463ff.append("grade_level", document.getElementById("upload-grade-level")?.value || "");
    _0x2463ff.append("type", document.getElementById("upload-type")?.value || "通用");
    _0x2463ff.append("price", parseFloat(document.getElementById("upload-price")?.value || 0));
    const _0x4c2b59 = document.getElementById("upload-author-alias")?.value || State.user.name;
    _0x2463ff.append("author", _0x4c2b59);
    _0x2463ff.append("isAdmin", State.user.role === "admin" || State.user.role === "moderator");
    _0x2463ff.append("runtime_mode", document.getElementById("upload-runtime-camera")?.checked ? "camera" : "default");
    if (_0xe6e99b) {
      _0x2463ff.append("source_kind", "external");
      _0x2463ff.append("external_url", _0x1f5581);
    } else {
      _0x2463ff.append("file", uploadedFile);
    }
    const _0x367dbf = document.getElementById("cover-input");
    if (!_0x367dbf || !_0x367dbf.files[0]) {
      toast("请必须上传一张封面图片", "error");
      return;
    }
    _0x2463ff.append("cover", _0x367dbf.files[0]);
    uploadedDescImages.forEach(_0x582922 => {
      _0x2463ff.append("desc_images", _0x582922);
    });
    const _0x3d479d = document.getElementById("attach-input");
    if (!_0xe6e99b && _0x3d479d && _0x3d479d.files[0]) {
      _0x2463ff.append("attachment", _0x3d479d.files[0]);
    }
    let _0x187e22 = false;
    try {
      const _0x543585 = await fetch(API_BASE + "/api/programs/upload", {
        method: "POST",
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {},
        body: _0x2463ff
      });
      const _0x1ffef4 = await readUploadResponse(_0x543585);
      if (_0x1ffef4.success) {
        _0x187e22 = true;
        if (uploadedProgramVideo && _0x1ffef4.id) {
          const _0x50fede = await submitProgramVideo(_0x1ffef4.id, uploadedProgramVideo);
          if (!_0x50fede.success) {
            toast("作品已提交，但演示视频提交失败: " + (_0x50fede.msg || "请稍后在编辑页重试"), "error");
          } else {
            toast("演示视频已提交审核", "success");
          }
        }
        toast(_0x1ffef4.msg, "success");
        showUploadWarnings(_0x1ffef4.warnings);
        uploadedFile = null;
        uploadedProgramVideo = null;
        uploadedDescImages = [];
        try {
          sessionStorage.removeItem("tuxiaoling_upload_html");
          sessionStorage.removeItem("tuxiaoling_upload_title");
          sessionStorage.removeItem("tuxiaoling_upload_desc");
        } catch (_0x152646) {}
        try {
          await loadProgramsFromDatabase({
            throwOnError: true
          });
        } catch (_0x44b2e8) {
          toast("作品已保存，但作品列表刷新失败，请稍后刷新作品列表查看。", "error");
          return;
        }
        setTimeout(() => navigate("dashboard"), 1500);
      } else {
        toast("上传失败: " + _0x1ffef4.msg, "error");
      }
    } catch (_0x1d4125) {
      toast(_0x187e22 ? "作品已保存，但后续处理未完成，请到作品列表查看。" : uploadFailureMessage(_0x1d4125), "error");
    }
  } finally {
    uploadSubmitInProgress = false;
    if (_0x15c6d8) {
      _0x15c6d8.disabled = false;
      _0x15c6d8.innerHTML = _0x5c028e;
    }
  }
}
function renderDashboard() {
  if (!State.user) {
    return document.createElement("div");
  }
  const _0x2b3ecc = State.user.name && State.user.name !== "null" ? State.user.name : "教师用户";
  const _0x1842e4 = _0x2b3ecc.charAt(0) || "U";
  const _0x4599b0 = document.createElement("div");
  _0x4599b0.className = "dashboard-page";
  _0x4599b0.innerHTML = "\n    <div class=\"dashboard-header\">\n      <div class=\"dash-avatar\">" + _0x1842e4 + "</div>\n      <div>\n        <h2>" + _0x2b3ecc + "</h2>\n        <p><span data-account-membership>" + (State.membership ? "课件广场 VIP 会员" : "普通账号") + "</span> " + (State.user.role === "admin" ? " | 🛡️ 平台超管" : State.user.role === "moderator" ? " | 🛡️ 管理员" : "") + "</p>\n      </div>\n    </div>\n    " + (premiumCatalogueEnabled ? "<section data-premium-account aria-label=\"我的精品课会员\"></section>" : "") + "\n    <div class=\"dash-tabs\">\n      <button class=\"dash-tab active\" onclick=\"switchDashTab(this,'purchased')\">🛒 我的购买</button>\n      <button class=\"dash-tab\" onclick=\"switchDashTab(this,'orders')\">📋 我的订单</button>\n      <button class=\"dash-tab\" onclick=\"switchDashTab(this,'uploaded')\">🏪 我的店铺(作品)</button>\n      <button class=\"dash-tab\" onclick=\"switchDashTab(this,'rewards')\">🎁 福利与邀请</button>\n      <button class=\"dash-tab\" onclick=\"switchDashTab(this,'earnings')\">💰 我的收益</button>\n      <button class=\"dash-tab\" onclick=\"switchDashTab(this,'feedback')\">💬 反馈建议</button>\n    </div>\n    <div id=\"dash-content\"></div>";
  if (premiumCatalogueEnabled) {
    import("/premium-catalogue/account.mjs").then(_0x3e8ab8 => {
      if (_0x4599b0.isConnected) {
        _0x3e8ab8.mountAccount(_0x4599b0.querySelector("[data-premium-account]"), {
          token: State.token,
          onBrowse: () => navigate("premium"),
          onSummary: _0x26c6d3 => {
            const _0x5aa1fa = _0x4599b0.querySelector("[data-account-membership]");
            if (_0x5aa1fa) {
              _0x5aa1fa.textContent = [State.membership ? "课件广场 VIP 会员" : "", _0x26c6d3 ? "精品课会员" : ""].filter(Boolean).join(" · ") || "普通账号";
            }
          }
        });
      }
    }).catch(() => {
      const _0x27bb4f = _0x4599b0.querySelector("[data-premium-account]");
      if (_0x27bb4f) {
        _0x27bb4f.textContent = "精品会员信息暂时无法读取，请刷新重试。";
      }
    });
  }
  setTimeout(() => switchDashTab(_0x4599b0.querySelector(".dash-tab"), "purchased"), 0);
  return _0x4599b0;
}
function switchDashTab(_0x27bb59, _0x553c7c) {
  if (_0x27bb59) {
    $$(".dash-tab").forEach(_0xb04613 => _0xb04613.classList.remove("active"));
    _0x27bb59.classList.add("active");
  }
  const _0x2698f9 = $("#dash-content");
  if (!_0x2698f9) {
    return;
  }
  switch (_0x553c7c) {
    case "orders":
      {
        const _0x23cba0 = document.createElement("section");
        _0x2698f9.replaceChildren(_0x23cba0);
        import("/invoices/index.mjs").then(_0x4175a3 => {
          if (_0x23cba0.isConnected) {
            _0x4175a3.mountOrders(_0x23cba0, {
              token: State.token
            });
          }
        }).catch(() => {
          _0x23cba0.textContent = "订单暂时无法载入，请刷新重试。";
        });
        break;
      }
    case "purchased":
      const _0x21fe68 = PROGRAMS.filter(_0x4b4047 => hasPurchased(_0x4b4047.id));
      _0x2698f9.innerHTML = "<div class=\"dash-grid\">" + (_0x21fe68.length > 0 ? _0x21fe68.map(_0x7b7233 => "\n        <div class=\"program-card\" onclick=\"openViewer(" + _0x7b7233.id + ")\">\n          <div class=\"card-cover\" data-gradient=\"" + getGradient(_0x7b7233.subject) + "\">\n            " + (_0x7b7233.cover_url ? "<img src=\"" + (API_BASE + _0x7b7233.cover_url) + "\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;\">" : "<div class=\"card-cover-placeholder\">" + _0x7b7233.emoji + "</div>") + "\n            <div class=\"card-price-tag free-price\">已解锁 ✓</div>\n          </div>\n          <div class=\"card-body\"><div class=\"card-title\">" + _0x7b7233.title + "</div><div class=\"card-desc\">" + _0x7b7233.desc + "</div></div>\n        </div>").join("") : "<div class=\"dash-empty\"><div class=\"dash-empty-icon\">📦</div><p>暂无已购买或解锁的程序</p><button class=\"btn btn-primary\" style=\"margin-top:16px\" onclick=\"navigate('browse')\">去探索</button></div>") + "</div>";
      break;
    case "uploaded":
      _0x2698f9.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载我的作品...</div>";
      loadMyPrograms().then(_0xa3bdd5 => {
        _0xa3bdd5 = _0xa3bdd5.filter(function (_0x9ca1c3) {
          return _0x9ca1c3.status !== 4;
        });
        const _0x304c26 = {
          0: "⏳ 待审核",
          1: "✅ 已上架",
          2: "⬇️ 已下架",
          3: "❌ 已驳回",
          5: "📝 草稿"
        };
        _0x2698f9.innerHTML = "\n          <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;\">\n            <h3 style=\"font-size:16px;color:var(--gray-800)\">🏪 我的店铺 (作品管理)</h3>\n            <button class=\"btn btn-primary btn-sm\" onclick=\"navigate('upload')\">➕ 发布新作品</button>\n          </div>\n          " + (_0xa3bdd5.length > 0 ? "\n          <table style=\"width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:var(--shadow-sm)\">\n            <tr style=\"background:var(--gray-50);border-bottom:1px solid var(--gray-200)\">\n              <th style=\"padding:12px;text-align:left\">作品信息</th>\n              <th style=\"padding:12px;text-align:left\">状态</th>\n              <th style=\"padding:12px;text-align:left\">售价(元)</th>\n              <th style=\"padding:12px;text-align:center\">操作</th>\n            </tr>\n            " + _0xa3bdd5.map(_0x5322a8 => {
          const _0x4b618d = typeof _0x5322a8.status === "number" ? _0x5322a8.status : 0;
          const _0x2493dc = _0x304c26[_0x4b618d] || _0x304c26[0];
          const _0x36147a = _0x4b618d === 1 ? "var(--green-600)" : _0x4b618d === 2 ? "var(--amber-600)" : _0x4b618d === 3 ? "var(--red-500)" : "var(--gray-500)";
          return "\n              <tr style=\"border-bottom:1px solid var(--gray-100)\">\n                <td style=\"padding:12px\">\n                  <div style=\"font-weight:700\">" + (_0x5322a8.emoji || "📦") + " " + _0x5322a8.title + "</div>\n                  <div style=\"font-size:11px;color:var(--gray-400)\">使用 " + (_0x5322a8.uses || 0) + " 次</div>\n                </td>\n                <td style=\"padding:12px\">\n                  <span style=\"color:" + _0x36147a + ";font-weight:600;font-size:12px\">" + _0x2493dc + "</span>\n                  " + (_0x5322a8.admin_feedback ? "<div style=\"font-size:11px;color:var(--red-500);margin-top:4px;max-width:200px;line-height:1.4\">📝 管理员: " + _0x5322a8.admin_feedback + "</div>" : "") + "\n                </td>\n                <td style=\"padding:12px\">\n                  <input type=\"number\" id=\"user-price-" + _0x5322a8.id + "\" value=\"" + _0x5322a8.price + "\" step=\"0.1\" style=\"width:65px;padding:4px;border:1px solid #ddd;border-radius:4px\">\n                </td>\n                <td style=\"padding:12px;text-align:center;white-space:nowrap\">\n                  <button class=\"btn btn-sm btn-blue\" onclick=\"openViewer(" + _0x5322a8.id + ")\" style=\"margin:2px;background:var(--blue-500);color:#fff;border:none\">使用</button>\n                  " + (_0x4b618d !== 1 ? "<button class=\"btn btn-sm btn-outline\" onclick=\"openEditProgram(" + _0x5322a8.id + ")\" style=\"margin:2px\">编辑</button>" : "") + "\n                  <button class=\"btn btn-sm btn-primary\" onclick=\"userUpdateOwnProgram(" + _0x5322a8.id + ")\" style=\"margin:2px\">改价</button>\n                  " + (_0x4b618d === 1 ? "<button class=\"btn btn-sm btn-outline\" onclick=\"userDelistProgram(" + _0x5322a8.id + ")\" style=\"margin:2px\">下架</button>" : "") + "\n                  " + (_0x4b618d === 0 || _0x4b618d === 2 || _0x4b618d === 3 || _0x4b618d === 5 ? "<button class=\"btn btn-sm btn-green\" onclick=\"userResubmitProgram(" + _0x5322a8.id + ")\" style=\"margin:2px\">重新提交</button>" : "") + "\n                  " + (_0x4b618d === 0 ? "<button class=\"btn btn-sm btn-outline\" onclick=\"userCancelReview(" + _0x5322a8.id + ")\" style=\"margin:2px;color:var(--gray-500);border-color:var(--gray-400)\">↩ 取消审核</button>" : "") + "\n                  " + (_0x4b618d === 2 || _0x4b618d === 3 || _0x4b618d === 5 ? "<button class=\"btn btn-sm btn-danger\" onclick=\"userDeleteProgram(" + _0x5322a8.id + ")\" style=\"margin:2px;background:var(--red-500);color:#fff;border:none\">删除</button>" : "") + "\n                </td>\n              </tr>";
        }).join("") + "\n          </table>" : "\n          <div class=\"dash-empty\" style=\"background:#fff;border-radius:12px;padding:48px\">\n            <div class=\"dash-empty-icon\" style=\"font-size:40px\">🏪</div>\n            <p>您的店铺还是空的，快去上传作品赚钱吧！</p>\n          </div>") + "\n        ";
      });
      break;
    case "rewards":
      _0x2698f9.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">正在加载动态数据...</div>";
      Promise.all([apiFetch("/api/user/stats"), apiFetch("/api/auth/invite-code")]).then(([_0x11e097, _0x488d23]) => {
        const _0x206f70 = _0x11e097.invites || 0;
        const _0x3b47a7 = _0x11e097.uploads || 0;
        const _0x4a4dd8 = _0x206f70 * 3;
        window.fallbackCopy = function (_0x5c0cc5) {
          let _0x1f658d = document.createElement("textarea");
          _0x1f658d.value = _0x5c0cc5;
          _0x1f658d.style.position = "fixed";
          _0x1f658d.style.left = "-9999px";
          document.body.appendChild(_0x1f658d);
          _0x1f658d.focus();
          _0x1f658d.select();
          try {
            document.execCommand("copy");
            toast("邀请链接已成功复制！", "success");
          } catch (_0x29ea97) {
            toast("请手动框选输入框中的链接并按 Ctrl+C", "error");
          }
          document.body.removeChild(_0x1f658d);
        };
        _0x2698f9.innerHTML = "\n            <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:20px;\">\n              <div style=\"background:#fff;border:1px solid var(--blue-200);border-radius:12px;padding:24px;\">\n                <h3 style=\"color:var(--blue-600);margin-bottom:12px\">🎁 邀请同行，送全站 VIP</h3>\n                <p style=\"font-size:13px;color:var(--gray-500);margin-bottom:16px\">每成功邀请 1 名新老师注册，您即可获得 3 天全站免费畅玩特权。</p>\n                <div style=\"background:var(--gray-50);padding:12px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px\">\n                  <input id=\"invite-link-input\" readonly value=\"" + window.location.origin + "/?invite=" + (_0x488d23.inviteCode || State.user.wechatId) + "\" style=\"border:none;background:transparent;font-size:13px;color:var(--gray-600);font-family:monospace;width:100%;outline:none;cursor:text;user-select:all;\" onclick=\"this.select()\">\n                  <button class=\"btn btn-sm btn-primary\" style=\"flex-shrink:0\" onclick=\"fallbackCopy(document.getElementById('invite-link-input').value)\">一键复制</button>\n                </div>\n                <div style=\"display:flex;justify-content:space-between;font-size:13px\">\n                  <span>已成功邀请: <strong style=\"font-size:18px;color:var(--blue-600)\">" + _0x206f70 + "</strong> 人</span>\n                  <span style=\"color:var(--amber-600)\">累计获得: <strong style=\"font-size:18px\">" + _0x4a4dd8 + "</strong> 天 VIP</span>\n                </div>\n              </div>\n              <div style=\"background:#fff;border:1px solid var(--green-200);border-radius:12px;padding:24px;\">\n                <h3 style=\"color:var(--green-600);margin-bottom:12px\">🤝 共创达人计划</h3>\n                <p style=\"font-size:13px;color:var(--gray-500);margin-bottom:16px\">在平台成功上架 3 个原创小工具，即赠送 3 个月 VIP 及官方认证称号。</p>\n                <div style=\"margin-bottom:8px;display:flex;justify-content:space-between;font-size:13px\">\n                  <span>当前上架作品：</span> <strong style=\"font-size:16px\">" + _0x3b47a7 + " / 3 个</strong>\n                </div>\n                <div style=\"width:100%;height:8px;background:var(--gray-100);border-radius:4px;overflow:hidden\">\n                  <div style=\"width:" + Math.min(_0x3b47a7 / 3 * 100, 100) + "%;height:100%;background:var(--green-500)\"></div>\n                </div>\n                <button class=\"btn btn-sm btn-green btn-block\" style=\"margin-top:20px\" onclick=\"navigate('upload')\">去发布新作品</button>\n              </div>\n            </div>";
      });
      break;
    case "earnings":
      _0x2698f9.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">正在加载收益数据...</div>";
      renderEarningsTab(_0x2698f9);
      break;
    case "feedback":
      _0x2698f9.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载中...</div>";
      renderUserFeedback(_0x2698f9);
      break;
  }
}
async function loadMyPrograms() {
  try {
    const _0x4d9bb2 = await fetch(API_BASE + "/api/programs?myOpenid=1", {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    const _0x2081c2 = await _0x4d9bb2.json();
    if (_0x2081c2.success) {
      return _0x2081c2.programs || [];
    } else {
      return [];
    }
  } catch (_0x4ad4f7) {
    return [];
  }
}
async function renderUserFeedback(_0x3566ad) {
  var _0x451619 = "<option value=\"\">-- 不关联作品 --</option>";
  PROGRAMS.forEach(function (_0x3f9fbc) {
    _0x451619 += "<option value=\"" + _0x3f9fbc.id + "\">" + _0x3f9fbc.title + "</option>";
  });
  var _0x1212e7 = "<div style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:24px;margin-bottom:20px\"><h3 style=\"font-size:16px;margin-bottom:16px;color:var(--gray-800)\">💬 提交新反馈</h3><div class=\"form-group\"><label class=\"form-label\">关联作品（可选）</label><select class=\"form-input\" id=\"feedback-program\">" + _0x451619 + "</select></div><div class=\"form-group\"><label class=\"form-label\">反馈内容 <span style=\"color:var(--red-500)\">*</span></label><textarea class=\"form-input\" id=\"feedback-content\" rows=\"4\" placeholder=\"请描述您的问题或建议...\" style=\"resize:vertical\"></textarea></div><button class=\"btn btn-primary\" onclick=\"submitUserFeedback()\">提交反馈</button></div>";
  _0x3566ad.innerHTML = _0x1212e7 + "<div id=\"feedback-list\" style=\"text-align:center;padding:20px;color:var(--gray-400)\">加载历史反馈...</div>";
  try {
    var _0x4de62f = await apiFetch("/api/feedback/my");
    var _0x4b4e55 = document.getElementById("feedback-list");
    if (!_0x4b4e55) {
      return;
    }
    var _0x15d659 = _0x4de62f.feedback || _0x4de62f.feedbacks || [];
    if (!_0x4de62f.success || _0x15d659.length === 0) {
      _0x4b4e55.innerHTML = "<div style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:32px;text-align:center;color:var(--gray-400)\"><div style=\"font-size:32px;margin-bottom:12px\">💬</div><p>暂无反馈记录</p></div>";
      return;
    }
    var _0x349c85 = "";
    _0x15d659.forEach(function (_0x3ae7e5) {
      var _0x4fef04 = _0x3ae7e5.program_title || (_0x3ae7e5.program_id ? "作品#" + _0x3ae7e5.program_id : "无关联");
      var _0x329418 = _0x3ae7e5.admin_reply ? "<div style=\"margin-top:10px;padding:10px;background:var(--blue-50);border-radius:8px;border-left:3px solid var(--blue-400)\"><div style=\"font-size:11px;color:var(--blue-600);font-weight:600;margin-bottom:4px\">管理员回复:</div><div style=\"font-size:13px;color:var(--gray-700)\">" + _0x3ae7e5.admin_reply + "</div></div>" : "<div style=\"margin-top:8px;font-size:12px;color:var(--gray-400)\">⏳ 等待回复中...</div>";
      _0x349c85 += "<div style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:20px;margin-bottom:12px\"><div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:8px\"><span style=\"font-size:12px;color:var(--blue-600);background:var(--blue-50);padding:2px 8px;border-radius:4px\">" + _0x4fef04 + "</span><span style=\"font-size:12px;color:var(--gray-400)\">" + (_0x3ae7e5.created_at || "") + "</span></div><div style=\"font-size:14px;color:var(--gray-700);line-height:1.6\">" + (_0x3ae7e5.content || "") + "</div>" + _0x329418 + "</div>";
    });
    _0x4b4e55.innerHTML = "<h3 style=\"font-size:16px;margin-bottom:16px;color:var(--gray-800)\">📋 我的反馈记录</h3>" + _0x349c85;
  } catch (_0x2b1a45) {
    var _0x146fd2 = document.getElementById("feedback-list");
    if (_0x146fd2) {
      _0x146fd2.innerHTML = "<div style=\"text-align:center;padding:20px;color:var(--gray-400)\">加载失败，请稍后重试</div>";
    }
  }
}
async function submitUserFeedback() {
  var _0x551eff = document.getElementById("feedback-content")?.value?.trim();
  var _0xc168dd = document.getElementById("feedback-program")?.value || null;
  if (!_0x551eff) {
    toast("请输入反馈内容", "error");
    return;
  }
  try {
    var _0x2dec66 = await apiFetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        programId: _0xc168dd ? parseInt(_0xc168dd) : null,
        content: _0x551eff
      })
    });
    if (_0x2dec66.success) {
      toast("反馈已提交，感谢您的建议！", "success");
      var _0x435544 = document.getElementById("feedback-content");
      if (_0x435544) {
        _0x435544.value = "";
      }
      var _0x39bdcd = document.getElementById("dash-content");
      if (_0x39bdcd) {
        renderUserFeedback(_0x39bdcd);
      }
    } else {
      toast(_0x2dec66.msg || "提交失败", "error");
    }
  } catch (_0x1d5b6e) {
    toast("网络错误", "error");
  }
}
function showFeedbackForm(_0x1ad402, _0x174408) {
  if (!State.user) {
    showAuthModal();
    return;
  }
  var _0x3e3ba5 = document.createElement("div");
  _0x3e3ba5.className = "modal-overlay";
  _0x3e3ba5.onclick = function (_0x2559c9) {
    if (_0x2559c9.target === _0x3e3ba5) {
      _0x3e3ba5.classList.remove("show");
      setTimeout(function () {
        _0x3e3ba5.remove();
      }, 300);
    }
  };
  _0x3e3ba5.innerHTML = "<div class=\"modal\" onclick=\"event.stopPropagation()\" style=\"max-width:500px;padding:32px\"><div class=\"modal-close\"><button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button></div><h2 style=\"font-family:var(--font-serif);font-size:20px;margin-bottom:8px\">💬 反馈问题</h2><p style=\"font-size:13px;color:var(--gray-500);margin-bottom:20px\">关于: " + (_0x174408 || "") + "</p><div class=\"form-group\"><label class=\"form-label\">反馈内容 <span style=\"color:var(--red-500)\">*</span></label><textarea class=\"form-input\" id=\"detail-feedback-content\" rows=\"5\" placeholder=\"请描述您遇到的问题或建议...\" style=\"resize:vertical\"></textarea></div><div style=\"display:flex;gap:12px;justify-content:flex-end\"><button class=\"btn btn-outline\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">取消</button><button class=\"btn btn-primary\" onclick=\"submitDetailFeedback(" + _0x1ad402 + ")\">提交反馈</button></div></div>";
  document.body.appendChild(_0x3e3ba5);
  requestAnimationFrame(function () {
    _0x3e3ba5.classList.add("show");
  });
}
async function submitDetailFeedback(_0x212d3f) {
  var _0x3dd522 = document.getElementById("detail-feedback-content")?.value?.trim();
  if (!_0x3dd522) {
    toast("请输入反馈内容", "error");
    return;
  }
  try {
    var _0x528fb0 = await apiFetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        programId: _0x212d3f,
        content: _0x3dd522
      })
    });
    if (_0x528fb0.success) {
      toast("反馈已提交，感谢！", "success");
      var _0x12f2e1 = document.querySelector(".modal-overlay");
      if (_0x12f2e1) {
        _0x12f2e1.classList.remove("show");
        setTimeout(function () {
          _0x12f2e1.remove();
        }, 300);
      }
    } else {
      toast(_0x528fb0.msg || "提交失败", "error");
    }
  } catch (_0x16298f) {
    toast("网络错误", "error");
  }
}
async function renderEarningsTab(_0xb57515) {
  try {
    const _0x4b4490 = await apiFetch("/api/creator/earnings");
    if (!_0x4b4490.success) {
      _0xb57515.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载失败</div>";
      return;
    }
    const _0x5ae5a4 = (_0x4b4490.total / 100).toFixed(2);
    const _0x27835d = (_0x4b4490.pending / 100).toFixed(2);
    const _0xaa68bc = (_0x4b4490.withdrawn / 100).toFixed(2);
    const _0x2c9456 = _0x4b4490.records || [];
    const _0x3ba71b = _0x4b4490.withdrawals || [];
    const _0x44be94 = !!_0x4b4490.monthlyWithdrawUsed;
    const _0xc2c9f6 = {
      pending: "<span style=\"color:var(--blue-600)\">可提现</span>",
      withdrawal_pending: "<span style=\"color:var(--amber-600)\">待打款</span>",
      withdrawn: "<span style=\"color:var(--green-600)\">已提现</span>"
    };
    const _0x213810 = {
      pending: "<span style=\"color:var(--amber-600)\">待打款</span>",
      completed: "<span style=\"color:var(--green-600)\">已完成</span>",
      rejected: "<span style=\"color:var(--red-500)\">已驳回</span>"
    };
    _0xb57515.innerHTML = "\n      <p id=\"creator-share-note\" style=\"padding:12px;background:var(--blue-50);border-radius:8px;font-size:13px\">正在读取当前分成比例…</p>\n      <div class=\"earnings-card\" style=\"background:linear-gradient(135deg, var(--amber-500), var(--amber-600))\">\n        <h3>累计总收益</h3>\n        <div class=\"earnings-amount\">&yen; " + _0x5ae5a4 + "</div>\n        <div style=\"display:flex;gap:24px;font-size:14px;opacity:.9\">\n          <span>可提现: &yen;" + _0x27835d + "</span>\n          <span>已提现: &yen;" + _0xaa68bc + "</span>\n        </div>\n        <button class=\"btn\" " + (_0x44be94 ? "disabled" : "") + "\n          style=\"background:rgba(255,255,255,.2);color:#fff;font-size:13px;border:none;margin-top:16px\"\n          onclick=\"requestWithdraw(" + _0x4b4490.pending + ", " + _0x44be94 + ")\">" + (_0x44be94 ? "本月已申请提现" : "申请提现") + "</button>\n        <p style=\"font-size:12px;opacity:.82;margin-top:8px\">无最低金额限制，每个自然月可申请一次，预计7个工作日内处理</p>\n      </div>\n      <div style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:24px\">\n        <h3 style=\"font-size:16px;margin-bottom:16px;color:var(--gray-800)\">收益明细</h3>\n        " + (_0x2c9456.length > 0 ? "<table style=\"width:100%;border-collapse:collapse;font-size:13px\">\n          <tr style=\"background:var(--gray-50)\">\n            <th style=\"padding:10px;text-align:left\">作品</th>\n            <th style=\"padding:10px;text-align:right\">收益(元)</th>\n            <th style=\"padding:10px;text-align:center\">状态</th>\n            <th style=\"padding:10px;text-align:right\">时间</th>\n          </tr>\n          " + _0x2c9456.map(_0x577909 => "<tr style=\"border-top:1px solid var(--gray-100)\">\n            <td style=\"padding:8px\">" + (_0x577909.program_title || "作品#" + _0x577909.program_id) + "</td>\n            <td style=\"padding:8px;text-align:right;font-weight:600;color:var(--amber-600)\">&yen;" + (_0x577909.amount / 100).toFixed(2) + "</td>\n            <td style=\"padding:8px;text-align:center\">" + (_0xc2c9f6[_0x577909.status] || htmlEscape(_0x577909.status || "")) + "</td>\n            <td style=\"padding:8px;text-align:right;color:var(--gray-400)\">" + (_0x577909.created_at || "") + "</td>\n          </tr>").join("") + "\n        </table>" : "<div style=\"text-align:center;padding:32px;color:var(--gray-400)\">\n          <div style=\"font-size:32px;margin-bottom:12px\">🧾</div>\n          <p>暂无收益流水记录</p>\n          <p style=\"font-size:12px;margin-top:4px\">当有用户购买了您的原创作品，收益将实时显示在这里</p>\n        </div>") + "\n      </div>\n      <div style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:24px;margin-top:18px\">\n        <h3 style=\"font-size:16px;margin-bottom:16px;color:var(--gray-800)\">提现申请记录</h3>\n        " + (_0x3ba71b.length > 0 ? "<table style=\"width:100%;border-collapse:collapse;font-size:13px\">\n          <tr style=\"background:var(--gray-50)\">\n            <th style=\"padding:10px;text-align:right\">金额(元)</th>\n            <th style=\"padding:10px;text-align:center\">状态</th>\n            <th style=\"padding:10px;text-align:left\">处理说明</th>\n            <th style=\"padding:10px;text-align:right\">申请时间</th>\n          </tr>\n          " + _0x3ba71b.map(_0x13ef5e => "<tr style=\"border-top:1px solid var(--gray-100)\">\n            <td style=\"padding:8px;text-align:right;font-weight:600\">&yen;" + (_0x13ef5e.amount / 100).toFixed(2) + "</td>\n            <td style=\"padding:8px;text-align:center\">" + (_0x213810[_0x13ef5e.status] || htmlEscape(_0x13ef5e.status || "")) + "</td>\n            <td style=\"padding:8px;color:var(--gray-500)\">" + (_0x13ef5e.status === "rejected" ? htmlEscape(_0x13ef5e.rejection_reason || "未填写原因") : _0x13ef5e.status === "completed" ? "已完成打款" : "管理员审核中") + "</td>\n            <td style=\"padding:8px;text-align:right;color:var(--gray-400)\">" + htmlEscape(_0x13ef5e.created_at || "") + "</td>\n          </tr>").join("") + "\n        </table>" : "<div style=\"text-align:center;padding:24px;color:var(--gray-400)\">暂无提现申请</div>") + "\n      </div>";
    loadCreatorShareNote(_0xb57515);
  } catch (_0x54ef6a) {
    _0xb57515.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">网络错误，请稍后再试</div>";
  }
}
async function requestWithdraw(_0x50a2e0, _0x3b724f) {
  if (_0x3b724f) {
    toast("本自然月已提交过提现申请", "error");
    return;
  }
  if (!_0x50a2e0 || _0x50a2e0 <= 0) {
    toast("暂无可提现余额", "error");
    return;
  }
  var _0x54ab7e = (_0x50a2e0 / 100).toFixed(2);
  var _0x451fcc = document.createElement("div");
  _0x451fcc.className = "modal-overlay";
  _0x451fcc.onclick = function (_0x57523a) {
    if (_0x57523a.target === _0x451fcc) {
      _0x451fcc.classList.remove("show");
      setTimeout(function () {
        _0x451fcc.remove();
      }, 300);
    }
  };
  _0x451fcc.innerHTML = "<div class=\"modal\" onclick=\"event.stopPropagation()\" style=\"max-width:480px;padding:32px\"><div class=\"modal-close\"><button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button></div><h2 style=\"font-family:var(--font-serif);font-size:20px;margin-bottom:20px\">💰 申请提现</h2><div class=\"form-group\"><label class=\"form-label\">提现金额（元）<span style=\"color:var(--red-500)\">*</span></label><input class=\"form-input\" type=\"number\" id=\"withdraw-amount\" value=\"" + _0x54ab7e + "\" readonly style=\"background:var(--gray-100)\"><p style=\"font-size:12px;color:var(--gray-500);margin-top:6px\">每次提取当前全部可提现余额；无最低金额限制，每个自然月可申请一次。</p></div><div class=\"form-group\"><label class=\"form-label\">真实姓名 <span style=\"color:var(--red-500)\">*</span></label><input class=\"form-input\" type=\"text\" id=\"withdraw-name\" placeholder=\"请填写收款人真实姓名\"></div><div class=\"form-group\"><label class=\"form-label\">收款方式 <span style=\"color:var(--red-500)\">*</span></label><select class=\"form-input\" id=\"withdraw-method\" onchange=\"toggleWithdrawMethod()\"><option value=\"alipay\">支付宝</option><option value=\"wechat\">微信收款码</option></select></div><div id=\"withdraw-alipay-area\" class=\"form-group\"><label class=\"form-label\">支付宝账号 <span style=\"color:var(--red-500)\">*</span></label><input class=\"form-input\" type=\"text\" id=\"withdraw-alipay\" placeholder=\"手机号或邮箱\"></div><div id=\"withdraw-wechat-area\" class=\"form-group\" style=\"display:none\"><label class=\"form-label\">微信收款码 <span style=\"color:var(--red-500)\">*</span></label><input type=\"file\" id=\"withdraw-qr\" accept=\"image/*\" class=\"form-input\" style=\"padding:8px\"></div><div style=\"display:flex;gap:12px;margin-top:24px;justify-content:flex-end\"><button class=\"btn btn-outline\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">取消</button><button class=\"btn btn-primary\" onclick=\"confirmWithdraw(" + _0x50a2e0 + ")\">确认提现</button></div></div>";
  document.body.appendChild(_0x451fcc);
  requestAnimationFrame(function () {
    _0x451fcc.classList.add("show");
  });
}
function toggleWithdrawMethod() {
  var _0x597348 = document.getElementById("withdraw-method")?.value;
  var _0x2b913a = document.getElementById("withdraw-alipay-area");
  var _0x5dd33e = document.getElementById("withdraw-wechat-area");
  if (_0x2b913a) {
    _0x2b913a.style.display = _0x597348 === "alipay" ? "" : "none";
  }
  if (_0x5dd33e) {
    _0x5dd33e.style.display = _0x597348 === "wechat" ? "" : "none";
  }
}
async function confirmWithdraw(_0xb470d2) {
  var _0xc4d5ac = parseFloat(document.getElementById("withdraw-amount")?.value);
  var _0x451c77 = document.getElementById("withdraw-name")?.value?.trim();
  var _0x48cd56 = document.getElementById("withdraw-method")?.value;
  var _0x3f9d7d = document.getElementById("withdraw-alipay")?.value?.trim();
  var _0x259361 = document.getElementById("withdraw-qr");
  if (!_0xc4d5ac || Math.round(_0xc4d5ac * 100) !== _0xb470d2) {
    toast("可提现余额已变化，请刷新后重新申请", "error");
    return;
  }
  if (!_0x451c77) {
    toast("请填写真实姓名", "error");
    return;
  }
  if (_0x48cd56 === "alipay" && !_0x3f9d7d) {
    toast("请填写支付宝账号", "error");
    return;
  }
  if (_0x48cd56 === "wechat" && (!_0x259361 || !_0x259361.files || !_0x259361.files[0])) {
    toast("请上传微信收款码", "error");
    return;
  }
  toast("提交中...", "info");
  var _0x4dcd97 = "";
  if (_0x48cd56 === "wechat" && _0x259361 && _0x259361.files[0]) {
    var _0x2bb696 = new FormData();
    _0x2bb696.append("cover", _0x259361.files[0]);
    try {
      _0x2bb696.delete("cover");
      _0x2bb696.append("qr", _0x259361.files[0]);
      var _0x2c863b = await fetch(API_BASE + "/api/creator/withdraw-qr", {
        method: "POST",
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {},
        body: _0x2bb696
      });
      var _0xb652b4 = await _0x2c863b.json();
      if (_0xb652b4.success) {
        _0x4dcd97 = _0xb652b4.key;
      }
    } catch (_0x50cb54) {}
    if (!_0x4dcd97) {
      toast("微信收款码上传失败，请重试", "error");
      return;
    }
  }
  try {
    var _0x40f746 = Math.round(_0xc4d5ac * 100);
    var _0x5f1c1a = await apiFetch("/api/creator/withdraw", {
      method: "POST",
      body: JSON.stringify({
        amount: _0x40f746,
        realName: _0x451c77,
        payMethod: _0x48cd56,
        payAccount: _0x48cd56 === "alipay" ? _0x3f9d7d : _0x4dcd97
      })
    });
    if (_0x5f1c1a.success) {
      toast("提现申请已提交，预计7个工作日内处理", "success");
      var _0x29bd00 = document.querySelector(".modal-overlay");
      if (_0x29bd00) {
        _0x29bd00.classList.remove("show");
        setTimeout(function () {
          _0x29bd00.remove();
        }, 300);
      }
      switchDashTab(document.querySelector(".dash-tab.active"), "earnings");
    } else {
      toast(_0x5f1c1a.msg || "申请失败", "error");
    }
  } catch (_0x3b32e9) {
    toast("网络错误", "error");
  }
}
let ADMIN_USERS = [];
const ADMIN_USER_LIST = {
  q: "",
  page: 1,
  pageSize: 50,
  total: 0,
  pages: 1,
  loading: false,
  composing: false,
  generation: 0,
  timer: null,
  controller: null
};
let PROGRAMS_ALL = [];
function renderAdminMonitor() {
  const _0x54d05a = PROGRAMS.length;
  const _0x38af1e = PROGRAMS.reduce((_0x3e13cc, _0x38814f) => _0x3e13cc + (_0x38814f.uses || 0), 0);
  const _0x1bf169 = PROGRAMS.filter(_0x836b47 => _0x836b47.price === 0).length;
  const _0x3e2587 = _0x54d05a - _0x1bf169;
  return "\n    <div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px\">\n      <div style=\"background:#fff;border-radius:12px;padding:24px;border:1px solid var(--gray-200);text-align:center\">\n        <div style=\"font-size:32px;font-weight:700;color:var(--blue-600)\">" + _0x54d05a + "</div>\n        <div style=\"font-size:13px;color:var(--gray-500);margin-top:4px\">上架作品总数</div>\n      </div>\n      <div style=\"background:#fff;border-radius:12px;padding:24px;border:1px solid var(--gray-200);text-align:center\">\n        <div style=\"font-size:32px;font-weight:700;color:var(--green-600)\">" + _0x38af1e + "</div>\n        <div style=\"font-size:13px;color:var(--gray-500);margin-top:4px\">累计使用次数</div>\n      </div>\n      <div style=\"background:#fff;border-radius:12px;padding:24px;border:1px solid var(--gray-200);text-align:center\">\n        <div style=\"font-size:32px;font-weight:700;color:var(--amber-600)\">" + _0x1bf169 + "</div>\n        <div style=\"font-size:13px;color:var(--gray-500);margin-top:4px\">免费作品</div>\n      </div>\n      <div style=\"background:#fff;border-radius:12px;padding:24px;border:1px solid var(--gray-200);text-align:center\">\n        <div style=\"font-size:32px;font-weight:700;color:var(--purple-600,#7c3aed)\">" + _0x3e2587 + "</div>\n        <div style=\"font-size:13px;color:var(--gray-500);margin-top:4px\">付费作品</div>\n      </div>\n    </div>\n    <div style=\"background:#fff;border-radius:12px;padding:24px;border:1px solid var(--gray-200)\">\n      <h3 style=\"font-size:16px;margin-bottom:16px;color:var(--gray-800)\">📊 平台概览</h3>\n      <p style=\"font-size:13px;color:var(--gray-500)\">点击 <strong>👥 会员管理</strong> 查看用户列表与 VIP 发放，<strong>🚀 作品调度</strong> 审核上架作品，<strong>📋 订单记录</strong> 查看全部成交数据与收入统计。</p>\n    </div>";
}
async function renderAdminVisits(_0x5b2abd, _0x166b17) {
  if (!_0x5b2abd) {
    return;
  }
  const _0x39820d = _0x166b17 ? "?date=" + encodeURIComponent(_0x166b17) + "&limit=500" : "?limit=200";
  try {
    const _0x27f925 = await apiFetch("/api/admin/visits" + _0x39820d);
    if (!_0x27f925.success) {
      throw new Error(_0x27f925.msg || "加载失败");
    }
    const _0x116df9 = _0x27f925.visits || [];
    const _0x1c1a02 = _0x116df9.filter(_0x47d626 => _0x47d626.visitor_type === "user").length;
    const _0x1ff6d5 = _0x116df9.length - _0x1c1a02;
    const _0x1cdc33 = _0x116df9.map(_0x3edb05 => {
      const _0x5b14e6 = _0x3edb05.visitor_type === "user" ? "<strong>" + htmlEscape(_0x3edb05.nickname || "教师用户") + "</strong><br><small style=\"color:var(--gray-400)\">" + htmlEscape(_0x3edb05.openid || "") + "</small>" : "<strong style=\"color:var(--amber-600)\">匿名访客</strong>";
      const _0x2c542b = [_0x3edb05.country, _0x3edb05.region_name || _0x3edb05.region, _0x3edb05.city].filter(Boolean).map(htmlEscape).join(" / ");
      const _0x5372ea = _0x2c542b || (_0x3edb05.geo_status === "pending" ? "<span style=\"color:var(--blue-500)\">定位中...</span>" : _0x3edb05.geo_status === "failed" ? "<span style=\"color:var(--red-400)\" title=\"" + htmlEscape(_0x3edb05.geo_error || "") + "\">定位失败</span>" : "<span style=\"color:var(--gray-400)\">本地/未知地址</span>");
      return "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:10px 12px;white-space:nowrap\">" + htmlEscape(_0x3edb05.visit_date || "-") + "<br><small style=\"color:var(--gray-400)\">" + htmlEscape((_0x3edb05.created_at || "").slice(11, 19)) + "</small></td><td style=\"padding:10px 12px;max-width:250px\">" + _0x5b14e6 + "</td><td style=\"padding:10px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap\">" + htmlEscape(_0x3edb05.ip || "-") + "</td><td style=\"padding:10px 12px;min-width:210px\">" + _0x5372ea + "</td><td style=\"padding:10px 12px;color:var(--gray-500);font-size:11px;max-width:320px;word-break:break-all\" title=\"" + htmlEscape(_0x3edb05.user_agent || "") + "\">" + htmlEscape((_0x3edb05.user_agent || "-").slice(0, 90)) + "</td></tr>";
    }).join("");
    _0x5b2abd.innerHTML = "<div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\"><div style=\"display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px\"><div><h3 style=\"font-size:16px;font-weight:700;color:var(--gray-800)\">🌐 每日访问记录</h3><p style=\"font-size:12px;color:var(--gray-500);margin-top:4px\">同一登录用户或匿名访客每天只记录一次</p></div><div style=\"display:flex;gap:8px;align-items:center\"><input type=\"date\" class=\"form-input\" style=\"width:160px\" value=\"" + htmlEscape(_0x166b17 || "") + "\" onchange=\"renderAdminVisits(document.getElementById('admin-content'),this.value)\"><button class=\"btn btn-outline btn-sm\" onclick=\"renderAdminVisits(document.getElementById('admin-content'),'')\">最近记录</button></div></div><div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px\"><span style=\"padding:7px 12px;background:var(--blue-50);color:var(--blue-700);border-radius:999px;font-size:12px\">共 " + _0x116df9.length + " 条</span><span style=\"padding:7px 12px;background:var(--green-50);color:var(--green-700);border-radius:999px;font-size:12px\">登录用户 " + _0x1c1a02 + "</span><span style=\"padding:7px 12px;background:var(--amber-50);color:var(--amber-700);border-radius:999px;font-size:12px\">匿名访客 " + _0x1ff6d5 + "</span></div><div style=\"overflow-x:auto\"><table style=\"width:100%;border-collapse:collapse;font-size:13px;min-width:960px\"><thead><tr style=\"background:var(--gray-50)\"><th style=\"padding:10px 12px;text-align:left\">访问时间</th><th style=\"padding:10px 12px;text-align:left\">用户类型</th><th style=\"padding:10px 12px;text-align:left\">IP 地址</th><th style=\"padding:10px 12px;text-align:left\">国家 / 地区 / 城市</th><th style=\"padding:10px 12px;text-align:left\">设备信息</th></tr></thead><tbody>" + (_0x1cdc33 || "<tr><td colspan=\"5\" style=\"padding:32px;text-align:center;color:var(--gray-400)\">暂无访问记录</td></tr>") + "</tbody></table></div></div>";
  } catch (_0x59fd63) {
    _0x5b2abd.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--red-500)\">❌ 访问记录加载失败：" + htmlEscape(_0x59fd63.message || "未知错误") + "</div>";
  }
}
async function loadAllProgramsForAdmin() {
  try {
    const _0x4566c1 = await apiFetch("/api/programs?all=true");
    if (_0x4566c1.success) {
      PROGRAMS_ALL = _0x4566c1.programs;
      return true;
    }
  } catch (_0xe15af7) {
    console.error("调取全库失败:", _0xe15af7);
  }
  return false;
}
function cancelAdminUserRequest() {
  clearTimeout(ADMIN_USER_LIST.timer);
  ADMIN_USER_LIST.timer = null;
  ADMIN_USER_LIST.generation++;
  if (ADMIN_USER_LIST.controller) {
    ADMIN_USER_LIST.controller.abort();
  }
  ADMIN_USER_LIST.controller = null;
}
function adminUserListBusy(_0x8c47e2) {
  const _0x52a4e5 = document.getElementById("admin-user-tbody");
  if (!_0x52a4e5) {
    return;
  }
  ADMIN_USERS = [];
  _0x52a4e5.innerHTML = "<tr><td colspan=\"8\" style=\"text-align:center;padding:24px;color:var(--gray-500)\">" + htmlEscape(_0x8c47e2) + "</td></tr>";
  const _0x35647e = document.getElementById("admin-user-select-all");
  if (_0x35647e) {
    _0x35647e.checked = false;
    _0x35647e.disabled = true;
  }
  document.querySelectorAll("[data-admin-user-control]").forEach(_0x3dfc88 => {
    _0x3dfc88.disabled = true;
  });
  const _0x3b9f5b = document.getElementById("admin-user-status");
  if (_0x3b9f5b) {
    _0x3b9f5b.textContent = _0x8c47e2;
  }
  const _0x16cf99 = document.getElementById("admin-user-retry");
  if (_0x16cf99) {
    _0x16cf99.hidden = true;
  }
}
async function loadAdminUsers() {
  const _0xf740e4 = document.getElementById("admin-user-tbody");
  if (!_0xf740e4 || ADMIN_USER_LIST.composing) {
    return;
  }
  cancelAdminUserRequest();
  const _0x417bb9 = ADMIN_USER_LIST.generation;
  const _0x2c24fe = ADMIN_USER_LIST.controller = new AbortController();
  const _0x5e21e0 = new URLSearchParams({
    q: ADMIN_USER_LIST.q,
    page: String(ADMIN_USER_LIST.page),
    pageSize: String(ADMIN_USER_LIST.pageSize)
  });
  function visible() {
    return _0x417bb9 === ADMIN_USER_LIST.generation && document.getElementById("admin-user-tbody") === _0xf740e4 && _0xf740e4.isConnected;
  }
  ADMIN_USER_LIST.loading = true;
  adminUserListBusy("加载用户中…");
  try {
    const _0x597174 = await apiFetch("/api/users?" + _0x5e21e0, {
      signal: _0x2c24fe.signal,
      cache: "no-store"
    });
    if (!visible()) {
      return;
    }
    if (!_0x597174.success || !Array.isArray(_0x597174.users) || !_0x597174.pagination) {
      throw new Error(_0x597174.msg || "用户列表读取失败");
    }
    ADMIN_USERS = _0x597174.users;
    Object.assign(ADMIN_USER_LIST, _0x597174.pagination);
    _0xf740e4.innerHTML = renderAdminUserRows();
    document.getElementById("admin-user-status").textContent = "共 " + ADMIN_USER_LIST.total + " 位用户 · 第 " + ADMIN_USER_LIST.page + " / " + ADMIN_USER_LIST.pages + " 页";
    const _0x2ee88b = document.getElementById("admin-user-select-all");
    _0x2ee88b.checked = false;
    _0x2ee88b.disabled = !ADMIN_USERS.length;
    document.querySelectorAll("[data-admin-user-control]").forEach(_0x54239b => {
      _0x54239b.disabled = false;
    });
    document.getElementById("admin-user-prev").disabled = ADMIN_USER_LIST.page <= 1;
    document.getElementById("admin-user-next").disabled = ADMIN_USER_LIST.page >= ADMIN_USER_LIST.pages;
  } catch (_0xd3307e) {
    if (!visible() || _0xd3307e.name === "AbortError") {
      return;
    }
    adminUserListBusy(_0xd3307e.message || "用户列表读取失败，请重试");
    document.getElementById("admin-user-retry").hidden = false;
  } finally {
    if (visible()) {
      ADMIN_USER_LIST.loading = false;
      ADMIN_USER_LIST.controller = null;
    }
  }
}
function renderAdmin() {
  if (!isModerator()) {
    return document.createElement("div");
  }
  const _0x2f5aa7 = isSuperAdmin();
  const _0x3bfad5 = document.createElement("div");
  _0x3bfad5.className = "dashboard-page";
  _0x3bfad5.innerHTML = "\n    <div class=\"dashboard-header\" style=\"background:linear-gradient(135deg,#1e293b,#334155)\">\n      <div class=\"dash-avatar\" style=\"background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff\">管</div>\n      <div class=\"dash-user-info\"><h2 style=\"color:#fff\">🛡️ " + (_0x2f5aa7 ? "超级管理员" : "管理员") + "控制台</h2></div>\n    </div>\n    <div class=\"dash-tabs dash-tabs-scroll\">\n      <button class=\"dash-tab active\" onclick=\"switchAdminTab(this,'monitor')\">📊 数据大盘</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'visits')\">🌐 访问记录</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'apps')\">🚀 作品调度</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'users')\">👥 会员管理</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'orders')\">📋 订单记录</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'trash')\">🗑️ 回收站</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'points')\">💰 积分管理</button>\n      " + (_0x2f5aa7 ? "\n      " + (premiumCatalogueEnabled ? "<button class=\"dash-tab\" onclick=\"switchAdminTab(this,'premium-catalogue')\">精品课编目</button><button class=\"dash-tab\" onclick=\"switchAdminTab(this,'member-prices')\">会员价格设置</button><button class=\"dash-tab\" onclick=\"switchAdminTab(this,'member-rights')\">用户会员权益</button><button class=\"dash-tab\" onclick=\"switchAdminTab(this,'premium-refunds')\">精品订单与退款</button><button class=\"dash-tab\" onclick=\"switchAdminTab(this,'home-promotion')\">首页推广页</button>" : "") + "\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'large-course')\">大课件上传</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'tuxiaoling-glb')\">图小灵模型库</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'purchases')\">↩️ 购买退款</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'invoices')\">发票申请<span data-invoice-badge></span></button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'feedback')\">💬 反馈管理</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'inquiries')\">🏫 采购咨询</button>\n      <a class=\"dash-tab campus-admin-entry\" href=\"/campus/admin/\">校园管理 ↗</a>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'announce')\">📢 公告管理</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'wechat-reply')\">微信公众号设置</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'coupons')\">🎫 优惠码管理</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'teacher-settlements')\">📊 教师结算</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'withdrawals')\">💰 提现管理</button>\n      <button class=\"dash-tab\" onclick=\"switchAdminTab(this,'moderators')\">🛡️ 管理员成员</button>\n      " : "") + "\n    </div>\n    <div id=\"admin-content\">" + renderAdminMonitor() + "</div>";
  if (_0x2f5aa7) {
    apiFetch("/api/invoices/admin/summary").then(_0x1bf214 => {
      const _0x4de872 = _0x3bfad5.querySelector("[data-invoice-badge]");
      if (_0x4de872 && _0x1bf214.success) {
        _0x4de872.textContent = _0x1bf214.summary.pending ? "（" + _0x1bf214.summary.pending + "）" : "";
      }
    }).catch(() => {});
  }
  return _0x3bfad5;
}
function switchAdminTab(_0x90b19d, _0x253dbc) {
  cancelAdminUserRequest();
  ADMIN_USER_LIST.composing = false;
  if (_0x90b19d) {
    document.querySelectorAll(".dash-tab").forEach(_0x3e7c2c => _0x3e7c2c.classList.remove("active"));
    _0x90b19d.classList.add("active");
  }
  const _0x597c79 = document.getElementById("admin-content");
  if (!_0x597c79) {
    return;
  }
  switch (_0x253dbc) {
    case "invoices":
      {
        if (!isSuperAdmin()) {
          return;
        }
        const _0x24f05f = document.createElement("section");
        _0x597c79.replaceChildren(_0x24f05f);
        import("/invoices/index.mjs").then(_0x8ad90d => {
          if (_0x24f05f.isConnected) {
            _0x8ad90d.mountAdmin(_0x24f05f, {
              token: State.token
            });
          }
        }).catch(() => {
          _0x24f05f.textContent = "发票申请暂时无法载入，请刷新重试。";
        });
        break;
      }
    case "member-prices":
    case "member-rights":
      {
        if (!isSuperAdmin() || !premiumCatalogueEnabled) {
          return;
        }
        const _0x194dbf = document.createElement("section");
        _0x597c79.replaceChildren(_0x194dbf);
        import("/premium-catalogue/membership.mjs").then(_0x5a68e6 => {
          if (_0x194dbf.isConnected) {
            (_0x253dbc === "member-prices" ? _0x5a68e6.mountPrices : _0x5a68e6.mountEntitlements)(_0x194dbf, State.token);
          }
        }).catch(() => {
          _0x194dbf.textContent = "会员管理暂时无法载入。";
        });
        break;
      }
    case "home-promotion":
      {
        if (!isSuperAdmin() || !premiumCatalogueEnabled) {
          return;
        }
        const _0x505ee8 = document.createElement("section");
        _0x597c79.replaceChildren(_0x505ee8);
        import("/premium-catalogue/promotion.mjs").then(_0x480d42 => {
          if (_0x505ee8.isConnected) {
            _0x480d42.mountPromotion(_0x505ee8, State.token);
          }
        }).catch(() => {
          _0x505ee8.textContent = "推广页管理暂时无法载入。";
        });
        break;
      }
    case "premium-refunds":
      {
        if (!isSuperAdmin() || !premiumCatalogueEnabled) {
          return;
        }
        const _0x2d71d2 = document.createElement("section");
        _0x597c79.replaceChildren(_0x2d71d2);
        import("/premium-catalogue/refunds.mjs").then(_0x551acd => {
          if (_0x2d71d2.isConnected) {
            _0x551acd.mountRefunds(_0x2d71d2, State.token);
          }
        }).catch(() => {
          _0x2d71d2.textContent = "精品订单暂时无法载入。";
        });
        break;
      }
    case "premium-catalogue":
      {
        if (!isSuperAdmin() || !premiumCatalogueEnabled) {
          return;
        }
        const _0x146a22 = document.createElement("section");
        _0x597c79.replaceChildren(_0x146a22);
        import("/premium-catalogue/client.mjs").then(_0x34b96e => {
          if (_0x146a22.isConnected) {
            _0x34b96e.mountAdmin(_0x146a22, State.token);
          }
        }).catch(() => {
          _0x146a22.textContent = "精品课编目暂时无法载入。";
        });
        break;
      }
    case "large-course":
      if (!isSuperAdmin()) {
        return;
      }
      _0x597c79.textContent = "正在检查大课件入口…";
      import("/admin-large/website-admin.mjs").then(_0xb5d813 => {
        if (_0x597c79.isConnected) {
          _0xb5d813.mount(_0x597c79, State.token);
        }
      }).catch(() => {
        _0x597c79.textContent = "大课件入口尚未启用，请联系技术管理员配置。";
      });
      break;
    case "tuxiaoling-glb":
      {
        if (!isSuperAdmin()) {
          return;
        }
        const _0x304776 = document.createElement("section");
        _0x597c79.replaceChildren(_0x304776);
        import("/tuxiaoling/js/glb-library.mjs").then(_0x4329f8 => {
          if (_0x304776.isConnected) {
            _0x4329f8.mountGlbLibrary(_0x304776, State.token);
          }
        }).catch(() => {
          _0x304776.textContent = "图小灵模型库暂时无法载入。";
        });
        break;
      }
    case "monitor":
      _0x597c79.innerHTML = renderAdminMonitor();
      break;
    case "visits":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载访问记录中...</div>";
      renderAdminVisits(_0x597c79);
      break;
    case "users":
      _0x597c79.innerHTML = renderAdminUsers();
      loadAdminUsers();
      break;
    case "apps":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">正在调取全量作品库(含待审)...</div>";
      loadAllProgramsForAdmin().then(() => {
        _0x597c79.innerHTML = renderAdminApps();
        filterAdminApps();
      });
      break;
    case "teacher-settlements":
      {
        const _0x297f03 = _0x597c79.cloneNode(false);
        _0x597c79.replaceWith(_0x297f03);
        renderAdminTeacherSettlements(_0x297f03);
        break;
      }
    case "coupons":
      renderAdminCouponManagement(_0x597c79);
      break;
    case "withdrawals":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载提现请求...</div>";
      renderAdminWithdrawals(_0x597c79);
      break;
    case "orders":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载订单数据...</div>";
      renderAdminOrdersV2(_0x597c79);
      break;
    case "purchases":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载购买记录...</div>";
      renderAdminPurchases(_0x597c79);
      break;
    case "points":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载积分管理...</div>";
      renderAdminPoints(_0x597c79);
      break;
    case "announce":
      _0x597c79.innerHTML = renderAdminAnnounce();
      loadCurrentAnnouncement();
      break;
    case "wechat-reply":
      if (!isSuperAdmin()) {
        return;
      }
      renderAdminWechatReply(_0x597c79);
      break;
    case "feedback":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载中...</div>";
      renderAdminFeedback(_0x597c79);
      break;
    case "inquiries":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载中...</div>";
      renderAdminInquiries(_0x597c79);
      break;
    case "trash":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载回收站...</div>";
      loadAllProgramsForAdmin().then(() => {
        _0x597c79.innerHTML = renderAdminTrash();
      });
      break;
    case "moderators":
      _0x597c79.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载管理员列表...</div>";
      renderAdminModerators(_0x597c79);
      break;
  }
}
async function adminApprove(_0x2affe6) {
  toast("正在上架...", "info");
  const _0x20757f = await apiFetch("/api/programs/approve", {
    method: "POST",
    body: JSON.stringify({
      id: _0x2affe6
    })
  });
  if (_0x20757f.success) {
    toast("作品已同步到首页展示！", "success");
    await loadProgramsFromDatabase();
    loadAllProgramsForAdmin().then(() => {
      document.getElementById("admin-content").innerHTML = renderAdminApps();
      filterAdminApps();
    });
  }
}
var ADMIN_APP_FILTER = "all";
var ADMIN_APP_SEARCH = "";
var ADMIN_APP_SUBJECT = "全部";
function filterAdminApps() {
  var _0x3ff34c = document.getElementById("admin-app-tbody");
  if (!_0x3ff34c) {
    return;
  }
  var _0x26ad04 = {
    0: "⏳ 待审核",
    1: "✅ 已上架",
    2: "⬇️ 已下架",
    3: "❌ 已驳回",
    5: "📝 草稿"
  };
  var _0x5ec613 = ADMIN_APP_SEARCH.trim().toLowerCase();
  var _0x205ea9 = PROGRAMS_ALL.filter(function (_0x430e3a) {
    var _0x3c6d01 = typeof _0x430e3a.status === "number" ? _0x430e3a.status : 0;
    if (_0x3c6d01 === 4) {
      return false;
    }
    if (ADMIN_APP_FILTER !== "all" && _0x3c6d01 !== parseInt(ADMIN_APP_FILTER)) {
      return false;
    }
    if (ADMIN_APP_SUBJECT !== "全部" && !programSubjects(_0x430e3a).includes(ADMIN_APP_SUBJECT)) {
      return false;
    }
    if (_0x5ec613 && (_0x430e3a.title || "").toLowerCase().indexOf(_0x5ec613) === -1) {
      return false;
    }
    return true;
  });
  _0x3ff34c.innerHTML = TuringPlacement.browse(_0x205ea9, "recommended", ADMIN_APP_SUBJECT).map(function (_0x4e9877) {
    var _0x435fa6 = typeof _0x4e9877.status === "number" ? _0x4e9877.status : 0;
    var _0x39ba63 = _0x26ad04[_0x435fa6] || _0x26ad04[0];
    var _0x4a9d29 = _0x435fa6 === 1 ? "var(--green-600)" : _0x435fa6 === 2 ? "var(--amber-600)" : _0x435fa6 === 3 ? "var(--red-500)" : "var(--gray-500)";
    return "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:8px;text-align:center;min-width:120px\"><div style=\"font-size:11px;color:#64748b;margin-bottom:5px\">" + (_0x4e9877.home_position ? "首页第" + _0x4e9877.home_position + "位" : "首页自动") + " · " + (_0x4e9877.browse_position ? "全部第" + _0x4e9877.browse_position + "位" : "全部自动") + Object.entries(_0x4e9877.subject_positions || {}).map(function (_0x333f33) {
      return " · " + htmlEscape(_0x333f33[0]) + "第" + _0x333f33[1] + "位";
    }).join("") + "</div>" + (State.user && State.user.role === "admin" && (_0x435fa6 === 1 || _0x4e9877.home_position || _0x4e9877.browse_position || Object.keys(_0x4e9877.subject_positions || {}).length) ? "<button class=\"btn btn-sm btn-outline\" onclick=\"adminSetProgramPlacement(" + _0x4e9877.id + ")\">展示位置</button>" : "") + "</td><td style=\"padding:8px\"><span style=\"color:" + _0x4a9d29 + ";font-weight:600\">" + _0x39ba63 + "</span></td><td style=\"padding:8px\"><strong>" + _0x4e9877.title + "</strong><br><small style=\"color:#999\">作者: " + _0x4e9877.author + "</small></td><td style=\"padding:8px;text-align:center;font-size:12px;color:var(--gray-500)\">" + (_0x4e9877.uses ?? "-") + "</td><td style=\"padding:8px;text-align:center;font-size:12px;color:var(--gray-500)\">" + (_0x4e9877.clicks || 0) + "</td><td style=\"padding:8px;font-size:11px;color:var(--gray-500);max-width:160px\">" + (_0x4e9877.admin_feedback ? "📝 " + _0x4e9877.admin_feedback : "-") + "</td><td style=\"padding:8px;text-align:center;white-space:nowrap\"><button class=\"btn btn-sm btn-outline\" onclick=\"adminPreviewProgram(" + _0x4e9877.id + ")\" style=\"margin:2px\">预览</button><button class=\"btn btn-sm\" onclick=\"adminEditProgram(" + _0x4e9877.id + ")\" style=\"margin:2px;background:#2563eb;color:#fff;border:none;font-size:11px\">✏️ 编辑</button><button class=\"btn btn-sm\" onclick=\"adminEditNote(" + _0x4e9877.id + ")\" style=\"margin:2px;background:#7c3aed;color:#fff;border:none;font-size:11px\">写说明</button>" + (_0x435fa6 !== 1 ? "<button class=\"btn btn-sm btn-green\" onclick=\"adminApprove(" + _0x4e9877.id + ")\" style=\"margin:2px\">上架</button>" : "") + (_0x435fa6 === 1 ? "<button class=\"btn btn-sm btn-amber\" onclick=\"adminDelistProgram(" + _0x4e9877.id + ")\" style=\"margin:2px\">下架</button>" : "") + (_0x435fa6 !== 3 ? "<button class=\"btn btn-sm\" onclick=\"adminRejectProgram(" + _0x4e9877.id + ")\" style=\"margin:2px;background:var(--red-500);color:#fff;border:none\">驳回</button>" : "") + "<button class=\"btn btn-sm btn-outline\" onclick=\"adminDeleteProgram(" + _0x4e9877.id + ")\" style=\"margin:2px\">删除</button></td></tr>";
  }).join("") || "<tr><td colspan=\"7\" style=\"text-align:center;padding:20px;color:#999\">暂无匹配的作品</td></tr>";
}
function renderAdminApps() {
  var _0x5a7506 = {
    0: "⏳ 待审核",
    1: "✅ 已上架",
    2: "⬇️ 已下架",
    3: "❌ 已驳回",
    5: "📝 草稿"
  };
  return "\n    <div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">\n      <h3 style=\"font-size:16px;margin-bottom:16px\">📝 作品管理</h3>\n      <div class=\"dash-tabs\" style=\"margin-bottom:16px\">\n        <button class=\"dash-tab " + (ADMIN_APP_FILTER === "all" ? "active" : "") + "\" onclick=\"ADMIN_APP_FILTER='all';filterAdminApps();this.closest('.dash-tabs').querySelectorAll('.dash-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')\">全部</button>\n        <button class=\"dash-tab " + (ADMIN_APP_FILTER === "0" ? "active" : "") + "\" onclick=\"ADMIN_APP_FILTER='0';filterAdminApps();this.closest('.dash-tabs').querySelectorAll('.dash-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')\">⏳ 待审核</button>\n        <button class=\"dash-tab " + (ADMIN_APP_FILTER === "1" ? "active" : "") + "\" onclick=\"ADMIN_APP_FILTER='1';filterAdminApps();this.closest('.dash-tabs').querySelectorAll('.dash-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')\">✅ 已上架</button>\n        <button class=\"dash-tab " + (ADMIN_APP_FILTER === "2" ? "active" : "") + "\" onclick=\"ADMIN_APP_FILTER='2';filterAdminApps();this.closest('.dash-tabs').querySelectorAll('.dash-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')\">⬇️ 已下架</button>\n        <button class=\"dash-tab " + (ADMIN_APP_FILTER === "3" ? "active" : "") + "\" onclick=\"ADMIN_APP_FILTER='3';filterAdminApps();this.closest('.dash-tabs').querySelectorAll('.dash-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')\">❌ 已驳回</button>\n      </div>\n      <div style=\"margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px\">\n        <span style=\"font-size:12px;color:var(--gray-500)\">首页与探索页可分别固定位置；下架作品不会展示，游客可见范围保持不变</span>\n        <label style=\"font-size:13px\">学科 <select aria-label=\"管理作品学科\" onchange=\"ADMIN_APP_SUBJECT=this.value;filterAdminApps()\">" + SUBJECTS.map(_0x303343 => "<option value=\"" + _0x303343 + "\"" + (ADMIN_APP_SUBJECT === _0x303343 ? " selected" : "") + ">" + _0x303343 + "</option>").join("") + "</select></label>\n        <span style=\"font-size:12px;color:#64748b\">默认按热度推荐，手动指定的位置优先展示</span>\n      </div>\n      <div style=\"margin-bottom:12px\">\n        <input type=\"text\" id=\"admin-app-search\" placeholder=\"🔍 搜索作品标题...\" oninput=\"ADMIN_APP_SEARCH=this.value;filterAdminApps()\" style=\"width:100%;padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box\">\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px\">\n        <tr style=\"background:var(--gray-50)\">\n          <th style=\"padding:10px;text-align:center;width:80px\">展示位置</th><th style=\"padding:10px;text-align:left\">状态</th><th style=\"padding:10px;text-align:left\">标题</th><th style=\"padding:10px;text-align:center;width:60px\">使用</th><th style=\"padding:10px;text-align:center;width:60px\">点击</th><th style=\"padding:10px;text-align:left\">反馈</th><th style=\"padding:10px;text-align:center\">操作</th>\n        </tr>\n        <tbody id=\"admin-app-tbody\"></tbody>\n      </table>\n    </div>";
}
async function adminSaveProgram(_0x6cd951) {
  const _0x179e73 = document.getElementById("admin-title-" + _0x6cd951)?.value;
  const _0x1198ee = parseFloat(document.getElementById("admin-price-" + _0x6cd951)?.value);
  await apiFetch("/api/programs/update", {
    method: "POST",
    body: JSON.stringify({
      id: _0x6cd951,
      title: _0x179e73,
      price: _0x1198ee
    })
  });
  toast("程序数据已永久更新", "success");
  await loadProgramsFromDatabase();
}
async function adminDeleteProgram(_0x492bf7) {
  if (!confirm("确定要将此作品移入回收站吗？" + (document.querySelector(".dash-tab.active")?.textContent?.includes("回收站") ? "" : "用户将不再看到它。"))) {
    return;
  }
  const _0x292ce7 = await apiFetch("/api/programs/delete", {
    method: "POST",
    body: JSON.stringify({
      id: _0x492bf7
    })
  });
  if (!_0x292ce7.success) {
    toast(_0x292ce7.msg || "操作失败，请稍后重试", "error");
    return;
  }
  toast("作品已移入回收站", "success");
  await loadProgramsFromDatabase();
  const _0x2b02e3 = document.querySelector(".dash-tab.active");
  if (_0x2b02e3) {
    switchAdminTab(_0x2b02e3, _0x2b02e3.textContent.includes("回收站") ? "trash" : "apps");
  }
}
function adminEditProgram(_0x33bee2) {
  const _0x154fc6 = PROGRAMS_ALL.find(_0x482c0c => _0x482c0c.id === _0x33bee2);
  if (!_0x154fc6) {
    toast("作品不存在", "error");
    return;
  }
  let _0x5d5506 = document.getElementById("admin-edit-overlay");
  if (!_0x5d5506) {
    _0x5d5506 = document.createElement("div");
    _0x5d5506.id = "admin-edit-overlay";
    _0x5d5506.className = "modal-overlay";
    document.body.appendChild(_0x5d5506);
  }
  const _0x53fb09 = SUBJECTS.filter(_0x11fd57 => _0x11fd57 !== "全部").map(_0x592aec => "<option value=\"" + _0x592aec + "\"" + (_0x592aec === _0x154fc6.subject ? " selected" : "") + ">" + _0x592aec + "</option>").join("");
  const _0x3dec1e = GRADES.filter(_0x463a78 => _0x463a78 !== "全部").map(_0x36db8d => "<option value=\"" + _0x36db8d + "\"" + (_0x36db8d === _0x154fc6.grade ? " selected" : "") + ">" + _0x36db8d + "</option>").join("");
  const _0x1520c2 = GRADE_LEVELS[_0x154fc6.grade] || [];
  const _0x2389d1 = "<option value=\"\">不限</option>" + _0x1520c2.map(_0x2c132f => "<option value=\"" + _0x2c132f + "\"" + (_0x2c132f === _0x154fc6.grade_level ? " selected" : "") + ">" + _0x2c132f + "</option>").join("");
  const _0x528c56 = TYPES.filter(_0x370f9e => _0x370f9e !== "全部").map(_0x7ef905 => "<option value=\"" + _0x7ef905 + "\"" + (_0x7ef905 === _0x154fc6.type ? " selected" : "") + ">" + _0x7ef905 + "</option>").join("");
  _0x5d5506.innerHTML = "<div class=\"modal\" onclick=\"event.stopPropagation()\" style=\"padding:32px\"><div class=\"modal-close\"><button class=\"modal-close-btn\" onclick=\"document.getElementById('admin-edit-overlay').classList.remove('show');setTimeout(function(){document.getElementById('admin-edit-overlay').remove()},300)\">✕</button></div><h3 style=\"font-size:17px;margin-bottom:12px\">✏️ 编辑作品信息</h3><p style=\"font-size:13px;color:var(--gray-500);margin-bottom:16px\">" + htmlEscape(_0x154fc6.title || "") + "</p><div class=\"form-group\"><label class=\"form-label\">作品标题</label><input class=\"form-input\" id=\"admin-edit-title\" value=\"" + htmlEscape(_0x154fc6.title || "") + "\"></div><div style=\"display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px\"><div class=\"form-group\"><label class=\"form-label\">学科</label><select class=\"form-input\" id=\"admin-edit-subject\">" + _0x53fb09 + "</select></div><div class=\"form-group\"><label class=\"form-label\">学段</label><select class=\"form-input\" id=\"admin-edit-grade\" onchange=\"adminEditUpdateGradeLevels(" + _0x33bee2 + ")\">" + _0x3dec1e + "</select></div><div class=\"form-group\"><label class=\"form-label\">年级</label><select class=\"form-input\" id=\"admin-edit-grade-level\">" + _0x2389d1 + "</select></div><div class=\"form-group\"><label class=\"form-label\">类型</label><select class=\"form-input\" id=\"admin-edit-type\">" + _0x528c56 + "</select></div></div><div style=\"display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px\"><div class=\"form-group\"><label class=\"form-label\">作者署名</label><input class=\"form-input\" id=\"admin-edit-author\" value=\"" + htmlEscape(_0x154fc6.author || "") + "\"></div><div class=\"form-group\"><label class=\"form-label\">定价（元）</label><input class=\"form-input\" type=\"number\" id=\"admin-edit-price\" value=\"" + (_0x154fc6.price || 0) + "\" step=\"0.1\" min=\"0\"></div></div><label style=\"display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:var(--gray-700);cursor:pointer\"><input type=\"checkbox\" id=\"admin-edit-guest-visible\"" + (_0x154fc6.guest_visible ? " checked" : "") + "><span>允许未登录游客在精选资源中看到此作品</span></label><label style=\"display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:var(--gray-700);cursor:pointer\"><input type=\"checkbox\" id=\"admin-edit-runtime-camera\"" + ((_0x154fc6.runtime_mode || "default") === "camera" ? " checked" : "") + "><span>此课件需要使用摄像头</span></label><div style=\"text-align:right;margin-top:16px\"><button class=\"btn btn-primary\" onclick=\"adminSaveProgramInfo(" + _0x33bee2 + ")\">💾 保存修改</button><button class=\"btn btn-ghost\" onclick=\"document.getElementById('admin-edit-overlay').classList.remove('show');setTimeout(function(){document.getElementById('admin-edit-overlay').remove()},300)\" style=\"margin-left:8px\">取消</button></div></div>";
  _0x5d5506.classList.add("show");
}
window.adminEditUpdateGradeLevels = function (_0x4d8fc7) {
  const _0x538823 = PROGRAMS_ALL.find(_0x3269ce => _0x3269ce.id === _0x4d8fc7);
  const _0x51c6b0 = document.getElementById("admin-edit-grade");
  const _0x5737d5 = document.getElementById("admin-edit-grade-level");
  if (!_0x51c6b0 || !_0x5737d5) {
    return;
  }
  const _0xe93e3d = _0x51c6b0.value;
  const _0x222689 = GRADE_LEVELS[_0xe93e3d] || [];
  _0x5737d5.innerHTML = "<option value=\"\">不限</option>" + _0x222689.map(function (_0xffeac6) {
    return "<option value=\"" + _0xffeac6 + "\">" + _0xffeac6 + "</option>";
  }).join("");
};
async function adminSaveProgramInfo(_0x56c873) {
  const _0x1c6b82 = document.getElementById("admin-edit-title")?.value?.trim();
  const _0x19d387 = document.getElementById("admin-edit-subject")?.value;
  const _0x4b776c = document.getElementById("admin-edit-grade")?.value;
  const _0x2afad3 = document.getElementById("admin-edit-grade-level")?.value || "";
  const _0x1e527f = document.getElementById("admin-edit-type")?.value;
  const _0x2a3b10 = document.getElementById("admin-edit-author")?.value?.trim();
  const _0x1b3d36 = parseFloat(document.getElementById("admin-edit-price")?.value) || 0;
  const _0x10665f = !!document.getElementById("admin-edit-guest-visible")?.checked;
  const _0x5a1e19 = document.getElementById("admin-edit-runtime-camera")?.checked ? "camera" : "default";
  if (!_0x1c6b82) {
    toast("标题不能为空", "error");
    return;
  }
  try {
    const _0x39d589 = await apiFetch("/api/programs/update", {
      method: "POST",
      body: JSON.stringify({
        id: _0x56c873,
        title: _0x1c6b82,
        subject: _0x19d387,
        grade: _0x4b776c,
        grade_level: _0x2afad3,
        type: _0x1e527f,
        author: _0x2a3b10,
        price: _0x1b3d36,
        guest_visible: _0x10665f,
        runtime_mode: _0x5a1e19
      })
    });
    if (!_0x39d589.success) {
      toast(_0x39d589.msg || "保存失败", "error");
      return;
    }
    toast("作品信息已更新", "success");
    const _0x45bb38 = document.getElementById("admin-edit-overlay");
    if (_0x45bb38) {
      _0x45bb38.classList.remove("show");
      setTimeout(function () {
        _0x45bb38.remove();
      }, 300);
    }
    await loadProgramsFromDatabase();
    const _0x35125a = document.querySelector(".dash-tab.active");
    if (_0x35125a && _0x35125a.textContent.includes("作品调度")) {
      loadAllProgramsForAdmin().then(function () {
        document.getElementById("admin-content").innerHTML = renderAdminApps();
        filterAdminApps();
      });
    }
  } catch (_0x31c8ce) {
    toast("保存失败: " + _0x31c8ce.message, "error");
  }
}
function renderAdminTrash() {
  const _0x3d132e = PROGRAMS_ALL.filter(function (_0x4dedee) {
    return (typeof _0x4dedee.status === "number" ? _0x4dedee.status : 0) === 4;
  });
  return "<div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\"><h3 style=\"font-size:16px;margin-bottom:8px\">🗑️ 回收站</h3><p style=\"font-size:13px;color:var(--gray-500);margin-bottom:16px\">用户删除的作品会移到这里，管理员可预览确认后再永久删除。</p>" + (_0x3d132e.length === 0 ? "<div style=\"text-align:center;padding:48px;color:var(--gray-400)\"><div style=\"font-size:40px;margin-bottom:12px\">🗑️</div><p>回收站是空的</p></div>" : "<table style=\"width:100%;border-collapse:collapse;font-size:13px\"><tr style=\"background:var(--gray-50)\"><th style=\"padding:10px;text-align:left\">标题</th><th style=\"padding:10px;text-align:left\">作者</th><th style=\"padding:10px;text-align:left\">删除时间</th><th style=\"padding:10px;text-align:center\">操作</th></tr>" + _0x3d132e.map(function (_0x193dd7) {
    return "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:10px\"><strong>" + (_0x193dd7.emoji || "📦") + " " + _0x193dd7.title + "</strong></td><td style=\"padding:10px;color:var(--gray-500)\">" + (_0x193dd7.author || "未知") + "</td><td style=\"padding:10px;font-size:12px;color:var(--gray-500)\">" + (_0x193dd7.deleted_at || "-") + "</td><td style=\"padding:10px;text-align:center;white-space:nowrap\"><button class=\"btn btn-sm btn-outline\" onclick=\"adminPreviewProgram(" + _0x193dd7.id + ")\" style=\"margin:2px\">预览</button><button class=\"btn btn-sm\" onclick=\"adminTrashPermanentDelete(" + _0x193dd7.id + ")\" style=\"margin:2px;background:var(--red-500);color:#fff;border:none\">永久删除</button></td></tr>";
  }).join("") + "</table>") + "</div>";
}
function renderAdminModerators(_0x28bd82) {
  Promise.all([apiFetch("/api/admin/moderators"), apiFetch("/api/users")]).then(function (_0x26000e) {
    var _0x144227 = _0x26000e[0];
    var _0x2026c3 = _0x26000e[1];
    var _0x97a4eb = _0x144227.moderators || [];
    var _0x240321 = _0x2026c3.users || [];
    var _0x452a19 = {};
    _0x97a4eb.forEach(function (_0x45af55) {
      _0x452a19[_0x45af55.openid] = true;
    });
    var _0xd0d0b = _0x240321.filter(function (_0x14370b) {
      return _0x14370b.role !== "admin" && !_0x452a19[_0x14370b.openid];
    });
    _0x28bd82.innerHTML = ["<div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">", "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:20px\">", "<h3 style=\"font-size:16px\">🛡️ 管理员成员管理</h3>", "<span style=\"font-size:13px;color:var(--gray-500)\">当前共 " + _0x97a4eb.length + " 名管理员</span>", "</div>", "<div style=\"background:#e8f4fd;border:1px solid #b3ddfb;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#1e5a8a;line-height:1.7\">", "<strong>📋 普通管理员权限说明</strong><br>", "✅ 作品调度 — 审核上架、下架、驳回作品<br>", "✅ 数据大盘 — 查看平台概览数据<br>", "❌ <strong>不可操作</strong>：反馈管理、采购咨询、公告管理、会员管理、提现管理、订单记录、回收站、管理员任免（以上仅超级管理员可操作）", "</div>", "<div style=\"background:var(--gray-50);border-radius:8px;padding:16px;margin-bottom:20px\">", "<div style=\"font-size:13px;font-weight:600;margin-bottom:10px\">➕ 添加管理员</div>", "<div style=\"display:flex;gap:10px\">", "<select id=\"mod-target-select\" style=\"flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:#fff\">", "<option value=\"\">-- 选择用户 --</option>", _0xd0d0b.map(function (_0x3608ab) {
      return "<option value=\"" + _0x3608ab.openid + "\">" + htmlEscape(_0x3608ab.nickname || "未命名") + " (" + _0x3608ab.openid.substring(0, 12) + "...)</option>";
    }).join(""), "</select>", "<button class=\"btn btn-sm btn-primary\" onclick=\"grantModerator()\">授予管理员</button>", "</div>", _0xd0d0b.length === 0 ? "<p style=\"font-size:12px;color:var(--gray-400);margin-top:8px\">所有注册用户都已是管理员</p>" : "", "</div>", _0x97a4eb.length > 0 ? ["<table style=\"width:100%;border-collapse:collapse;font-size:13px\">", "<tr style=\"background:var(--gray-50);border-bottom:1px solid var(--gray-200)\">", "<th style=\"padding:10px;text-align:left\">openid</th>", "<th style=\"padding:10px;text-align:left\">昵称</th>", "<th style=\"padding:10px;text-align:center\">操作</th>", "</tr>", _0x97a4eb.map(function (_0x1fec1b) {
      return "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:10px;font-family:monospace;font-size:12px;color:var(--gray-600);max-width:200px;overflow:hidden;text-overflow:ellipsis\">" + htmlEscape(_0x1fec1b.openid) + "</td><td style=\"padding:10px\">" + htmlEscape(_0x1fec1b.nickname || "-") + "</td><td style=\"padding:10px;text-align:center\"><button class=\"btn btn-sm btn-danger\" onclick=\"removeModerator('" + _0x1fec1b.openid + "')\" style=\"background:var(--red-500);color:#fff;border:none\">移除权限</button></td></tr>";
    }).join(""), "</table>"].join("") : "<div style=\"text-align:center;padding:32px;color:var(--gray-400)\">暂无管理员</div>", "</div>"].join("");
  }).catch(function (_0x3ae886) {
    _0x28bd82.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--red-500)\">❌ 加载失败: " + (_0x3ae886.message || "未知错误") + "</div>";
  });
}
async function grantModerator() {
  var _0x380e7a = document.getElementById("mod-target-select");
  var _0x1c231c = _0x380e7a?.value;
  if (!_0x1c231c) {
    toast("请从下拉列表中选择一个用户", "error");
    return;
  }
  var _0x3fd11c = await apiFetch("/api/admin/set-moderator", {
    method: "POST",
    body: JSON.stringify({
      targetOpenid: _0x1c231c
    })
  });
  toast(_0x3fd11c.msg || (_0x3fd11c.success ? "已授予" : "操作失败"), _0x3fd11c.success ? "success" : "error");
  if (_0x3fd11c.success) {
    renderAdminModerators(document.getElementById("admin-content"));
  }
}
async function renderAdminWechatReply(_0x36c67f) {
  if (!isSuperAdmin()) {
    return;
  }
  const _0x2d0c07 = document.createElement("div");
  const _0x1b53ad = document.createElement("div");
  const _0x2ad28c = document.createElement("div");
  const _0x1553df = document.createElement("div");
  _0x2d0c07.style.display = "grid";
  _0x2d0c07.style.gap = "20px";
  _0x2d0c07.append(_0x1b53ad, _0x2ad28c, _0x1553df);
  _0x36c67f.replaceChildren(_0x2d0c07);
  await Promise.all([renderAdminWechatReplyForm(_0x1b53ad, "follow"), renderAdminWechatReplyForm(_0x2ad28c, "scan"), renderAdminWechatKeywords(_0x1553df)]);
}
async function renderAdminWechatReplyForm(_0x28a51f, _0x4c8c5c = "follow") {
  if (!isSuperAdmin()) {
    return;
  }
  const _0x47b14d = _0x4c8c5c === "scan";
  const _0x28288b = _0x47b14d ? "/api/admin/wechat-scan-reply" : "/api/admin/wechat-reply";
  const _0x2b784f = _0x47b14d ? "已关注用户扫码回复" : "关注后回复";
  const _0x2b35b7 = _0x47b14d ? "已保存，下次扫码即生效；留空时不发送消息。" : "已保存，下次关注即生效。";
  const _0x283b09 = document.createElement("section");
  _0x28a51f.replaceChildren(_0x283b09);
  _0x283b09.innerHTML = "\n    <div style=\"max-width:850px;background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">\n      <h3 style=\"font-size:18px;margin-bottom:8px\">" + _0x2b784f + "</h3>\n      <p style=\"font-size:13px;color:var(--gray-500);line-height:1.7;margin-bottom:20px\">" + (_0x47b14d ? "用户已关注公众号，再次扫码时发送。可提醒最近更新的课件及查找入口；每次新的扫码都会使用当前文案。留空时不发送消息。" : "用户关注公众号时发送，包括扫码后关注。与已关注用户的扫码回复分别设置。") + "保存后生效，无需重新部署。</p>\n      <form data-wechat-reply-form>\n        <label style=\"display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:18px\">\n          <input type=\"checkbox\" data-wechat-reply-enabled disabled>" + (_0x47b14d ? "开启已关注用户扫码回复" : "开启关注后自动回复") + "\n        </label>\n        <label class=\"form-label\" for=\"wechat-" + _0x4c8c5c + "-reply-content\">" + (_0x47b14d ? "扫码欢迎语或更新提醒（可留空）" : "欢迎语") + "</label>\n        <textarea id=\"wechat-" + _0x4c8c5c + "-reply-content\" data-wechat-reply-content class=\"form-input\" rows=\"8\" disabled\n          placeholder=\"" + (_0x47b14d ? "可填写新课件介绍、查找方法和链接；留空则不发送消息。" : "欢迎关注「图灵智赋」👋&#10;&#10;在这里发现教学课件与 AI 教学工具。") + "\" style=\"width:100%;resize:vertical;min-height:180px\"></textarea>\n        <p data-wechat-reply-count style=\"font-size:12px;color:var(--gray-500);margin:8px 0\"></p>\n        <p style=\"font-size:12px;color:var(--gray-500);line-height:1.7;margin-bottom:18px\">支持中文、Emoji、链接和换行。" + (_0x47b14d ? "留空或关闭时不发送扫码回复。" : "关闭时不发送关注欢迎语。") + "关闭开关会保留文案，原扫码登录流程仍正常运行。</p>\n        <div style=\"background:#ededed;border-radius:10px;padding:18px;margin-bottom:20px\">\n          <div style=\"font-size:12px;color:#777;margin-bottom:10px\">聊天气泡预览</div>\n          <div style=\"display:flex;gap:10px;align-items:flex-start\">\n            <div aria-hidden=\"true\" style=\"width:36px;height:36px;flex-shrink:0;background:#07c160;border-radius:6px;color:#fff;display:grid;place-items:center\">图</div>\n            <div data-wechat-reply-preview style=\"background:#fff;border-radius:7px;padding:10px 14px;white-space:pre-wrap;overflow-wrap:anywhere;min-height:40px;font-size:14px;line-height:1.7;max-width:calc(100% - 46px)\"></div>\n          </div>\n          <p data-wechat-reply-preview-note style=\"font-size:12px;color:#777;margin:10px 0 0\"></p>\n        </div>\n        <button type=\"submit\" class=\"btn btn-primary\" data-wechat-reply-save disabled>保存</button>\n        <button type=\"button\" class=\"btn btn-outline\" data-wechat-reply-retry style=\"display:none\">重新加载</button>\n        <p data-wechat-reply-status role=\"status\" aria-live=\"polite\" style=\"font-size:13px;margin-top:12px;color:var(--gray-500)\">正在读取配置…</p>\n      </form>\n    </div>";
  const _0x1b5919 = _0x283b09.querySelector("[data-wechat-reply-form]");
  const _0x319a3d = _0x283b09.querySelector("[data-wechat-reply-enabled]");
  const _0xc1c861 = _0x283b09.querySelector("[data-wechat-reply-content]");
  const _0xbc0ee = _0x283b09.querySelector("[data-wechat-reply-preview]");
  const _0x20361d = _0x283b09.querySelector("[data-wechat-reply-preview-note]");
  const _0x4a77a5 = _0x283b09.querySelector("[data-wechat-reply-count]");
  const _0x2b3909 = _0x283b09.querySelector("[data-wechat-reply-save]");
  const _0x1c0f87 = _0x283b09.querySelector("[data-wechat-reply-retry]");
  const _0x588dd7 = _0x283b09.querySelector("[data-wechat-reply-status]");
  let _0xf4ee4b = {
    characters: 600,
    bytes: 2048
  };
  let _0x52beb4 = false;
  let _0x163e76 = false;
  function updatePreview() {
    const _0x3e1de6 = _0xc1c861.value.replace(/\r\n?/g, "\n");
    const _0x72057f = Array.from(_0x3e1de6).length;
    const _0x173786 = new TextEncoder().encode(_0x3e1de6).length;
    const _0x51d2b7 = _0x72057f > _0xf4ee4b.characters || _0x173786 > _0xf4ee4b.bytes;
    _0xbc0ee.textContent = _0x3e1de6.trim() ? _0x3e1de6 : _0x47b14d ? "已留空，不发送扫码回复" : "欢迎语将在这里预览";
    _0x20361d.textContent = !_0x319a3d.checked ? "自动回复已关闭；上方仅预览保存的文案。" : _0x47b14d && !_0x3e1de6.trim() ? "留空时保持安静，不影响扫码登录。" : (_0x47b14d ? "已关注用户再次扫码" : "用户关注") + "时将收到上方文案。实际显示以微信客户端为准。";
    _0x4a77a5.textContent = "当前 " + _0x72057f + "/" + _0xf4ee4b.characters + " 个字符 · " + _0x173786 + "/" + _0xf4ee4b.bytes + " 个 UTF-8 字节（本编辑器的保守上限）";
    _0x4a77a5.style.color = _0x51d2b7 ? "var(--red-500)" : "var(--gray-500)";
    _0x2b3909.disabled = !_0x52beb4 || _0x163e76 || _0x51d2b7 || !_0x47b14d && _0x319a3d.checked && !_0x3e1de6.trim();
  }
  _0xc1c861.addEventListener("input", () => {
    updatePreview();
    _0x588dd7.textContent = "有未保存的修改";
  });
  _0x319a3d.addEventListener("change", () => {
    updatePreview();
    _0x588dd7.textContent = "有未保存的修改";
  });
  _0x1c0f87.addEventListener("click", () => renderAdminWechatReplyForm(_0x28a51f, _0x4c8c5c));
  _0x1b5919.addEventListener("submit", async _0x522b11 => {
    _0x522b11.preventDefault();
    updatePreview();
    if (_0x2b3909.disabled) {
      return;
    }
    _0x163e76 = true;
    _0x319a3d.disabled = _0xc1c861.disabled = true;
    updatePreview();
    _0x588dd7.textContent = "正在保存…";
    try {
      const _0x501eed = await apiFetch(_0x28288b, {
        method: "PUT",
        body: JSON.stringify({
          enabled: _0x319a3d.checked,
          content: _0xc1c861.value
        })
      });
      if (!_0x283b09.isConnected) {
        return;
      }
      if (!_0x501eed.success) {
        throw new Error(_0x501eed.msg || "保存失败，请稍后重试");
      }
      _0xc1c861.value = _0x501eed.settings.content;
      _0x319a3d.checked = _0x501eed.settings.enabled;
      _0x588dd7.textContent = _0x2b35b7;
      toast(_0x2b784f + "已保存", "success");
    } catch (_0x361699) {
      if (_0x283b09.isConnected) {
        _0x588dd7.textContent = _0x361699.message || "保存失败，请稍后重试";
        toast(_0x588dd7.textContent, "error");
      }
    } finally {
      _0x163e76 = false;
      _0x319a3d.disabled = _0xc1c861.disabled = false;
      updatePreview();
    }
  });
  updatePreview();
  try {
    const _0x393906 = await apiFetch(_0x28288b);
    if (!_0x283b09.isConnected) {
      return;
    }
    if (!_0x393906.success) {
      throw new Error(_0x393906.msg || "配置读取失败，请稍后重试");
    }
    _0xf4ee4b = _0x393906.limits;
    _0x319a3d.checked = _0x393906.settings.enabled;
    _0xc1c861.value = _0x393906.settings.content;
    _0x52beb4 = true;
    _0x319a3d.disabled = _0xc1c861.disabled = false;
    _0x588dd7.textContent = "修改后请点击保存。";
    updatePreview();
  } catch (_0x1c5393) {
    if (_0x283b09.isConnected) {
      _0x588dd7.textContent = _0x1c5393.message || "配置读取失败，请稍后重试";
      _0x1c0f87.style.display = "";
    }
  }
}
async function renderAdminWechatKeywords(_0x4386fd) {
  if (!isSuperAdmin()) {
    return;
  }
  const _0x3cbdce = document.createElement("section");
  _0x4386fd.replaceChildren(_0x3cbdce);
  _0x3cbdce.innerHTML = "\n    <div style=\"max-width:850px;background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">\n      <h3 style=\"font-size:18px;margin-bottom:8px\">关键词自动回复</h3>\n      <p style=\"font-size:13px;color:var(--gray-500);line-height:1.7;margin-bottom:18px\">用户发送文字时，从上往下匹配规则，只回复第一条命中的内容；没有命中则不回复。建议将更具体的规则排在前面。保存后下一条新消息即生效。</p>\n      <form data-keyword-form>\n        <label style=\"display:flex;gap:8px;align-items:center;margin-bottom:16px\"><input type=\"checkbox\" data-keyword-enabled disabled>开启关键词自动回复</label>\n        <div data-keyword-rules style=\"display:grid;gap:16px\"></div>\n        <p data-keyword-count style=\"font-size:12px;color:var(--gray-500);margin:12px 0\"></p>\n        <button type=\"button\" class=\"btn btn-outline\" data-keyword-add disabled>新增规则</button>\n        <button type=\"submit\" class=\"btn btn-primary\" data-keyword-save disabled>保存关键词设置</button>\n        <button type=\"button\" class=\"btn btn-outline\" data-keyword-retry style=\"display:none\">重新加载</button>\n        <p data-keyword-status role=\"status\" aria-live=\"polite\" style=\"font-size:13px;margin-top:12px;color:var(--gray-500)\">正在读取配置…</p>\n      </form>\n    </div>";
  const _0x39c601 = _0x598cdb => _0x3cbdce.querySelector("[data-keyword-" + _0x598cdb + "]");
  const _0xf0780c = _0x39c601("enabled");
  const _0x1d141a = _0x39c601("rules");
  const _0x271d89 = _0x39c601("count");
  const _0x17ebf4 = _0x39c601("add");
  const _0x5a5cda = _0x39c601("save");
  const _0x22cedf = _0x39c601("status");
  const _0x417729 = _0x39c601("retry");
  let _0x3ee094 = {
    characters: 600,
    bytes: 2048,
    rules: 20,
    keywords: 10,
    keywordCharacters: 50,
    nameCharacters: 40
  };
  let _0x53571b = [];
  let _0x4ad800 = false;
  let _0x2f41a5 = false;
  const _0xff6d76 = _0x45b78f => _0x45b78f.split(/\r?\n/).map(_0x46f913 => _0x46f913.trim()).filter(Boolean);
  function draft() {
    return {
      enabled: _0xf0780c.checked,
      rules: _0x53571b.map(_0x4b438c => ({
        name: _0x4b438c.name.value,
        enabled: _0x4b438c.enabled.checked,
        match: _0x4b438c.match.value,
        keywords: _0xff6d76(_0x4b438c.keywords.value),
        content: _0x4b438c.content.value
      }))
    };
  }
  function updateState() {
    const _0x2d86db = draft();
    let _0x1241c7 = "";
    _0x53571b.forEach((_0x46dfc9, _0x48d99d) => {
      const _0x1440aa = _0x2d86db.rules[_0x48d99d];
      const _0x291387 = _0x1440aa.content.replace(/\r\n?/g, "\n");
      const _0x49f557 = Array.from(_0x291387).length;
      const _0x2b36ec = new TextEncoder().encode(_0x291387).length;
      _0x46dfc9.preview.textContent = _0x291387 || "回复内容将在这里预览";
      _0x46dfc9.count.textContent = _0x49f557 + "/" + _0x3ee094.characters + " 个字符 · " + _0x2b36ec + "/" + _0x3ee094.bytes + " 个 UTF-8 字节";
      if (!_0x1241c7 && (!_0x1440aa.keywords.length || _0x1440aa.keywords.length > _0x3ee094.keywords || _0x1440aa.keywords.some(_0x35d9d0 => Array.from(_0x35d9d0).length > _0x3ee094.keywordCharacters))) {
        _0x1241c7 = "规则" + (_0x48d99d + 1) + "：请填写1至" + _0x3ee094.keywords + "个关键词，每个最多" + _0x3ee094.keywordCharacters + "个字符。";
      }
      if (!_0x1241c7 && Array.from(_0x1440aa.name.trim()).length > _0x3ee094.nameCharacters) {
        _0x1241c7 = "规则" + (_0x48d99d + 1) + "：名称最多" + _0x3ee094.nameCharacters + "个字符。";
      }
      if (!_0x1241c7 && (!_0x291387.trim() || _0x49f557 > _0x3ee094.characters || _0x2b36ec > _0x3ee094.bytes)) {
        _0x1241c7 = "规则" + (_0x48d99d + 1) + "：请填写回复内容，并保持在字符和字节上限内。";
      }
      for (const _0x2d2f7f of [_0x46dfc9.name, _0x46dfc9.enabled, _0x46dfc9.match, _0x46dfc9.keywords, _0x46dfc9.content, _0x46dfc9.remove]) {
        _0x2d2f7f.disabled = !_0x4ad800 || _0x2f41a5;
      }
      _0x46dfc9.up.disabled = !_0x4ad800 || _0x2f41a5 || _0x48d99d === 0;
      _0x46dfc9.down.disabled = !_0x4ad800 || _0x2f41a5 || _0x48d99d === _0x53571b.length - 1;
    });
    _0xf0780c.disabled = !_0x4ad800 || _0x2f41a5;
    _0x17ebf4.disabled = !_0x4ad800 || _0x2f41a5 || _0x53571b.length >= _0x3ee094.rules;
    _0x5a5cda.disabled = !_0x4ad800 || _0x2f41a5 || !!_0x1241c7;
    _0x271d89.textContent = _0x1241c7 || "共 " + _0x53571b.length + "/" + _0x3ee094.rules + " 条规则；每条规则的任意一个关键词命中即可。忽略英文字母大小写及首尾空格。";
  }
  function changed() {
    updateState();
    _0x22cedf.textContent = "有未保存的修改";
  }
  function renderRules(_0x5eea07) {
    _0x1d141a.replaceChildren();
    _0x53571b = [];
    _0x5eea07.forEach((_0x158101, _0x4f7124) => {
      const _0x59e183 = document.createElement("article");
      _0x59e183.innerHTML = "\n        <div style=\"border:1px solid var(--gray-200);border-radius:10px;padding:16px\">\n          <div style=\"display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px\">\n            <strong>规则 " + (_0x4f7124 + 1) + "</strong><label><input type=\"checkbox\" data-rule-enabled>启用</label>\n            <button type=\"button\" class=\"btn btn-sm\" data-rule-up>上移</button><button type=\"button\" class=\"btn btn-sm\" data-rule-down>下移</button><button type=\"button\" class=\"btn btn-sm\" data-rule-remove>删除</button>\n          </div>\n          <label class=\"form-label\">规则名称（可选）<input data-rule-name class=\"form-input\" placeholder=\"例如：课件查找\" style=\"width:100%\"></label>\n          <label class=\"form-label\">匹配方式<select data-rule-match class=\"form-input\"><option value=\"contains\">包含关键词</option><option value=\"exact\">完全匹配</option></select></label>\n          <label class=\"form-label\">关键词（每行一个）<textarea data-rule-keywords class=\"form-input\" rows=\"3\" placeholder=\"课件&#10;资源\" style=\"width:100%;resize:vertical\"></textarea></label>\n          <label class=\"form-label\">回复内容<textarea data-rule-content class=\"form-input\" rows=\"4\" placeholder=\"填写该问题的答复，可包含链接和换行\" style=\"width:100%;resize:vertical\"></textarea></label>\n          <p data-rule-count style=\"font-size:12px;color:var(--gray-500);margin:8px 0\"></p>\n          <div data-rule-preview style=\"white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f4f6;border-radius:8px;padding:12px;font-size:14px;line-height:1.7\"></div>\n        </div>";
      const _0x211860 = {};
      for (const _0x57b73c of ["enabled", "name", "match", "keywords", "content", "count", "preview", "up", "down", "remove"]) {
        _0x211860[_0x57b73c] = _0x59e183.querySelector("[data-rule-" + _0x57b73c + "]");
      }
      _0x211860.enabled.checked = _0x158101.enabled;
      _0x211860.name.value = _0x158101.name;
      _0x211860.match.value = _0x158101.match;
      _0x211860.keywords.value = _0x158101.keywords.join("\n");
      _0x211860.content.value = _0x158101.content;
      for (const _0x2edc78 of [_0x211860.name, _0x211860.keywords, _0x211860.content]) {
        _0x2edc78.addEventListener("input", changed);
      }
      for (const _0x15318e of [_0x211860.enabled, _0x211860.match]) {
        _0x15318e.addEventListener("change", changed);
      }
      function move(_0x3ffb0e) {
        if (!_0x4ad800 || _0x2f41a5) {
          return;
        }
        const _0x18230c = draft().rules;
        const _0x52d4e0 = _0x4f7124 + _0x3ffb0e;
        if (_0x52d4e0 < 0 || _0x52d4e0 >= _0x18230c.length) {
          return;
        }
        [_0x18230c[_0x4f7124], _0x18230c[_0x52d4e0]] = [_0x18230c[_0x52d4e0], _0x18230c[_0x4f7124]];
        renderRules(_0x18230c);
        changed();
      }
      _0x211860.up.addEventListener("click", () => move(-1));
      _0x211860.down.addEventListener("click", () => move(1));
      _0x211860.remove.addEventListener("click", () => {
        if (!_0x4ad800 || _0x2f41a5) {
          return;
        }
        const _0x1b0765 = draft().rules;
        _0x1b0765.splice(_0x4f7124, 1);
        renderRules(_0x1b0765);
        changed();
      });
      _0x53571b.push(_0x211860);
      _0x1d141a.append(_0x59e183);
    });
    updateState();
  }
  _0xf0780c.addEventListener("change", changed);
  _0x17ebf4.addEventListener("click", () => {
    if (_0x17ebf4.disabled) {
      return;
    }
    const _0x2b6085 = draft().rules;
    _0x2b6085.push({
      name: "",
      enabled: true,
      match: "contains",
      keywords: [],
      content: ""
    });
    renderRules(_0x2b6085);
    changed();
  });
  _0x417729.addEventListener("click", () => renderAdminWechatKeywords(_0x4386fd));
  _0x39c601("form").addEventListener("submit", async _0x190860 => {
    _0x190860.preventDefault();
    updateState();
    if (_0x5a5cda.disabled) {
      return;
    }
    const _0x5cde97 = draft();
    _0x2f41a5 = true;
    updateState();
    _0x22cedf.textContent = "正在保存…";
    try {
      const _0x50f0f7 = await apiFetch("/api/admin/wechat-keyword-reply", {
        method: "PUT",
        body: JSON.stringify(_0x5cde97)
      });
      if (!_0x3cbdce.isConnected) {
        return;
      }
      if (!_0x50f0f7.success) {
        throw Error(_0x50f0f7.msg || "保存失败，请稍后重试");
      }
      _0xf0780c.checked = _0x50f0f7.settings.enabled;
      renderRules(_0x50f0f7.settings.rules);
      _0x22cedf.textContent = "已保存，下一条新文字消息即生效。";
      toast("关键词回复已保存", "success");
    } catch (_0x5c63c9) {
      if (_0x3cbdce.isConnected) {
        _0x22cedf.textContent = _0x5c63c9.message || "保存失败，请稍后重试";
        toast(_0x22cedf.textContent, "error");
      }
    } finally {
      _0x2f41a5 = false;
      updateState();
    }
  });
  updateState();
  try {
    const _0x56bd7a = await apiFetch("/api/admin/wechat-keyword-reply");
    if (!_0x3cbdce.isConnected) {
      return;
    }
    if (!_0x56bd7a.success) {
      throw Error(_0x56bd7a.msg || "配置读取失败，请稍后重试");
    }
    _0x3ee094 = _0x56bd7a.limits;
    _0xf0780c.checked = _0x56bd7a.settings.enabled;
    _0x4ad800 = true;
    renderRules(_0x56bd7a.settings.rules);
    _0x22cedf.textContent = "修改后请点击保存关键词设置。";
  } catch (_0x10ec03) {
    if (_0x3cbdce.isConnected) {
      _0x22cedf.textContent = _0x10ec03.message || "配置读取失败，请稍后重试";
      _0x417729.style.display = "";
    }
  }
}
async function renderAdminPoints(_0x478ff6) {
  try {
    var _0x57a98b = await apiFetch("/api/points/top-users");
    var _0x53dbb5 = _0x57a98b;
    var _0x3eb474 = (_0x53dbb5.users || []).filter(function (_0xa52370) {
      return _0xa52370.openid;
    });
    _0x478ff6.innerHTML = ["<div style=\"max-width:800px\">", "<div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">", "<h3 style=\"font-size:16px;margin-bottom:16px\">🏆 用户积分排行</h3>", "<div style=\"margin-bottom:16px;display:flex;gap:8px\">", "<input id=\"points-search-input\" placeholder=\"搜索用户 openid/昵称...\" style=\"flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px\">", "<button class=\"btn btn-sm\" onclick=\"searchPointsUser()\" style=\"background:var(--blue-500);color:#fff;border:none\">搜索</button>", "</div>", "<div id=\"points-adjust-area\" style=\"background:var(--gray-50);border-radius:8px;padding:16px;margin-bottom:16px;display:none\">", "<div style=\"font-size:13px;font-weight:600;margin-bottom:8px\">🎯 积分调整</div>", "<div id=\"points-target-info\" style=\"font-size:12px;color:var(--gray-600);margin-bottom:8px\"></div>", "<div style=\"display:flex;gap:8px\">", "<input id=\"points-adjust-input\" type=\"number\" placeholder=\"正数=增加，负数=扣除\" style=\"flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px\">", "<input id=\"points-adjust-remark\" placeholder=\"备注（可选）\" style=\"flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px\">", "<button class=\"btn btn-sm btn-primary\" onclick=\"executePointsAdjust()\">执行</button>", "</div>", "</div>", "<div id=\"points-top-list\" style=\"max-height:500px;overflow-y:auto\">", "<table style=\"width:100%;border-collapse:collapse;font-size:13px\">", "<thead><tr style=\"background:var(--gray-50);border-bottom:1px solid var(--gray-200)\">", "<th style=\"padding:8px;text-align:left\">#</th>", "<th style=\"padding:8px;text-align:left\">用户</th>", "<th style=\"padding:8px;text-align:right\">积分</th>", "<th style=\"padding:8px;text-align:center\">操作</th>", "</tr></thead><tbody>" + _0x3eb474.map(function (_0x197b2a, _0x3bcba) {
      var _0x4fb354 = _0x197b2a.nickname || _0x197b2a.openid.substring(0, 12);
      return "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:8px;color:var(--gray-400);font-size:12px\">" + (_0x3bcba + 1) + "</td><td style=\"padding:8px\">" + htmlEscape(_0x4fb354) + "<br><small style=\"color:var(--gray-400);font-size:11px\">" + htmlEscape(_0x197b2a.openid) + "</small></td><td style=\"padding:8px;text-align:right;font-weight:600;color:var(--amber-600)\">" + (_0x197b2a.points || 0) + "</td><td style=\"padding:8px;text-align:center\"><button class=\"btn btn-xs\" style=\"padding:4px 10px;font-size:11px;background:var(--gray-100);border:1px solid var(--gray-200);cursor:pointer\" onclick=\"openPointsAdjust('" + _0x197b2a.openid + "','" + htmlEscape(_0x4fb354).replace(/'/g, "\\'") + "'," + (_0x197b2a.points || 0) + ")\">调整</button></td></tr>";
    }).join("") + (_0x3eb474.length === 0 ? "<tr><td colspan=\"4\" style=\"padding:24px;text-align:center;color:var(--gray-400)\">暂无用户数据</td></tr>" : "") + "</tbody></table>", "</div>", "</div>", "</div>"].join("");
  } catch (_0xedb338) {
    _0x478ff6.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--red-500)\">❌ 加载失败: " + (_0xedb338.message || "未知错误") + "</div>";
  }
}
function openPointsAdjust(_0x314871, _0x11a36d, _0x15d457) {
  var _0x219e45 = document.getElementById("points-adjust-area");
  var _0xde789d = document.getElementById("points-target-info");
  var _0x2ee238 = document.getElementById("points-adjust-input");
  var _0x1fbef7 = document.getElementById("points-adjust-remark");
  if (_0x219e45 && _0xde789d) {
    _0x219e45.style.display = "block";
    _0xde789d.innerHTML = "目标: <strong>" + htmlEscape(_0x11a36d) + "</strong> (openid: " + htmlEscape(_0x314871) + ") · 当前积分: <strong>" + _0x15d457 + "</strong>";
    _0x219e45.dataset.openid = _0x314871;
    if (_0x2ee238) {
      _0x2ee238.value = "";
      _0x2ee238.focus();
    }
    if (_0x1fbef7) {
      _0x1fbef7.value = "";
    }
  }
}
async function executePointsAdjust() {
  var _0x3020c9 = document.getElementById("points-adjust-area");
  var _0x37d8d7 = document.getElementById("points-adjust-input");
  var _0x42f8e2 = document.getElementById("points-adjust-remark");
  if (!_0x3020c9 || !_0x37d8d7) {
    return;
  }
  var _0x78626b = _0x3020c9.dataset.openid;
  var _0x556651 = parseInt(_0x37d8d7.value);
  if (!_0x556651 || _0x556651 === 0) {
    toast("请输入有效的积分数值", "error");
    return;
  }
  var _0x24603b = _0x42f8e2 ? _0x42f8e2.value : "";
  try {
    var _0x33eef9 = await apiFetch("/api/admin/points/adjust", {
      method: "POST",
      body: JSON.stringify({
        openid: _0x78626b,
        points: _0x556651,
        remark: _0x24603b
      })
    });
    var _0x1e16c6 = _0x33eef9;
    if (_0x1e16c6.success) {
      toast("调整成功 ✅ 当前积分: " + _0x1e16c6.points, "success");
      _0x3020c9.style.display = "none";
      renderAdminPoints(document.getElementById("admin-content"));
    } else {
      toast(_0x1e16c6.msg || "调整失败", "error");
    }
  } catch (_0x235861) {
    toast("网络异常", "error");
  }
}
async function searchPointsUser() {
  var _0xd29e7 = document.getElementById("points-search-input")?.value || "";
  try {
    var _0x37ceea = await apiFetch("/api/admin/points/search?keyword=" + encodeURIComponent(_0xd29e7));
    var _0x3b5ff1 = _0x37ceea;
    var _0xfe6595 = document.getElementById("points-top-list");
    if (!_0xfe6595) {
      return;
    }
    var _0xf05828 = _0x3b5ff1.users || [];
    _0xfe6595.innerHTML = ["<table style=\"width:100%;border-collapse:collapse;font-size:13px\">", "<thead><tr style=\"background:var(--gray-50);border-bottom:1px solid var(--gray-200)\">", "<th style=\"padding:8px;text-align:left\">#</th>", "<th style=\"padding:8px;text-align:left\">用户</th>", "<th style=\"padding:8px;text-align:right\">积分</th>", "<th style=\"padding:8px;text-align:center\">操作</th>", "</tr></thead><tbody>" + _0xf05828.map(function (_0x5032f8, _0x4670eb) {
      var _0x1bae5e = _0x5032f8.nickname || _0x5032f8.openid.substring(0, 12);
      return "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:8px;color:var(--gray-400);font-size:12px\">" + (_0x4670eb + 1) + "</td><td style=\"padding:8px\">" + htmlEscape(_0x1bae5e) + "<br><small style=\"color:var(--gray-400);font-size:11px\">" + htmlEscape(_0x5032f8.openid) + "</small></td><td style=\"padding:8px;text-align:right;font-weight:600;color:var(--amber-600)\">" + (_0x5032f8.points || 0) + "</td><td style=\"padding:8px;text-align:center\"><button class=\"btn btn-xs\" style=\"padding:4px 10px;font-size:11px;background:var(--gray-100);border:1px solid var(--gray-200);cursor:pointer\" onclick=\"openPointsAdjust('" + _0x5032f8.openid + "','" + htmlEscape(_0x1bae5e).replace(/'/g, "\\'") + "'," + (_0x5032f8.points || 0) + ")\">调整</button></td></tr>";
    }).join("") + "</tbody></table>"].join("");
  } catch (_0x2e7173) {}
}
async function removeModerator(_0x17b81a) {
  if (!confirm("确定要移除 " + _0x17b81a + " 的管理权限吗？")) {
    return;
  }
  const _0x39440f = await apiFetch("/api/admin/remove-moderator", {
    method: "POST",
    body: JSON.stringify({
      targetOpenid: _0x17b81a
    })
  });
  toast(_0x39440f.msg || (_0x39440f.success ? "已移除" : "操作失败"), _0x39440f.success ? "success" : "error");
  if (_0x39440f.success) {
    renderAdminModerators(document.getElementById("admin-content"));
  }
}
async function adminTrashPermanentDelete(_0x42d7f9) {
  if (!confirm("确定要永久删除此作品记录吗？已有交易的作品不能直接删除；源文件会保留供管理员核查。")) {
    return;
  }
  const _0x3ecf04 = await apiFetch("/api/programs/trash-delete", {
    method: "POST",
    body: JSON.stringify({
      id: _0x42d7f9
    })
  });
  if (!_0x3ecf04.success) {
    toast(_0x3ecf04.msg || "删除失败，请稍后重试", "error");
    return;
  }
  toast("作品已永久删除", "success");
  await loadProgramsFromDatabase();
  switchAdminTab(document.querySelector(".dash-tab.active"), "trash");
}
function renderAdminAnnounce() {
  return "<div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\"><h3 style=\"font-size:16px;font-weight:700;margin-bottom:16px;color:var(--gray-800)\">📢 首页公告管理</h3><p style=\"font-size:13px;color:var(--gray-500);margin-bottom:16px\">编辑首页公告栏内容，保存后所有用户立即可见。</p><textarea id=\"admin-announce-input\" rows=\"4\" style=\"width:100%;padding:12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:14px;font-family:var(--font-sans);resize:vertical;line-height:1.6\" placeholder=\"输入公告内容...\"></textarea><div style=\"display:flex;gap:10px;margin-top:12px\"><button class=\"btn btn-primary\" onclick=\"saveAnnouncement()\">保存并发布</button><button class=\"btn btn-outline\" onclick=\"document.getElementById('admin-announce-input').value='';saveAnnouncement()\">清空公告</button></div><div style=\"margin-top:16px;padding:16px;background:var(--gray-50);border-radius:8px\"><div style=\"font-size:12px;color:var(--gray-400);margin-bottom:8px\">预览效果：</div><div class=\"announce-inner\" style=\"margin:0\"><div class=\"announce-icon\">📢</div><div class=\"announce-text\" id=\"admin-announce-preview\">加载中...</div></div></div></div>";
}
async function loadCurrentAnnouncement() {
  try {
    const _0x9c7b7 = await fetch(API_BASE + "/api/announcement");
    const _0x9b958d = await _0x9c7b7.json();
    const _0x33ee83 = document.getElementById("admin-announce-input");
    const _0x34886e = document.getElementById("admin-announce-preview");
    if (_0x33ee83) {
      _0x33ee83.value = _0x9b958d.announcement || "";
    }
    if (_0x34886e) {
      _0x34886e.textContent = _0x9b958d.announcement || "（暂无公告）";
    }
    if (_0x33ee83) {
      _0x33ee83.addEventListener("input", () => {
        if (_0x34886e) {
          _0x34886e.textContent = _0x33ee83.value || "（暂无公告）";
        }
      });
    }
  } catch (_0x1d8895) {}
}
async function saveAnnouncement() {
  const _0x397b66 = document.getElementById("admin-announce-input")?.value || "";
  try {
    const _0x71623c = await apiFetch("/api/announcement/admin", {
      method: "POST",
      body: JSON.stringify({
        content: _0x397b66
      })
    });
    if (_0x71623c.success) {
      toast(_0x397b66 ? "公告已发布" : "公告已清空", "success");
    } else {
      toast("保存失败", "error");
    }
  } catch (_0x3fcc24) {
    toast("网络错误", "error");
  }
}
function adminPreviewProgram(_0x2b4175) {
  var _0x27e99f = PROGRAMS_ALL.find(function (_0x4c063e) {
    return _0x4c063e.id === _0x2b4175;
  });
  if (!_0x27e99f) {
    return toast("程序数据未加载，请先切换到「作品调度」标签", "error");
  }
  var _0x523a98 = {
    0: "⏳ 待审核",
    1: "✅ 已上架",
    2: "⬇️ 已下架",
    3: "❌ 已驳回",
    5: "📝 草稿"
  };
  var _0x343848 = typeof _0x27e99f.status === "number" ? _0x27e99f.status : 0;
  var _0x4dea3c = _0x523a98[_0x343848] || _0x523a98[0];
  var _0xaa358f = _0x343848 === 1 ? "var(--green-600)" : _0x343848 === 2 ? "var(--amber-600)" : _0x343848 === 3 ? "var(--red-500)" : "var(--gray-500)";
  var _0x415a96 = document.createElement("div");
  _0x415a96.className = "admin-preview-overlay";
  _0x415a96.style.cssText = "position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s";
  var _0x1d2084 = _0x27e99f.cover_url ? "<img src=\"" + API_BASE + _0x27e99f.cover_url + "\" style=\"width:100%;height:100%;object-fit:cover;border-radius:12px\">" : "<div style=\"font-size:72px;line-height:1\">" + (_0x27e99f.emoji || "📦") + "</div>";
  _0x415a96.innerHTML = ["<div style=\"background:#fff;border-radius:16px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:adminCardIn .3s ease\">", "<div style=\"position:relative;height:200px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:16px 16px 0 0\">", _0x1d2084, "<div style=\"position:absolute;bottom:12px;left:16px\"><span style=\"display:inline-block;padding:4px 14px;border-radius:50px;font-size:12px;font-weight:600;color:#fff;background:" + _0xaa358f + ";backdrop-filter:blur(4px)\">" + _0x4dea3c + "</span></div>", "</div>", "<div style=\"padding:20px 24px\">", "<div style=\"display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px\">", "<div style=\"flex:1;min-width:0\">", "<h2 style=\"margin:0;font-size:18px;font-weight:700;color:var(--gray-900);line-height:1.3\">" + (_0x27e99f.emoji || "") + " " + htmlEscape(_0x27e99f.title || "") + "</h2>", "<div style=\"margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--gray-500)\">", "<span>👤 " + htmlEscape(_0x27e99f.author || "未知") + "</span>", _0x27e99f.subject ? "<span>📚 " + htmlEscape(_0x27e99f.subject) + "</span>" : "", _0x27e99f.grade ? "<span>🎯 " + htmlEscape(_0x27e99f.grade_level || _0x27e99f.grade) + "</span>" : "", _0x27e99f.type ? "<span>🏷️ " + htmlEscape(_0x27e99f.type) + "</span>" : "", "<span>📅 " + (_0x27e99f.created_at || "-") + "</span>", "</div>", "</div>", "<div style=\"text-align:right;flex-shrink:0\">", "<div style=\"font-size:24px;font-weight:700;color:var(--blue-600)\">¥" + (typeof _0x27e99f.price === "number" ? _0x27e99f.price.toFixed(1) : "0") + "</div>", "<div style=\"font-size:11px;color:var(--gray-400);margin-top:2px\">使用 " + (_0x27e99f.uses || 0) + " · 点击 " + (_0x27e99f.clicks || 0) + "</div>", "</div>", "</div>", _0x27e99f.desc ? "<div style=\"background:var(--gray-50);border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:var(--gray-700);line-height:1.6;word-break:break-word\">" + _0x27e99f.desc + "</div>" : "", renderDescImagesGalleryForAdmin(_0x27e99f.desc_images), renderAdminVideoPanel(_0x27e99f), _0x27e99f.has_attachment || _0x27e99f.attachment_url ? ["<div style=\"margin-bottom:16px;padding:14px 16px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px\">", "<div style=\"font-size:12px;font-weight:600;color:var(--gray-500);margin-bottom:10px\">📎 配套资源附件</div>", "<button type=\"button\" onclick=\"downloadProgramAttachment(" + Number(_0x27e99f.id) + ")\"", "style=\"display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#fff;border:1px solid var(--blue-200);border-radius:8px;color:var(--blue-600);font-size:13px;font-weight:500;text-decoration:none;box-shadow:var(--shadow-sm)\">", "<span style=\"font-size:20px\">" + ((_0x27e99f.attachment_name || "").match(/\.(zip|rar)$/i) ? "🗜️" : (_0x27e99f.attachment_name || "").match(/\.pdf$/i) ? "📄" : (_0x27e99f.attachment_name || "").match(/\.(ppt|pptx)$/i) ? "📊" : "📁") + "</span>", "<span>" + htmlEscape(_0x27e99f.attachment_name || "下载附件") + "</span>", "<span style=\"color:var(--gray-400);font-size:11px\">⬇ 点击下载</span>", "</button>", "</div>"].join("") : "", _0x27e99f.admin_feedback ? "<div style=\"background:#fef3c7;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400e;line-height:1.5\">📝 管理员反馈：" + htmlEscape(_0x27e99f.admin_feedback) + "</div>" : "", "<div style=\"display:flex;gap:10px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--gray-100)\">", "<button class=\"btn btn-primary\" onclick=\"adminStartProgramPreview(" + _0x2b4175 + ", this)\" style=\"flex:1;min-width:100px;padding:10px 18px;font-size:14px\">▶ 预览程序</button>", _0x343848 !== 1 ? "<button class=\"btn btn-sm btn-green\" onclick=\"adminApprove(" + _0x2b4175 + ");this.closest('.admin-preview-overlay').remove()\" style=\"padding:10px 18px;font-size:14px;min-width:80px\">✅ 通过</button>" : "", _0x343848 === 1 ? "<button class=\"btn btn-sm btn-amber\" onclick=\"adminDelistProgram(" + _0x2b4175 + ");this.closest('.admin-preview-overlay').remove()\" style=\"padding:10px 18px;font-size:14px;min-width:80px\">⬇️ 下架</button>" : "", _0x343848 !== 3 ? "<button class=\"btn btn-sm\" onclick=\"adminRejectProgram(" + _0x2b4175 + ");this.closest('.admin-preview-overlay').remove()\" style=\"padding:10px 18px;font-size:14px;min-width:80px;background:var(--red-500);color:#fff;border:none\">❌ 驳回</button>" : "", "<button class=\"btn btn-sm btn-outline\" onclick=\"this.closest('.admin-preview-overlay').remove()\" style=\"padding:10px 18px;font-size:14px;min-width:80px\">✕ 关闭</button>", "</div>", "</div>", "</div>"].join("");
  document.body.appendChild(_0x415a96);
  requestAnimationFrame(function () {
    _0x415a96.style.opacity = "1";
    _0x415a96.style.pointerEvents = "all";
  });
  _0x415a96.addEventListener("click", function (_0x45172c) {
    if (_0x45172c.target === _0x415a96) {
      _0x415a96.remove();
    }
  });
}
window._adminProgramVideoFiles = window._adminProgramVideoFiles || {};
function renderAdminVideoPanel(_0x17d2fe) {
  var _0x4da0c4 = _0x17d2fe.video_url ? "<div style=\"margin:8px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap\"><button class=\"btn btn-outline btn-sm\" onclick=\"openProgramVideo(" + _0x17d2fe.id + ")\">▶ 查看公开视频</button><span style=\"font-size:12px;color:var(--gray-500)\">" + htmlEscape(_0x17d2fe.video_name || "已有演示视频") + "</span></div>" : "<div style=\"font-size:12px;color:var(--gray-400);margin:8px 0\">暂无公开视频；前台会保持原封面展示。</div>";
  var _0x1ecd85 = _0x17d2fe.pending_video_url ? "<div style=\"margin:8px 0;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:12px;color:#9a3412\"><div style=\"font-weight:700;margin-bottom:4px\">待审核演示视频</div><div>" + htmlEscape(_0x17d2fe.pending_video_name || "未命名视频") + "</div><div style=\"margin-top:8px;display:flex;gap:8px;flex-wrap:wrap\"><button class=\"btn btn-green btn-sm\" onclick=\"adminApproveProgramVideo(" + _0x17d2fe.id + ")\">通过视频</button><button class=\"btn btn-sm\" style=\"background:var(--red-500);color:#fff;border:none\" onclick=\"adminRejectProgramVideo(" + _0x17d2fe.id + ")\">驳回并删除</button></div></div>" : "";
  return "<div style=\"margin-bottom:16px;padding:14px 16px;background:#f8fafc;border:1px solid var(--gray-200);border-radius:12px\"><div style=\"font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:8px\">🎬 作品演示视频</div>" + _0x4da0c4 + _0x1ecd85 + "<input type=\"file\" id=\"admin-program-video-input-" + _0x17d2fe.id + "\" accept=\"video/mp4,video/quicktime,.mp4,.mov\" style=\"display:none\" onchange=\"handleAdminProgramVideoSelect(" + _0x17d2fe.id + ", this)\"><div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:10px\"><button class=\"btn btn-outline btn-sm\" onclick=\"document.getElementById('admin-program-video-input-" + _0x17d2fe.id + "').click()\">选择视频</button><button class=\"btn btn-primary btn-sm\" onclick=\"adminUploadProgramVideo(" + _0x17d2fe.id + ")\">管理员补传/替换</button>" + (_0x17d2fe.video_url || _0x17d2fe.pending_video_url ? "<button class=\"btn btn-ghost btn-sm\" onclick=\"adminDeleteProgramVideo(" + _0x17d2fe.id + ")\">删除全部视频</button>" : "") + "</div><div id=\"admin-program-video-label-" + _0x17d2fe.id + "\" style=\"font-size:12px;color:var(--gray-400);margin-top:8px\">管理员可上传 500MB 内 MP4/MOV；替换或删除会直接清理旧视频文件。</div></div>";
}
function handleAdminProgramVideoSelect(_0x234b82, _0x3c0e65) {
  const _0x206069 = _0x3c0e65 && _0x3c0e65.files && _0x3c0e65.files[0];
  if (!_0x206069) {
    return;
  }
  if (!/\.(mp4|mov)$/i.test(_0x206069.name || "")) {
    toast("管理员视频仅支持 MP4 或 MOV", "error");
    _0x3c0e65.value = "";
    window._adminProgramVideoFiles[_0x234b82] = null;
    return;
  }
  const _0x2ef80b = 524288000;
  if (_0x206069.size > _0x2ef80b) {
    toast("管理员上传的视频不能超过 500MB", "error");
    _0x3c0e65.value = "";
    window._adminProgramVideoFiles[_0x234b82] = null;
    return;
  }
  window._adminProgramVideoFiles[_0x234b82] = _0x206069;
  var _0x5f3a36 = document.getElementById("admin-program-video-label-" + _0x234b82);
  if (_0x5f3a36) {
    _0x5f3a36.textContent = "已选择: " + _0x206069.name + " (" + (_0x206069.size / 1048576).toFixed(1) + "MB)";
  }
}
async function adminUploadProgramVideo(_0x29de0c) {
  const _0x12e8f8 = window._adminProgramVideoFiles[_0x29de0c];
  if (!_0x12e8f8) {
    return toast("请先选择演示视频文件", "error");
  }
  const _0xda0e8c = new FormData();
  _0xda0e8c.append("video", _0x12e8f8);
  const _0x37469a = await fetch(API_BASE + "/api/programs/" + encodeURIComponent(_0x29de0c) + "/admin-video", {
    method: "POST",
    headers: State.token ? {
      Authorization: "Bearer " + State.token
    } : {},
    body: _0xda0e8c
  });
  const _0xe3cf2d = await _0x37469a.json();
  if (_0xe3cf2d.success) {
    toast("演示视频已发布/替换", "success");
    window._adminProgramVideoFiles[_0x29de0c] = null;
    await loadProgramsFromDatabase();
    document.querySelector(".admin-preview-overlay")?.remove();
  } else {
    toast(_0xe3cf2d.msg || "上传失败", "error");
  }
}
async function adminApproveProgramVideo(_0x2b3e05) {
  const _0xecf923 = await apiFetch("/api/programs/" + encodeURIComponent(_0x2b3e05) + "/video-submission/approve", {
    method: "POST"
  });
  if (_0xecf923.success) {
    toast("待审演示视频已通过", "success");
    await loadProgramsFromDatabase();
    document.querySelector(".admin-preview-overlay")?.remove();
  } else {
    toast(_0xecf923.msg || "通过失败", "error");
  }
}
async function adminRejectProgramVideo(_0x185545) {
  if (!confirm("确定驳回并直接删除待审演示视频吗？")) {
    return;
  }
  const _0x2094b9 = await apiFetch("/api/programs/" + encodeURIComponent(_0x185545) + "/video-submission/reject", {
    method: "POST"
  });
  if (_0x2094b9.success) {
    toast("待审演示视频已驳回并删除", "success");
    await loadProgramsFromDatabase();
    document.querySelector(".admin-preview-overlay")?.remove();
  } else {
    toast(_0x2094b9.msg || "驳回失败", "error");
  }
}
async function adminDeleteProgramVideo(_0x56df15) {
  if (!confirm("确定删除该作品的公开视频和待审视频吗？视频文件会直接删除，不进入回收站。")) {
    return;
  }
  const _0x4d7b5a = await fetch(API_BASE + "/api/programs/" + encodeURIComponent(_0x56df15) + "/admin-video", {
    method: "DELETE",
    headers: State.token ? {
      Authorization: "Bearer " + State.token
    } : {}
  });
  const _0x23d5ad = await _0x4d7b5a.json();
  if (_0x23d5ad.success) {
    toast("演示视频已删除", "success");
    await loadProgramsFromDatabase();
    document.querySelector(".admin-preview-overlay")?.remove();
  } else {
    toast(_0x23d5ad.msg || "删除失败", "error");
  }
}
function renderDescImagesGalleryForAdmin(_0x60be02) {
  if (!_0x60be02) {
    return "";
  }
  try {
    var _0x5cdab0 = JSON.parse(_0x60be02);
    if (!_0x5cdab0 || _0x5cdab0.length === 0) {
      return "";
    }
    return ["<div style=\"margin-bottom:16px\">", "<div style=\"font-size:12px;font-weight:600;color:var(--gray-500);margin-bottom:8px\">📷 上传图片（" + _0x5cdab0.length + "张）</div>", "<div style=\"display:flex;gap:10px;overflow-x:auto;padding-bottom:8px\">", _0x5cdab0.map(function (_0x13afd5) {
      return "<img src=\"" + API_BASE + _0x13afd5 + "\" style=\"height:120px;border-radius:8px;object-fit:cover;border:1px solid var(--gray-200);cursor:pointer\" onclick=\"window.open(this.src)\">";
    }).join(""), "</div>", "</div>"].join("");
  } catch (_0x248b90) {
    return "";
  }
}
async function adminStartProgramPreview(_0x2d0a5c, _0x29f884) {
  var _0x2030fd = _0x29f884.closest(".admin-preview-overlay");
  if (_0x2030fd) {
    _0x2030fd.remove();
  }
  var _0x264f94 = PROGRAMS_ALL.find(function (_0x4421a3) {
    return _0x4421a3.id === _0x2d0a5c;
  });
  if (!_0x264f94) {
    return;
  }
  try {
    if (_0x264f94.source_kind === "long_march_private_v1" && [498, 754].includes(Number(_0x264f94.id))) {
      return await openViewer(_0x2d0a5c, _0x264f94);
    }
    if ((_0x264f94.runtime_mode || "default") === "camera") {
      await openCameraProgram(_0x2d0a5c);
      return;
    }
    if (_0x264f94.source_kind === "external") {
      const _0x3f2a3d = await fetch(API_BASE + "/api/programs/" + _0x2d0a5c + "/external-url", {
        headers: State.token ? {
          Authorization: "Bearer " + State.token
        } : {}
      });
      const _0x23cf77 = await _0x3f2a3d.json();
      if (!_0x23cf77.success) {
        toast(_0x23cf77.msg || "无访问权限", "error");
        return;
      }
      renderViewer(_0x264f94, _0x23cf77.url, null, "member");
      return;
    }
    const _0x4e83e4 = await fetch(API_BASE + "/api/programs/" + _0x2d0a5c + "/access-token", {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    const _0x28fac3 = await _0x4e83e4.json();
    if (!_0x28fac3.success) {
      toast(_0x28fac3.msg || "无访问权限", "error");
      return;
    }
    var _0x3fceca = API_BASE + "/api/program-file/" + _0x2d0a5c + "?token=" + encodeURIComponent(_0x28fac3.token);
    renderViewer(_0x264f94, _0x3fceca, null, "member");
  } catch (_0x498dff) {
    toast("加载失败：" + _0x498dff.message, "error");
  }
}
var adminEditingNoteId = null;
var adminNoteUploadedImages = [];
function adminEditNote(_0x59a2a1) {
  var _0x4c07e5 = PROGRAMS_ALL.find(function (_0x521b53) {
    return _0x521b53.id === _0x59a2a1;
  });
  if (!_0x4c07e5) {
    return toast("程序数据未加载", "error");
  }
  adminEditingNoteId = _0x59a2a1;
  adminNoteUploadedImages = [];
  var _0x6b411b = [];
  if (_0x4c07e5.admin_note_images) {
    try {
      _0x6b411b = JSON.parse(_0x4c07e5.admin_note_images);
    } catch (_0x26fc83) {}
  }
  var _0x6c953b = document.createElement("div");
  _0x6c953b.className = "admin-note-overlay";
  _0x6c953b.style.cssText = "position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s";
  _0x6c953b.innerHTML = ["<div style=\"background:#fff;border-radius:16px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:adminCardIn .3s ease\">", "<div style=\"background:linear-gradient(135deg,#7c3aed,#a855f7);padding:20px 24px;border-radius:16px 16px 0 0\">", "<h3 style=\"margin:0;color:#fff;font-size:16px\">管理员的话</h3>", "<p style=\"margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.8)\">为 「" + htmlEscape(_0x4c07e5.title || "") + "」 添加使用说明，将展示在作品详情页</p>", "</div>", "<div style=\"padding:20px 24px\">", "<div class=\"form-group\">", "<label class=\"form-label\">说明内容（支持 HTML 排版）</label>", "<div class=\"rich-editor-area form-input\" id=\"admin-note-editor\" contenteditable=\"true\" data-placeholder=\"输入使用说明、注意事项、推荐用法等...\" style=\"min-height:150px\">" + (_0x4c07e5.admin_note || "") + "</div>", "</div>", "<div class=\"form-group\" style=\"margin-top:16px\">", "<label class=\"form-label\">说明图片（可选）</label>", "<div id=\"admin-note-images-preview\" style=\"display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px\">", _0x6b411b.map(function (_0x2f556c) {
    return "<div style=\"position:relative;display:inline-block\"><img src=\"" + API_BASE + _0x2f556c + "\" style=\"width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--gray-200)\"><button data-url=\"" + _0x2f556c.replace(/"/g, "&quot;").replace(/'/g, "&#39;") + "\" onclick=\"adminRemoveNoteImage(this)\" style=\"position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--red-500);color:#fff;border:none;font-size:12px;cursor:pointer;line-height:1\">✕</button></div>";
  }).join(""), "</div>", "<div class=\"upload-dropzone\" onclick=\"document.getElementById('admin-note-image-input').click()\" style=\"padding:20px;cursor:pointer;display:inline-block\">", "<div style=\"font-size:28px;color:#bbb;font-weight:200\">+</div>", "<p style=\"font-size:12px;color:var(--gray-400);margin:4px 0 0\">添加图片</p>", "</div>", "<input type=\"file\" id=\"admin-note-image-input\" accept=\"image/*\" style=\"display:none\" onchange=\"adminNoteUploadImage(this)\">", "<p id=\"admin-note-upload-status\" style=\"font-size:12px;color:var(--gray-400);margin-top:6px\"></p>", "</div>", "<div style=\"display:flex;gap:10px;padding-top:16px;border-top:1px solid var(--gray-100)\">", "<button class=\"btn btn-primary\" onclick=\"adminSaveNote()\" style=\"flex:1;padding:10px 18px;font-size:14px\">💾 保存说明</button>", "<button class=\"btn btn-sm btn-outline\" onclick=\"this.closest('.admin-note-overlay').remove()\" style=\"padding:10px 18px;font-size:14px\">取消</button>", "</div>", _0x4c07e5.admin_note ? "<p style=\"font-size:11px;color:var(--gray-400);margin-top:12px;text-align:center\">已有说明，修改后将覆盖</p>" : "", "</div>", "</div>"].join("");
  document.body.appendChild(_0x6c953b);
  requestAnimationFrame(function () {
    _0x6c953b.style.opacity = "1";
    _0x6c953b.style.pointerEvents = "all";
  });
  _0x6c953b.addEventListener("click", function (_0xbc0345) {
    if (_0xbc0345.target === _0x6c953b) {
      _0x6c953b.remove();
    }
  });
}
async function adminNoteUploadImage(_0x1fd691) {
  if (!_0x1fd691.files || !_0x1fd691.files[0]) {
    return;
  }
  var _0x4ec504 = _0x1fd691.files[0];
  var _0x218abb = new FormData();
  _0x218abb.append("image", _0x4ec504);
  _0x218abb.append("programId", adminEditingNoteId);
  var _0x532518 = document.getElementById("admin-note-upload-status");
  if (_0x532518) {
    _0x532518.textContent = "⏳ 上传中...";
  }
  try {
    var _0x2aa7e4 = await fetch(API_BASE + "/api/upload-admin-note-image", {
      method: "POST",
      body: _0x218abb,
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    var _0x3949ee = await _0x2aa7e4.json();
    if (_0x3949ee.success && _0x3949ee.url) {
      adminNoteUploadedImages.push(_0x3949ee.url);
      var _0x443ceb = document.getElementById("admin-note-images-preview");
      if (_0x443ceb) {
        _0x443ceb.innerHTML += "<div style=\"position:relative;display:inline-block\"><img src=\"" + API_BASE + _0x3949ee.url + "\" style=\"width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--gray-200)\"><button data-url=\"" + _0x3949ee.url.replace(/"/g, "&quot;").replace(/'/g, "&#39;") + "\" onclick=\"adminRemoveNoteImage(this)\" style=\"position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--red-500);color:#fff;border:none;font-size:12px;cursor:pointer;line-height:1\">✕</button></div>";
      }
      if (_0x532518) {
        _0x532518.textContent = "✅ 已上传 1 张图片";
      }
    } else if (_0x532518) {
      _0x532518.textContent = "❌ 上传失败";
    }
  } catch (_0x242320) {
    if (_0x532518) {
      _0x532518.textContent = "❌ 上传出错";
    }
  }
  _0x1fd691.value = "";
}
function adminRemoveNoteImage(_0x1f3090) {
  var _0x253f58 = _0x1f3090.getAttribute("data-url");
  var _0x3aef57 = adminNoteUploadedImages.indexOf(_0x253f58);
  if (_0x3aef57 !== -1) {
    adminNoteUploadedImages.splice(_0x3aef57, 1);
  }
  _0x1f3090.closest("div[style*=\"position:relative\"]").remove();
}
async function adminSaveNote() {
  var _0x2826e3 = adminEditingNoteId;
  if (!_0x2826e3) {
    toast("数据错误", "error");
    return;
  }
  var _0x591abd = document.getElementById("admin-note-editor");
  var _0x3b78c6 = _0x591abd ? _0x591abd.innerHTML : "";
  if (_0x591abd && !_0x591abd.textContent.trim()) {
    _0x3b78c6 = "";
  }
  var _0xf62d8b = PROGRAMS_ALL.find(function (_0x8b0648) {
    return _0x8b0648.id === _0x2826e3;
  });
  var _0x510847 = [];
  if (_0xf62d8b && _0xf62d8b.admin_note_images) {
    try {
      _0x510847 = JSON.parse(_0xf62d8b.admin_note_images);
    } catch (_0x52bb06) {}
  }
  var _0x49c1fa = document.getElementById("admin-note-images-preview");
  var _0x3d3a70 = [];
  if (_0x49c1fa) {
    var _0x3b65a7 = _0x49c1fa.querySelectorAll("img");
    _0x3b65a7.forEach(function (_0x220ba9) {
      var _0x2541d0 = _0x220ba9.getAttribute("src") || _0x220ba9.src;
      try {
        _0x2541d0 = new URL(_0x2541d0, location.origin).pathname;
      } catch (_0x14cc34) {}
      if (_0x2541d0.indexOf(API_BASE) === 0) {
        _0x2541d0 = _0x2541d0.substring(API_BASE.length);
      }
      _0x3d3a70.push(_0x2541d0);
    });
  }
  toast("正在保存...", "info");
  var _0x3cbc8f = await apiFetch("/api/programs/save-admin-note", {
    method: "POST",
    body: JSON.stringify({
      id: _0x2826e3,
      note: _0x3b78c6,
      note_images: _0x3d3a70.length > 0 ? JSON.stringify(_0x3d3a70) : null
    })
  });
  if (_0x3cbc8f.success) {
    toast("✅ 使用说明已保存", "success");
    if (_0xf62d8b) {
      _0xf62d8b.admin_note = _0x3b78c6;
      _0xf62d8b.admin_note_images = _0x3d3a70.length > 0 ? JSON.stringify(_0x3d3a70) : null;
    }
    var _0x57511b = PROGRAMS.find(function (_0x68d23d) {
      return _0x68d23d.id === _0x2826e3;
    });
    if (_0x57511b) {
      _0x57511b.admin_note = _0x3b78c6;
      _0x57511b.admin_note_images = _0x3d3a70.length > 0 ? JSON.stringify(_0x3d3a70) : null;
    }
    document.querySelector(".admin-note-overlay")?.remove();
  } else {
    toast(_0x3cbc8f.msg || "保存失败", "error");
  }
}
function adminSetProgramPlacement(_0x365222) {
  var _0x2ae52c = PROGRAMS_ALL.find(function (_0x1d5ef9) {
    return _0x1d5ef9.id === _0x365222;
  });
  if (!_0x2ae52c || !State.user || State.user.role !== "admin") {
    return;
  }
  TuringPlacement.open({
    program: _0x2ae52c,
    programs: PROGRAMS_ALL,
    request: apiFetch,
    notify: toast,
    afterSave: async function () {
      await loadProgramsFromDatabase({
        throwOnError: true,
        render: false
      });
      if (!(await loadAllProgramsForAdmin())) {
        throw Error("刷新失败");
      }
      if (document.getElementById("admin-app-tbody")) {
        filterAdminApps();
      }
    }
  });
}
async function adminReorder(_0x2830bc, _0xbff9c9) {
  var _0x545d58 = await apiFetch("/api/programs/reorder", {
    method: "POST",
    body: JSON.stringify({
      id: _0x2830bc,
      direction: _0xbff9c9
    })
  });
  if (_0x545d58.success) {
    await loadProgramsFromDatabase();
    await loadAllProgramsForAdmin();
    document.getElementById("admin-content").innerHTML = renderAdminApps();
    filterAdminApps();
  } else {
    toast(_0x545d58.msg || "操作失败", "error");
  }
}
var ADMIN_SORTING_BUSY = false;
async function adminSortByUses() {
  if (ADMIN_SORTING_BUSY || !confirm("按热度重排探索页的未固定推荐？首页和探索页已固定的位置会保留。")) {
    return;
  }
  ADMIN_SORTING_BUSY = true;
  var _0x10cc5c = document.getElementById("admin-sort-btn");
  if (_0x10cc5c) {
    _0x10cc5c.disabled = true;
  }
  try {
    var _0x1350bb = await apiFetch("/api/programs/sort-by-uses", {
      method: "POST",
      body: JSON.stringify({})
    });
    if (!_0x1350bb.success) {
      throw Error(_0x1350bb.msg || "排序保存失败，请重试");
    }
    toast("未固定推荐已按热度重排，固定位置保持不变", "success");
    await loadProgramsFromDatabase({
      throwOnError: true,
      render: false
    });
    if (!(await loadAllProgramsForAdmin())) {
      throw Error("列表刷新失败，请刷新页面查看");
    }
    if (document.getElementById("admin-app-tbody")) {
      filterAdminApps();
    }
  } catch (_0x2ded6d) {
    toast(_0x2ded6d.message || "排序失败，请稍后重试", "error");
  } finally {
    ADMIN_SORTING_BUSY = false;
    if (_0x10cc5c && _0x10cc5c.isConnected) {
      _0x10cc5c.disabled = false;
    }
  }
}
async function adminDelistProgram(_0x52de31) {
  var _0x266664 = prompt("请输入下架/修改建议（用户可见）：");
  if (_0x266664 === null) {
    return;
  }
  var _0x1d8c75 = await apiFetch("/api/programs/delist", {
    method: "POST",
    body: JSON.stringify({
      id: _0x52de31,
      feedback: _0x266664
    })
  });
  if (_0x1d8c75.success) {
    toast("作品已下架", "success");
    loadAllProgramsForAdmin().then(function () {
      document.getElementById("admin-content").innerHTML = renderAdminApps();
      filterAdminApps();
    });
  } else {
    toast(_0x1d8c75.msg || "操作失败，请稍后重试", "error");
  }
}
async function adminRejectProgram(_0x16c360) {
  var _0x423398 = prompt("请输入驳回原因（用户可见）：");
  if (_0x423398 === null) {
    return;
  }
  var _0xc022ff = await apiFetch("/api/programs/reject", {
    method: "POST",
    body: JSON.stringify({
      id: _0x16c360,
      feedback: _0x423398
    })
  });
  if (_0xc022ff.success) {
    toast("作品已驳回", "success");
    loadAllProgramsForAdmin().then(function () {
      document.getElementById("admin-content").innerHTML = renderAdminApps();
      filterAdminApps();
    });
  } else {
    toast(_0xc022ff.msg || "操作失败，请稍后重试", "error");
  }
}
function renderAdminUsers() {
  return "\n    <div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px;margin-bottom:24px\">\n      <h3 style=\"font-size:16px;font-weight:700;margin-bottom:16px;color:var(--gray-800)\">👥 会员管理与 VIP 发放</h3>\n      <div style=\"display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap\">\n        <input class=\"form-input\" type=\"search\" id=\"admin-user-search\" maxlength=\"100\" aria-label=\"搜索用户昵称或OpenID\" placeholder=\"搜索昵称 / 完整OpenID...\" value=\"" + htmlEscape(ADMIN_USER_LIST.q) + "\" style=\"flex:1;min-width:200px\" oninput=\"adminFilterUsers(event)\" oncompositionstart=\"adminUserCompositionStart()\" oncompositionend=\"adminFilterUsers(event)\">\n        <button class=\"btn btn-outline btn-sm\" data-admin-user-control onclick=\"adminBatchVIP(3)\">+3天</button>\n        <button class=\"btn btn-outline btn-sm\" data-admin-user-control onclick=\"adminBatchVIP(7)\">+7天</button>\n        <button class=\"btn btn-primary btn-sm\" data-admin-user-control onclick=\"adminBatchVIP(30)\">+30天</button>\n      </div>\n      <p style=\"font-size:12px;color:var(--gray-500);margin-bottom:12px\">每页 " + ADMIN_USER_LIST.pageSize + " 位用户，勾选和批量发放仅作用于当前页。</p>\n      <div style=\"overflow-x:auto\"><table style=\"width:100%;min-width:900px;border-collapse:collapse;font-size:13px\" id=\"admin-user-table\">\n        <thead>\n          <tr style=\"background:var(--gray-50)\">\n            <th style=\"padding:10px 12px;text-align:center;width:40px\"><input type=\"checkbox\" id=\"admin-user-select-all\" aria-label=\"勾选当前页所有用户\" onchange=\"document.querySelectorAll('.admin-user-check').forEach(cb => cb.checked = this.checked)\"></th>\n            <th style=\"padding:10px 12px;text-align:left\">用户称呼</th>\n            <th style=\"padding:10px 12px;text-align:left\">科目</th>\n            <th style=\"padding:10px 12px;text-align:left\">身份</th>\n            <th style=\"padding:10px 12px;text-align:left\">OpenID</th>\n            <th style=\"padding:10px 12px;text-align:center\">VIP 状态</th>\n            <th style=\"padding:10px 12px;text-align:center\">注册时间</th>\n            <th style=\"padding:10px 12px;text-align:center\">操作</th>\n          </tr>\n        </thead>\n        <tbody id=\"admin-user-tbody\">\n          <tr><td colspan=\"8\" style=\"text-align:center;padding:24px;color:var(--gray-500)\">加载用户中…</td></tr>\n        </tbody>\n      </table></div>\n      <div style=\"display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:16px\">\n        <button class=\"btn btn-outline btn-sm\" id=\"admin-user-prev\" data-admin-user-control onclick=\"adminChangeUserPage(-1)\" disabled>上一页</button>\n        <span id=\"admin-user-status\" role=\"status\" aria-live=\"polite\" style=\"font-size:13px;color:var(--gray-500)\">加载用户中…</span>\n        <button class=\"btn btn-outline btn-sm\" id=\"admin-user-next\" data-admin-user-control onclick=\"adminChangeUserPage(1)\" disabled>下一页</button>\n        <button class=\"btn btn-outline btn-sm\" id=\"admin-user-retry\" onclick=\"loadAdminUsers()\" hidden>重试</button>\n      </div>\n    </div>";
}
function renderAdminUserRows() {
  return ADMIN_USERS.map((_0x30251b, _0x4cab8a) => "\n    <tr style=\"border-top:1px solid var(--gray-100)\">\n      <td style=\"padding:8px 12px;text-align:center\"><input type=\"checkbox\" class=\"admin-user-check\" data-uid=\"" + htmlEscape(_0x30251b.openid) + "\" aria-label=\"勾选" + htmlEscape(_0x30251b.nickname || "教师用户") + "\"></td>\n      <td style=\"padding:8px 12px;font-weight:500\">" + (_0x30251b.profile_completed ? htmlEscape(_0x30251b.nickname || "教师用户") : "<span style=\"color:var(--amber-600)\">待完善资料</span>") + "</td>\n      <td style=\"padding:8px 12px;color:var(--gray-500);font-size:12px\">" + htmlEscape(_0x30251b.subject || "-") + "</td>\n      <td style=\"padding:8px 12px;color:var(--gray-500)\">" + (_0x30251b.role === "admin" ? "<span style=\"color:var(--red-500)\">超管</span>" : _0x30251b.role === "moderator" ? "<span style=\"color:var(--blue-600)\">管理员</span>" : "教师") + "</td>\n      <td style=\"padding:8px 12px;color:var(--gray-500);font-size:11px\" title=\"" + htmlEscape(_0x30251b.openid) + "\">" + htmlEscape(_0x30251b.openid.substring(0, 12)) + "...</td>\n      <td style=\"padding:8px 12px;text-align:center\">" + (_0x30251b.is_member ? "<span style=\"color:var(--green-600);font-weight:600\">👑 VIP</span><br><span style=\"font-size:10px;color:var(--gray-400)\">到期: " + htmlEscape(_0x30251b.member_expire || "等待同步...") + "</span>" : "<span style=\"color:var(--gray-400)\">普通</span>") + "</td>\n      <td style=\"padding:8px 12px;text-align:center;font-size:11px;color:var(--gray-400)\">" + htmlEscape(_0x30251b.created_at ? _0x30251b.created_at.substring(0, 10) : "-") + "</td>\n      <td style=\"padding:8px 12px;text-align:center;white-space:nowrap;\">\n        <button class=\"btn btn-sm " + (_0x30251b.is_member ? "btn-outline" : "btn-primary") + "\" onclick=\"adminUserAction('toggle'," + _0x4cab8a + ")\" style=\"font-size:11px;padding:3px 8px\">" + (_0x30251b.is_member ? "降级" : "升VIP") + "</button>\n        <button class=\"btn btn-sm btn-amber\" onclick=\"adminUserAction('gift'," + _0x4cab8a + ")\" style=\"font-size:11px;padding:3px 8px;margin-left:2px\">赠送</button>\n        <button class=\"btn btn-sm\" onclick=\"adminUserAction('delete'," + _0x4cab8a + ")\" style=\"font-size:11px;padding:3px 8px;background:var(--red-500);color:#fff;border:none;margin-left:2px\">删号</button>\n      </td>\n    </tr>").join("") || "<tr><td colspan=\"8\" style=\"text-align:center;padding:24px;color:var(--gray-500)\">没有匹配的用户</td></tr>";
}
function adminUserAction(_0x41e5c0, _0x8b924b) {
  const _0x2bc8b6 = ADMIN_USERS[_0x8b924b];
  if (!_0x2bc8b6 || ADMIN_USER_LIST.loading || ADMIN_USER_LIST.composing || ADMIN_USER_LIST.timer) {
    return;
  }
  if (_0x41e5c0 === "toggle") {
    adminToggleMember(_0x2bc8b6.openid, _0x2bc8b6.is_member);
  }
  if (_0x41e5c0 === "gift") {
    adminGiftProgram(_0x2bc8b6.openid, _0x2bc8b6.nickname || "教师用户");
  }
  if (_0x41e5c0 === "delete") {
    adminDeleteUser(_0x2bc8b6.openid);
  }
}
async function adminGenCoupon(_0x4c7197) {
  try {
    const _0x51c685 = _0x4c7197 === 0 ? "免费体验码" : Math.round(_0x4c7197 * 100) + "%折扣码";
    const _0xc4614e = await apiFetch("/api/admin/coupon/create", {
      method: "POST",
      body: JSON.stringify({
        type: "discount",
        discount: _0x4c7197,
        label: _0x51c685
      })
    });
    if (_0xc4614e.success) {
      toast("优惠码已生成: " + _0xc4614e.code, "success");
      try {
        navigator.clipboard.writeText(_0xc4614e.code);
      } catch (_0x31a176) {}
      switchAdminTab(document.querySelector(".dash-tab.active"), "users");
    } else {
      toast(_0xc4614e.msg || "生成失败", "error");
    }
  } catch (_0xde513f) {
    toast("网络错误", "error");
  }
}
async function adminGenMemberCode(_0x47e449) {
  try {
    const _0x2c43d0 = _0x47e449 + "天会员码";
    const _0x4cdcb8 = await apiFetch("/api/admin/coupon/create", {
      method: "POST",
      body: JSON.stringify({
        type: "member",
        days: _0x47e449,
        label: _0x2c43d0
      })
    });
    if (_0x4cdcb8.success) {
      toast("会员码已生成: " + _0x4cdcb8.code, "success");
      try {
        navigator.clipboard.writeText(_0x4cdcb8.code);
      } catch (_0x6d1d82) {}
      switchAdminTab(document.querySelector(".dash-tab.active"), "users");
    } else {
      toast(_0x4cdcb8.msg || "生成失败", "error");
    }
  } catch (_0x12e554) {
    toast("网络错误", "error");
  }
}
async function loadAdminCoupons() {
  const _0x31b742 = document.getElementById("admin-coupon-list");
  if (!_0x31b742) {
    return;
  }
  try {
    const _0x4d5298 = await apiFetch("/api/admin/coupons");
    if (!_0x4d5298.success) {
      _0x31b742.innerHTML = "<p>加载失败</p>";
      return;
    }
    const _0x3c805f = _0x4d5298.coupons || [];
    if (_0x3c805f.length === 0) {
      _0x31b742.innerHTML = "<p>暂无已生成的优惠码。点击上方按钮生成。</p>";
      return;
    }
    _0x31b742.innerHTML = "<table style=\"width:100%;border-collapse:collapse\">\n      <tr style=\"background:var(--gray-50)\">\n        <th style=\"padding:8px;text-align:left\">优惠码</th>\n        <th style=\"padding:8px;text-align:left\">类型</th>\n        <th style=\"padding:8px;text-align:center\">状态</th>\n        <th style=\"padding:8px;text-align:left\">使用者</th>\n        <th style=\"padding:8px;text-align:left\">生成时间</th>\n      </tr>\n      " + _0x3c805f.map(_0x6ee881 => "<tr style=\"border-top:1px solid var(--gray-100)\">\n        <td style=\"padding:8px;font-family:monospace;font-weight:700;user-select:all;cursor:text\">" + _0x6ee881.code + "</td>\n        <td style=\"padding:8px\">" + (_0x6ee881.label || (_0x6ee881.type === "member" ? _0x6ee881.days + "天会员码" : _0x6ee881.discount === 0 ? "免费体验码" : Math.round(_0x6ee881.discount * 100) + "%折扣码")) + "</td>\n        <td style=\"padding:8px;text-align:center\">" + (_0x6ee881.used_by ? "<span style=\"color:var(--gray-400)\">已使用</span>" : "<span style=\"color:var(--green-600);font-weight:600\">未使用</span>") + "</td>\n        <td style=\"padding:8px;font-size:11px;color:var(--gray-400)\">" + (_0x6ee881.used_by ? _0x6ee881.used_by.substring(0, 16) + "..." : "-") + "</td>\n        <td style=\"padding:8px;color:var(--gray-400)\">" + (_0x6ee881.created_at || "") + "</td>\n      </tr>").join("") + "\n    </table>";
  } catch (_0x37610d) {
    _0x31b742.innerHTML = "<p>网络错误</p>";
  }
}
async function adminGiftProgram(_0x341f35, _0x1a6636) {
  const _0x1e3f45 = PROGRAMS.length > 0 ? PROGRAMS : [];
  if (_0x1e3f45.length === 0) {
    toast("暂无可赠送的程序", "error");
    return;
  }
  const _0x3b45d2 = _0x1e3f45.map(_0xbf4345 => _0xbf4345.title + " (ID:" + _0xbf4345.id + ")").join("\\n");
  const _0x598e8e = prompt("赠送程序给: " + _0x1a6636 + "\\n\\n请输入要赠送的程序ID编号:\\n" + _0x1e3f45.map(_0x689582 => "  " + _0x689582.id + " - " + _0x689582.title).join("\\n"));
  if (!_0x598e8e) {
    return;
  }
  const _0x43f5da = parseInt(_0x598e8e);
  if (!_0x43f5da) {
    toast("请输入有效的程序ID", "error");
    return;
  }
  const _0x28d939 = _0x1e3f45.find(_0x3620d4 => _0x3620d4.id === _0x43f5da);
  if (!_0x28d939) {
    toast("未找到该程序", "error");
    return;
  }
  if (!confirm("确认赠送「" + _0x28d939.title + "」给 " + _0x1a6636 + " ？")) {
    return;
  }
  try {
    const _0x16ced9 = await apiFetch("/api/admin/gift-program", {
      method: "POST",
      body: JSON.stringify({
        targetOpenid: _0x341f35,
        programId: _0x43f5da
      })
    });
    if (_0x16ced9.success) {
      toast("已成功赠送「" + _0x28d939.title + "」给 " + _0x1a6636, "success");
    } else {
      toast(_0x16ced9.msg || "赠送失败", "error");
    }
  } catch (_0x504cec) {
    toast("网络错误", "error");
  }
}
function adminUserCompositionStart() {
  ADMIN_USER_LIST.composing = true;
  cancelAdminUserRequest();
  adminUserListBusy("请输入完整昵称…");
}
function adminFilterUsers(_0x201ed1) {
  if (_0x201ed1 && _0x201ed1.type === "compositionend") {
    ADMIN_USER_LIST.composing = false;
  }
  cancelAdminUserRequest();
  ADMIN_USER_LIST.q = (document.getElementById("admin-user-search")?.value || "").trim();
  ADMIN_USER_LIST.page = 1;
  if (ADMIN_USER_LIST.composing || _0x201ed1 && _0x201ed1.isComposing) {
    return;
  }
  adminUserListBusy("搜索用户中…");
  if (!ADMIN_USER_LIST.q) {
    loadAdminUsers();
    return;
  }
  ADMIN_USER_LIST.timer = setTimeout(() => {
    ADMIN_USER_LIST.timer = null;
    loadAdminUsers();
  }, 250);
}
function adminChangeUserPage(_0x416d4a) {
  if (ADMIN_USER_LIST.loading || ADMIN_USER_LIST.composing || ADMIN_USER_LIST.timer) {
    return;
  }
  const _0x325498 = Math.max(1, Math.min(ADMIN_USER_LIST.pages, ADMIN_USER_LIST.page + _0x416d4a));
  if (_0x325498 === ADMIN_USER_LIST.page) {
    return;
  }
  ADMIN_USER_LIST.page = _0x325498;
  loadAdminUsers();
}
async function adminToggleMember(_0x4f9b25, _0x3ff378) {
  const _0x5753d4 = await apiFetch("/api/users/toggle-vip", {
    method: "POST",
    body: JSON.stringify({
      openid: _0x4f9b25,
      isMember: _0x3ff378
    })
  });
  if (_0x5753d4.success) {
    toast("VIP权限已更新", "success");
    await loadAdminUsers();
  } else {
    toast(_0x5753d4.msg || "VIP权限更新失败，请重试", "error");
  }
}
async function adminDeleteUser(_0x2e8f1b) {
  if (!confirm("确定要删除该用户吗？此操作不可恢复！")) {
    return;
  }
  try {
    const _0xf80b8e = await apiFetch("/api/users/delete", {
      method: "POST",
      body: JSON.stringify({
        openid: _0x2e8f1b
      })
    });
    if (_0xf80b8e.success) {
      toast("用户已删除", "success");
      await loadAdminUsers();
    } else {
      toast("删除失败，请稍后重试", "error");
    }
  } catch (_0x4594de) {
    toast("网络请求失败", "error");
  }
}
async function adminBatchVIP(_0x4f0a73) {
  if (ADMIN_USER_LIST.loading || ADMIN_USER_LIST.composing || ADMIN_USER_LIST.timer) {
    return;
  }
  const _0x36ade3 = document.querySelectorAll(".admin-user-check:checked");
  if (_0x36ade3.length === 0) {
    toast("请先勾选需要操作的用户", "error");
    return;
  }
  const _0x35ed8e = Array.from(_0x36ade3).map(_0x227395 => _0x227395.getAttribute("data-uid"));
  toast("正在为 " + _0x35ed8e.length + " 位老师发放 " + _0x4f0a73 + " 天 VIP...", "info");
  try {
    const _0xaf9e6d = await apiFetch("/api/users/add-vip", {
      method: "POST",
      body: JSON.stringify({
        openids: _0x35ed8e,
        days: _0x4f0a73
      })
    });
    if (_0xaf9e6d.success) {
      toast("成功发放 " + _0x4f0a73 + " 天 VIP！", "success");
      await loadAdminUsers();
    } else {
      toast("发放失败，请检查服务器连接", "error");
    }
  } catch (_0x38ed29) {
    toast("网络请求失败", "error");
  }
}
async function renderAdminWithdrawals(_0x1207fa) {
  try {
    const _0x5321df = await apiFetch("/api/admin/withdrawals");
    if (!_0x5321df.success) {
      _0x1207fa.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载失败: " + (_0x5321df.msg || "") + "</div>";
      return;
    }
    const _0x2b3fbe = _0x5321df.withdrawals || [];
    _0x1207fa.innerHTML = "\n      <div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">\n        <h3 style=\"font-size:16px;margin-bottom:16px;color:var(--gray-800)\">提现管理</h3>\n        <p style=\"font-size:12px;color:var(--gray-500);margin-bottom:14px\">请先核对收款人和收款信息，完成线下转账后再确认打款；资料有误时请驳回并填写原因。</p>\n        " + (_0x2b3fbe.length > 0 ? "<div style=\"overflow-x:auto\"><table style=\"width:100%;border-collapse:collapse;font-size:13px;min-width:980px\">\n          <tr style=\"background:var(--gray-50)\">\n            <th style=\"padding:10px;text-align:left\">用户</th>\n            <th style=\"padding:10px;text-align:left\">收款人</th>\n            <th style=\"padding:10px;text-align:left\">收款方式</th>\n            <th style=\"padding:10px;text-align:left\">收款信息</th>\n            <th style=\"padding:10px;text-align:right\">金额(元)</th>\n            <th style=\"padding:10px;text-align:center\">状态</th>\n            <th style=\"padding:10px;text-align:right\">申请时间</th>\n            <th style=\"padding:10px;text-align:center\">操作</th>\n          </tr>\n          " + _0x2b3fbe.map(_0x537014 => "<tr style=\"border-top:1px solid var(--gray-100)\">\n            <td style=\"padding:8px\">" + htmlEscape(_0x537014.nickname || "未知") + "<br><small style=\"color:var(--gray-400)\">" + htmlEscape(_0x537014.openid || "") + "</small></td>\n            <td style=\"padding:8px\">" + htmlEscape(_0x537014.real_name || "-") + "</td>\n            <td style=\"padding:8px\">" + (_0x537014.pay_method === "wechat" ? "微信收款码" : _0x537014.pay_method === "alipay" ? "支付宝" : htmlEscape(_0x537014.pay_method || "-")) + "</td>\n            <td style=\"padding:8px\">" + (_0x537014.pay_method === "wechat" ? "<button class=\"btn btn-sm btn-outline\" onclick=\"adminViewWithdrawProof(" + _0x537014.id + ")\">查看收款码</button>" : htmlEscape(_0x537014.pay_account || "-")) + "</td>\n            <td style=\"padding:8px;text-align:right;font-weight:600;color:var(--amber-600)\">&yen;" + (_0x537014.amount / 100).toFixed(2) + "</td>\n            <td style=\"padding:8px;text-align:center\">" + (_0x537014.status === "pending" ? "<span style=\"color:var(--amber-500)\">待处理</span>" : _0x537014.status === "completed" ? "<span style=\"color:var(--green-600)\">已完成</span>" : "<span style=\"color:var(--red-500)\">已驳回</span>") + "</td>\n            <td style=\"padding:8px;text-align:right;color:var(--gray-400)\">" + htmlEscape(_0x537014.created_at || "") + "</td>\n            <td style=\"padding:8px;text-align:center\">" + (_0x537014.status === "pending" ? "<div style=\"display:flex;gap:6px;justify-content:center\"><button class=\"btn btn-sm btn-green\" onclick=\"adminProcessWithdraw(" + _0x537014.id + ")\">确认已打款</button><button class=\"btn btn-sm\" style=\"background:var(--red-500);color:#fff\" onclick=\"adminRejectWithdraw(" + _0x537014.id + ")\">驳回</button></div>" : _0x537014.status === "rejected" ? htmlEscape(_0x537014.rejection_reason || "未填写原因") : htmlEscape(_0x537014.processed_at || "-")) + "</td>\n          </tr>").join("") + "\n        </table></div>" : "<div style=\"text-align:center;padding:32px;color:var(--gray-400)\"><p>暂无提现请求</p></div>") + "\n      </div>";
  } catch (_0x51208b) {
    _0x1207fa.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">网络错误</div>";
  }
}
async function adminViewWithdrawProof(_0x309711) {
  try {
    const _0x265fe0 = await fetch(API_BASE + "/api/admin/withdrawals/" + _0x309711 + "/payment-proof", {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    if (!_0x265fe0.ok) {
      const _0xb72d42 = await _0x265fe0.json().catch(() => ({}));
      toast(_0xb72d42.msg || "收款码加载失败", "error");
      return;
    }
    const _0x3b88fe = URL.createObjectURL(await _0x265fe0.blob());
    const _0x5728ca = window.open(_0x3b88fe, "_blank", "noopener");
    if (!_0x5728ca) {
      toast("浏览器阻止了新窗口，请允许弹窗后重试", "error");
    }
    setTimeout(() => URL.revokeObjectURL(_0x3b88fe), 60000);
  } catch (_0x647821) {
    toast("收款码加载失败", "error");
  }
}
async function adminProcessWithdraw(_0x398192) {
  if (!confirm("请确认已按页面所示收款方式完成实际转账。确认后不可重复处理。")) {
    return;
  }
  try {
    const _0x2e6c89 = await apiFetch("/api/admin/withdraw/process", {
      method: "POST",
      body: JSON.stringify({
        id: _0x398192
      })
    });
    if (_0x2e6c89.success) {
      toast("已确认打款", "success");
      switchAdminTab(document.querySelector(".dash-tab.active"), "withdrawals");
    } else {
      toast(_0x2e6c89.msg || "处理失败", "error");
    }
  } catch (_0x46e55a) {
    toast("网络错误", "error");
  }
}
async function adminRejectWithdraw(_0x242422) {
  const _0x3dd4fb = prompt("请输入驳回原因，用户将看到该说明，相关收益会退回可提现余额：");
  if (_0x3dd4fb === null) {
    return;
  }
  if (!_0x3dd4fb.trim()) {
    toast("请填写驳回原因", "error");
    return;
  }
  try {
    const _0x58428 = await apiFetch("/api/admin/withdraw/reject", {
      method: "POST",
      body: JSON.stringify({
        id: _0x242422,
        reason: _0x3dd4fb.trim()
      })
    });
    if (_0x58428.success) {
      toast("已驳回申请并退回可提现余额", "success");
      switchAdminTab(document.querySelector(".dash-tab.active"), "withdrawals");
    } else {
      toast(_0x58428.msg || "驳回失败", "error");
    }
  } catch (_0x3561cf) {
    toast("网络错误", "error");
  }
}
async function renderAdminOrders(_0x541535) {
  try {
    const _0x51baea = await apiFetch("/api/admin/orders");
    if (!_0x51baea.success) {
      _0x541535.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载失败: " + (_0x51baea.msg || "") + "</div>";
      return;
    }
    const _0x3083c8 = _0x51baea.orders || [];
    const _0x6b6f9f = _0x3083c8.filter(_0x5d523e => _0x5d523e.status === "paid");
    const _0x3cf019 = _0x3083c8.filter(_0x109281 => _0x109281.status === "pending");
    const _0x3f70d4 = _0x6b6f9f.reduce((_0x3498c7, _0x1a5afc) => _0x3498c7 + (_0x1a5afc.amount || 0), 0);
    const _0x28788c = new Date().toISOString().slice(0, 10);
    const _0x57334b = _0x6b6f9f.filter(_0x5f07e3 => (_0x5f07e3.paid_at || "").slice(0, 10) === _0x28788c);
    const _0x4a2b1c = _0x57334b.reduce((_0x1da1bc, _0x1ec8bd) => _0x1da1bc + (_0x1ec8bd.amount || 0), 0);
    const _0x3aded1 = _0x6e5b2 => {
      if (_0x6e5b2 === "member_month") {
        return "<span style=\"color:var(--blue-600)\">月度会员</span>";
      }
      if (_0x6e5b2 === "member_year") {
        return "<span style=\"color:var(--purple-600,#7c3aed)\">年度会员</span>";
      }
      if (_0x6e5b2 === "program") {
        return "<span style=\"color:var(--green-600)\">购买作品</span>";
      }
      if (_0x6e5b2 === "resource") {
        return "<span style=\"color:var(--amber-600)\">购买资源</span>";
      }
      return _0x6e5b2 || "-";
    };
    const _0x5b7af1 = _0x421694 => {
      if (_0x421694 === "paid") {
        return "<span style=\"color:var(--green-600);font-weight:600\">已支付</span>";
      }
      if (_0x421694 === "pending") {
        return "<span style=\"color:var(--amber-500)\">待支付</span>";
      }
      return _0x421694 || "-";
    };
    _0x541535.innerHTML = "\n      <div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px\">\n        <div style=\"background:#fff;border-radius:12px;padding:20px;border:1px solid var(--gray-200);text-align:center\">\n          <div style=\"font-size:28px;font-weight:700;color:var(--blue-600)\">" + _0x3083c8.length + "</div>\n          <div style=\"font-size:12px;color:var(--gray-500);margin-top:4px\">总订单数</div>\n        </div>\n        <div style=\"background:#fff;border-radius:12px;padding:20px;border:1px solid var(--gray-200);text-align:center\">\n          <div style=\"font-size:28px;font-weight:700;color:var(--green-600)\">" + _0x6b6f9f.length + "</div>\n          <div style=\"font-size:12px;color:var(--gray-500);margin-top:4px\">成功支付</div>\n        </div>\n        <div style=\"background:#fff;border-radius:12px;padding:20px;border:1px solid var(--gray-200);text-align:center\">\n          <div style=\"font-size:28px;font-weight:700;color:var(--amber-600)\">&yen;" + (_0x3f70d4 / 100).toFixed(2) + "</div>\n          <div style=\"font-size:12px;color:var(--gray-500);margin-top:4px\">累计收入</div>\n        </div>\n        <div style=\"background:#fff;border-radius:12px;padding:20px;border:1px solid var(--gray-200);text-align:center\">\n          <div style=\"font-size:28px;font-weight:700;color:var(--purple-600,#7c3aed)\">&yen;" + (_0x4a2b1c / 100).toFixed(2) + "</div>\n          <div style=\"font-size:12px;color:var(--gray-500);margin-top:4px\">今日收入 (" + _0x57334b.length + "笔)</div>\n        </div>\n      </div>\n      <div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:16px\">\n          <h3 style=\"font-size:16px;color:var(--gray-800)\">📋 全部订单明细</h3>\n          <div style=\"display:flex;gap:8px;align-items:center\">\n            <select id=\"order-filter-status\" onchange=\"filterAdminOrders()\" style=\"padding:6px 10px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px\">\n              <option value=\"all\">全部状态</option>\n              <option value=\"paid\">已支付</option>\n              <option value=\"pending\">待支付</option>\n            </select>\n            <select id=\"order-filter-type\" onchange=\"filterAdminOrders()\" style=\"padding:6px 10px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px\">\n              <option value=\"all\">全部类型</option>\n              <option value=\"program\">购买作品</option>\n              <option value=\"resource\">购买资源</option>\n              <option value=\"member_month\">月度会员</option>\n              <option value=\"member_year\">年度会员</option>\n            </select>\n            <span style=\"font-size:12px;color:var(--gray-400)\">" + (_0x3cf019.length > 0 ? "(" + _0x3cf019.length + "笔待支付)" : "") + "</span>\n          </div>\n        </div>\n        " + (_0x3083c8.length > 0 ? "<div style=\"overflow-x:auto\"><table style=\"width:100%;border-collapse:collapse;font-size:13px\" id=\"admin-orders-table\">\n          <thead>\n            <tr style=\"background:var(--gray-50)\">\n              <th style=\"padding:10px;text-align:left;white-space:nowrap\">订单号</th>\n              <th style=\"padding:10px;text-align:left\">买家</th>\n              <th style=\"padding:10px;text-align:left\">类型</th>\n              <th style=\"padding:10px;text-align:left\">商品</th>\n              <th style=\"padding:10px;text-align:right\">金额</th>\n              <th style=\"padding:10px;text-align:center\">状态</th>\n              <th style=\"padding:10px;text-align:right\">下单时间</th>\n              <th style=\"padding:10px;text-align:right\">支付时间</th>\n            </tr>\n          </thead>\n          <tbody>\n            " + _0x3083c8.map(_0x3db266 => "<tr style=\"border-top:1px solid var(--gray-100)\" data-status=\"" + _0x3db266.status + "\" data-type=\"" + _0x3db266.item_type + "\">\n              <td style=\"padding:8px;font-family:monospace;font-size:11px;color:var(--gray-500);white-space:nowrap\">" + (_0x3db266.out_trade_no || "-") + "</td>\n              <td style=\"padding:8px\"><div style=\"font-weight:500\">" + (_0x3db266.nickname || "未知用户") + "</div><div style=\"font-size:10px;color:var(--gray-400)\">" + (_0x3db266.openid || "").substring(0, 16) + "...</div></td>\n              <td style=\"padding:8px\">" + _0x3aded1(_0x3db266.item_type) + "</td>\n              <td style=\"padding:8px\">" + (_0x3db266.program_title || (_0x3db266.item_type?.startsWith("member") ? "-" : "ID:" + _0x3db266.item_id)) + "</td>\n              <td style=\"padding:8px;text-align:right;font-weight:600\">&yen;" + (_0x3db266.amount / 100).toFixed(2) + "</td>\n              <td style=\"padding:8px;text-align:center\">" + _0x5b7af1(_0x3db266.status) + "</td>\n              <td style=\"padding:8px;text-align:right;color:var(--gray-400);font-size:12px;white-space:nowrap\">" + (_0x3db266.created_at || "-") + "</td>\n              <td style=\"padding:8px;text-align:right;color:var(--gray-400);font-size:12px;white-space:nowrap\">" + (_0x3db266.paid_at || "-") + "</td>\n            </tr>").join("") + "\n          </tbody>\n        </table></div>" : "<div style=\"text-align:center;padding:32px;color:var(--gray-400)\"><p>暂无订单数据</p></div>") + "\n      </div>";
  } catch (_0xa32e11) {
    _0x541535.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">网络错误</div>";
  }
}
function filterAdminOrders() {
  const _0x4c3968 = document.getElementById("order-filter-status")?.value || "all";
  const _0x5d04c = document.getElementById("order-filter-type")?.value || "all";
  document.querySelectorAll("#admin-orders-table tbody tr").forEach(_0x444738 => {
    const _0x2438e6 = _0x4c3968 === "all" || _0x444738.dataset.status === _0x4c3968;
    const _0x8c67fc = _0x5d04c === "all" || _0x444738.dataset.type === _0x5d04c;
    _0x444738.style.display = _0x2438e6 && _0x8c67fc ? "" : "none";
  });
}
async function renderAdminPurchases(_0x5bdd76) {
  try {
    const _0x3fbb0a = await apiFetch("/api/admin/purchases");
    if (!_0x3fbb0a.success) {
      _0x5bdd76.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载失败: " + htmlEscape(_0x3fbb0a.msg || "") + "</div>";
      return;
    }
    const _0x4d91c9 = _0x3fbb0a.purchases || [];
    const _0x48eb06 = {
      paid: "<span style=\"color:var(--green-600);font-weight:600\">已购买</span>",
      refund_requesting: "<span style=\"color:var(--amber-600)\">退款请求中</span>",
      refund_processing: "<span style=\"color:var(--amber-600)\">退款处理中</span>",
      refunded: "<span style=\"color:var(--gray-500)\">已退款</span>",
      refund_failed: "<span style=\"color:var(--red-500)\">退款失败</span>"
    };
    _0x5bdd76.innerHTML = "\n      <div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\">\n        <h3 style=\"font-size:16px;margin-bottom:8px;color:var(--gray-800)\">用户购买与退款</h3>\n        <p style=\"font-size:12px;color:var(--gray-500);margin-bottom:16px\">仅超级管理员可见。退款通过微信支付原路退回；退款发起后购买权限立即暂停，成功后恢复到购买前的试用次数。</p>\n        <div style=\"display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap\">\n          <input class=\"form-input\" id=\"admin-purchase-search\" type=\"search\"\n            placeholder=\"按作品名称、购买人昵称或 OpenID 搜索\"\n            oninput=\"filterAdminPurchases()\"\n            style=\"max-width:420px;padding:8px 12px\">\n          <span id=\"admin-purchase-search-count\" style=\"font-size:12px;color:var(--gray-400)\">共 " + _0x4d91c9.length + " 笔</span>\n        </div>\n        " + (_0x4d91c9.length ? "<div style=\"width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--gray-100);border-radius:8px\">\n        <table style=\"width:max-content;min-width:1150px;border-collapse:collapse;font-size:13px\" id=\"admin-purchases-table\">\n          <tr style=\"background:var(--gray-50)\">\n            <th style=\"padding:10px;text-align:left;min-width:150px\">购买人昵称</th>\n            <th style=\"padding:10px;text-align:left;min-width:260px\">购买人 OpenID</th>\n            <th style=\"padding:10px;text-align:left;min-width:220px\">作品</th>\n            <th style=\"padding:10px;text-align:right\">实付金额</th>\n            <th style=\"padding:10px;text-align:center\">购买状态</th>\n            <th style=\"padding:10px;text-align:center\">创作者收益</th>\n            <th style=\"padding:10px;text-align:right;min-width:150px\">支付时间</th>\n            <th style=\"padding:10px;text-align:center;min-width:130px\">操作</th>\n          </tr>\n          " + _0x4d91c9.map(_0x3f2376 => {
      const _0xc66a21 = _0x3f2376.status === "paid" && (!_0x3f2376.earning_status || _0x3f2376.earning_status === "pending");
      const _0x512cd8 = !_0x3f2376.earning_status ? "-" : _0x3f2376.earning_status === "pending" ? "待结算" : _0x3f2376.earning_status === "refunded" ? "已撤销" : _0x3f2376.earning_status === "refund_pending" ? "退款冻结" : "已进入提现";
      let _0xd5062 = "-";
      if (_0xc66a21) {
        _0xd5062 = "<button class=\"btn btn-sm\" style=\"background:var(--red-500);color:#fff\" onclick=\"adminRefundPurchase(" + _0x3f2376.id + ")\">退款退货</button>";
      } else if (_0x3f2376.status === "refund_requesting" || _0x3f2376.status === "refund_processing") {
        _0xd5062 = "<button class=\"btn btn-sm btn-outline\" onclick=\"adminSyncPurchaseRefund(" + _0x3f2376.id + ")\">同步退款状态</button>";
      } else if (_0x3f2376.status === "paid" && _0x3f2376.earning_status && _0x3f2376.earning_status !== "pending") {
        _0xd5062 = "<span style=\"font-size:11px;color:var(--red-500)\">收益已提现，暂不可退</span>";
      }
      const _0x34bf66 = _0x3f2376.nickname || "未知用户";
      const _0x359a6e = _0x3f2376.openid || "";
      const _0x2dc61b = _0x3f2376.program_title || "作品#" + _0x3f2376.item_id;
      return "<tr style=\"border-top:1px solid var(--gray-100)\"\n              data-search=\"" + htmlEscape((_0x34bf66 + " " + _0x359a6e + " " + _0x2dc61b).toLowerCase()) + "\">\n              <td style=\"padding:8px\">" + htmlEscape(_0x34bf66) + "</td>\n              <td style=\"padding:8px;font-family:monospace;font-size:11px;white-space:nowrap\">" + htmlEscape(_0x359a6e) + "</td>\n              <td style=\"padding:8px\">" + htmlEscape(_0x2dc61b) + "</td>\n              <td style=\"padding:8px;text-align:right;font-weight:600\">&yen;" + ((_0x3f2376.amount || 0) / 100).toFixed(2) + "</td>\n              <td style=\"padding:8px;text-align:center\">" + (_0x48eb06[_0x3f2376.status] || htmlEscape(_0x3f2376.status || "")) + "</td>\n              <td style=\"padding:8px;text-align:center\">" + _0x512cd8 + "</td>\n              <td style=\"padding:8px;text-align:right;color:var(--gray-400)\">" + htmlEscape(_0x3f2376.paid_at || "-") + "</td>\n              <td style=\"padding:8px;text-align:center\">" + _0xd5062 + "</td>\n            </tr>";
    }).join("") + "\n        </table></div>" : "<div style=\"text-align:center;padding:32px;color:var(--gray-400)\">暂无用户购买记录</div>") + "\n      </div>";
  } catch (_0x57b349) {
    _0x5bdd76.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">网络错误</div>";
  }
}
function filterAdminPurchases() {
  const _0x12d7e8 = (document.getElementById("admin-purchase-search")?.value || "").trim().toLowerCase();
  const _0x2c8aee = document.querySelectorAll("#admin-purchases-table tr[data-search]");
  let visible = 0;
  _0x2c8aee.forEach(_0x2ca71f => {
    const _0x564e14 = !_0x12d7e8 || (_0x2ca71f.dataset.search || "").includes(_0x12d7e8);
    _0x2ca71f.style.display = _0x564e14 ? "" : "none";
    if (_0x564e14) {
      visible++;
    }
  });
  const _0xe25f7 = document.getElementById("admin-purchase-search-count");
  if (_0xe25f7) {
    _0xe25f7.textContent = _0x12d7e8 ? "找到 " + visible + " 笔" : "共 " + _0x2c8aee.length + " 笔";
  }
}
async function adminRefundPurchase(_0x3d3207) {
  const _0x371eec = prompt("请输入退款原因。提交后将暂停用户购买权限，并通过微信支付原路退款：");
  if (_0x371eec === null) {
    return;
  }
  if (!_0x371eec.trim() || _0x371eec.trim().length > 80) {
    toast("请输入80字以内的退款原因", "error");
    return;
  }
  if (!confirm("确认对该订单执行全额原路退款并取消购买权限？")) {
    return;
  }
  const _0x5a1207 = await apiFetch("/api/admin/purchase/refund", {
    method: "POST",
    body: JSON.stringify({
      orderId: _0x3d3207,
      reason: _0x371eec.trim()
    })
  });
  toast(_0x5a1207.msg || (_0x5a1207.success ? "退款请求已提交" : "退款失败"), _0x5a1207.success ? "success" : "error");
  switchAdminTab(document.querySelector(".dash-tab.active"), "purchases");
}
async function adminSyncPurchaseRefund(_0x1f2ed4) {
  const _0x40a763 = await apiFetch("/api/admin/purchase/refund-sync", {
    method: "POST",
    body: JSON.stringify({
      orderId: _0x1f2ed4
    })
  });
  toast(_0x40a763.msg || (_0x40a763.success ? "状态已同步" : "同步失败"), _0x40a763.success ? "success" : "error");
  switchAdminTab(document.querySelector(".dash-tab.active"), "purchases");
}
function renderFooter() {
  const _0x56e452 = document.createElement("footer");
  _0x56e452.className = "site-footer";
  _0x56e452.innerHTML = "\n    <div class=\"footer-inner\">\n      <div class=\"footer-brand\">\n        <div class=\"logo\" style=\"color:#fff;pointer-events:none\">\n          <span class=\"brand-mark\" aria-hidden=\"true\"><img src=\"/assets/turing-brand-mark.svg\" width=\"36\" height=\"36\" alt=\"\"></span>\n          <div class=\"logo-text\" style=\"font-size:16px\">图灵智赋<span style=\"color:var(--blue-400)\">——AI赋能教育教学</span></div>\n        </div>\n        <p>让老师轻负担高效率地投入教育事业。<br>幸福而高效的老师，才能培养出幸福而有创造力的学生。</p>\n      </div>\n      <div class=\"footer-col\">\n        <h4>平台</h4>\n        <a href=\"#browse\" onclick=\"navigate('browse')\">探索程序</a>\n        <a href=\"#membership\" onclick=\"navigate('membership')\">会员中心</a>\n        <a href=\"#upload\" onclick=\"navigate('upload')\">上传作品</a>\n      </div>\n      <div class=\"footer-col\">\n        <h4>支持</h4>\n        <a href=\"javascript:void(0)\">使用帮助</a>\n        <a href=\"javascript:void(0)\">常见问题</a>\n        <a href=\"javascript:void(0)\">联系我们</a>\n      </div>\n      <div class=\"footer-col\">\n        <h4>合作</h4>\n        <a href=\"javascript:void(0)\" onclick=\"showEnterpriseForm()\">校园采购 / 政企合作</a>\n        <a href=\"javascript:void(0)\">服务协议</a>\n        <a href=\"javascript:void(0)\">隐私政策</a>\n      </div>\n    </div>\n    <div style=\"text-align:center;padding:12px 0 0;border-top:1px solid rgba(255,255,255,.06)\">\n      <a href=\"javascript:void(0)\" onclick=\"showEnterpriseForm()\" style=\"color:var(--blue-400);font-size:12px;text-decoration:none\">\n        校园批量采购 / 政企定制合作 — 专属折扣与培训服务\n      </a>\n    </div>\n    <div class=\"footer-bottom\">\n      <span>© 2026 图灵智赋. All rights reserved.</span>\n      <span>\n        <a href=\"https://beian.miit.gov.cn/\" target=\"_blank\" rel=\"noopener\" style=\"color:var(--gray-400);text-decoration:none\">粤ICP备2026040044号-1</a>\n        <span style=\"margin:0 8px;color:var(--gray-600)\">|</span>\n        <span style=\"color:var(--gray-500);font-size:11px\">粤公网安备 [备案号] 号</span>\n      </span>\n    </div>";
  return _0x56e452;
}
async function renderAdminFeedback(_0x30e7ae) {
  try {
    var _0x116745 = await apiFetch("/api/feedback/admin");
    const _0x59363f = _0x116745.feedback || _0x116745.feedbacks || [];
    if (!_0x116745.success || _0x59363f.length === 0) {
      _0x30e7ae.innerHTML = "<div style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:40px;text-align:center;color:var(--gray-400)\"><div style=\"font-size:32px;margin-bottom:12px\">💬</div><p>暂无反馈记录</p></div>";
      return;
    }
    var _0x68fc6f = "";
    _0x59363f.forEach(function (_0x3ccd49) {
      var _0x31f80c = _0x3ccd49.program_title || (_0x3ccd49.program_id ? "作品#" + _0x3ccd49.program_id : "-");
      var _0x361cf2 = _0x3ccd49.user_name || _0x3ccd49.openid || "未知";
      var _0x314ece = _0x3ccd49.admin_reply ? true : false;
      var _0x1b0e98 = _0x314ece ? "<span style=\"color:var(--green-600);font-weight:600\">已回复</span>" : "<span style=\"color:var(--red-500);font-weight:600\">待回复</span>";
      var _0x30937b = _0x314ece ? "" : "background:var(--amber-50);";
      _0x68fc6f += "<tr style=\"border-top:1px solid var(--gray-100);" + _0x30937b + "\"><td style=\"padding:8px;font-size:12px\">" + _0x361cf2 + "</td><td style=\"padding:8px;font-size:12px\">" + _0x31f80c + "</td><td style=\"padding:8px;font-size:13px;max-width:250px;word-break:break-all\">" + (_0x3ccd49.content || "") + "</td><td style=\"padding:8px;font-size:12px;color:var(--gray-400)\">" + (_0x3ccd49.created_at || "") + "</td><td style=\"padding:8px;font-size:12px\">" + _0x1b0e98 + "</td><td style=\"padding:8px;font-size:12px;max-width:200px\">" + (_0x3ccd49.admin_reply || "-") + "</td><td style=\"padding:8px;text-align:center;white-space:nowrap\"><button class=\"btn btn-sm btn-outline\" onclick=\"adminReplyFeedback(" + _0x3ccd49.id + ")\" style=\"margin:2px\">回复</button></td></tr>";
    });
    _0x30e7ae.innerHTML = "<div style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px\"><h3 style=\"font-size:16px;margin-bottom:16px\">💬 用户反馈管理</h3><table style=\"width:100%;border-collapse:collapse;font-size:13px\"><tr style=\"background:var(--gray-50)\"><th style=\"padding:10px;text-align:left\">用户</th><th style=\"padding:10px;text-align:left\">关联作品</th><th style=\"padding:10px;text-align:left\">内容</th><th style=\"padding:10px;text-align:left\">时间</th><th style=\"padding:10px;text-align:center\">状态</th><th style=\"padding:10px;text-align:left\">回复</th><th style=\"padding:10px;text-align:center\">操作</th></tr>" + _0x68fc6f + "</table></div>";
  } catch (_0x1ad390) {
    _0x30e7ae.innerHTML = "<div style=\"text-align:center;padding:40px;color:var(--gray-400)\">加载失败</div>";
  }
}
async function adminReplyFeedback(_0x5cf7f4) {
  var _0x5aab7b = prompt("输入回复内容:");
  if (!_0x5aab7b || !_0x5aab7b.trim()) {
    return;
  }
  try {
    var _0x30e5c5 = await apiFetch("/api/feedback/admin/reply", {
      method: "POST",
      body: JSON.stringify({
        id: _0x5cf7f4,
        reply: _0x5aab7b.trim()
      })
    });
    if (_0x30e5c5.success) {
      toast("回复成功", "success");
      var _0x4ea9b1 = document.getElementById("admin-content");
      if (_0x4ea9b1) {
        renderAdminFeedback(_0x4ea9b1);
      }
    } else {
      toast(data.msg || "回复失败", "error");
    }
  } catch (_0x15918b) {
    toast("网络错误", "error");
  }
}
async function renderAdminInquiries(_0x56c2ee) {
  _0x56c2ee.innerHTML = "<div data-inquiry-panel style=\"padding:32px;text-align:center\" role=\"status\">正在读取采购咨询…</div>";
  const _0x1aff8e = {};
  _0x56c2ee._inquiryRequest = _0x1aff8e;
  try {
    var _0x506e03 = await apiFetch("/api/inquiry/admin");
    if (!_0x56c2ee.isConnected || _0x56c2ee._inquiryRequest !== _0x1aff8e || !_0x56c2ee.querySelector("[data-inquiry-panel]")) {
      return;
    }
    if (!_0x506e03.success || !Array.isArray(_0x506e03.inquiries)) {
      throw new Error(_0x506e03.msg || "暂时无法读取采购咨询");
    }
    if (_0x506e03.inquiries.length === 0) {
      _0x56c2ee.innerHTML = "<div data-inquiry-panel style=\"background:#fff;border-radius:12px;border:1px solid var(--gray-200);padding:40px;text-align:center;color:var(--gray-500)\"><div style=\"font-size:32px;margin-bottom:12px\">🏫</div><p>暂无采购咨询</p></div>";
      return;
    }
    var _0x1141c5 = "";
    _0x506e03.inquiries.forEach(function (_0x8b7a7b) {
      var _0x4bb8c2 = _0x8b7a7b.status === "processed" ? "<span style=\"color:var(--green-600);font-weight:600\">已处理</span>" : "<span style=\"color:var(--amber-600);font-weight:600\">待处理</span>";
      var _0x58a9d8 = _0x8b7a7b.status !== "processed" && Number.isSafeInteger(_0x8b7a7b.id) && _0x8b7a7b.id > 0 ? "<button class=\"btn btn-sm btn-green\" onclick=\"adminProcessInquiry(" + _0x8b7a7b.id + ")\" style=\"margin:2px\">已处理</button>" : "";
      _0x1141c5 += "<tr style=\"border-top:1px solid var(--gray-100)\"><td style=\"padding:8px\">" + htmlEscape(String(_0x8b7a7b.org_name || _0x8b7a7b.orgName || "")) + "</td><td style=\"padding:8px\">" + htmlEscape(String(_0x8b7a7b.contact_name || _0x8b7a7b.contactName || "")) + "</td><td style=\"padding:8px;font-size:12px\">" + htmlEscape(String(_0x8b7a7b.title || "")) + "</td><td style=\"padding:8px\">" + htmlEscape(String(_0x8b7a7b.phone || "")) + "</td><td style=\"padding:8px;font-size:12px;max-width:200px\">" + htmlEscape(String(_0x8b7a7b.note || "")) + "</td><td style=\"padding:8px;font-size:12px;color:var(--gray-400)\">" + htmlEscape(String(_0x8b7a7b.created_at || "")) + "</td><td style=\"padding:8px;font-size:12px\">" + _0x4bb8c2 + "</td><td style=\"padding:8px;text-align:center\">" + _0x58a9d8 + "</td></tr>";
    });
    _0x56c2ee.innerHTML = "<div data-inquiry-panel style=\"background:#fff;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:24px;overflow-x:auto\"><h3 style=\"font-size:16px;margin-bottom:16px\">🏫 采购咨询管理</h3><table style=\"width:100%;border-collapse:collapse;font-size:13px\"><tr style=\"background:var(--gray-50)\"><th style=\"padding:10px;text-align:left\">机构名称</th><th style=\"padding:10px;text-align:left\">联系人</th><th style=\"padding:10px;text-align:left\">职务</th><th style=\"padding:10px;text-align:left\">电话</th><th style=\"padding:10px;text-align:left\">备注</th><th style=\"padding:10px;text-align:left\">时间</th><th style=\"padding:10px;text-align:center\">状态</th><th style=\"padding:10px;text-align:center\">操作</th></tr>" + _0x1141c5 + "</table></div>";
  } catch (_0x39b2a6) {
    if (!_0x56c2ee.isConnected || _0x56c2ee._inquiryRequest !== _0x1aff8e || !_0x56c2ee.querySelector("[data-inquiry-panel]")) {
      return;
    }
    _0x56c2ee.innerHTML = "<div data-inquiry-panel style=\"text-align:center;padding:32px\" role=\"alert\">采购咨询暂时无法加载，请重试。<br><button class=\"btn btn-outline btn-sm\" data-inquiry-retry>重新加载</button></div>";
    _0x56c2ee.querySelector("[data-inquiry-retry]").onclick = () => renderAdminInquiries(_0x56c2ee);
  }
}
async function adminProcessInquiry(_0x7408e1) {
  if (!confirm("确定标记为已处理？")) {
    return;
  }
  try {
    var _0x235994 = await apiFetch("/api/inquiry/admin/process", {
      method: "POST",
      body: JSON.stringify({
        id: _0x7408e1
      })
    });
    if (_0x235994.success) {
      toast("已标记为已处理", "success");
      var _0x261d12 = document.getElementById("admin-content");
      if (_0x261d12 && _0x261d12.querySelector("[data-inquiry-panel]")) {
        renderAdminInquiries(_0x261d12);
      }
    } else {
      toast(_0x235994.msg || "操作失败", "error");
    }
  } catch (_0x205333) {
    toast("网络错误", "error");
  }
}
function showEnterpriseForm() {
  const _0x48422f = document.createElement("div");
  _0x48422f.className = "modal-overlay";
  _0x48422f.onclick = _0x712ae0 => {
    if (_0x712ae0.target === _0x48422f) {
      _0x48422f.classList.remove("show");
      setTimeout(() => _0x48422f.remove(), 300);
    }
  };
  _0x48422f.innerHTML = "\n    <div class=\"modal enterprise-modal\" onclick=\"event.stopPropagation()\">\n      <div class=\"modal-close\">\n        <button class=\"modal-close-btn\" onclick=\"this.closest('.modal-overlay').classList.remove('show');setTimeout(()=>this.closest('.modal-overlay').remove(),300)\">✕</button>\n      </div>\n      <div class=\"enterprise-body\">\n        <div class=\"enterprise-badge\">🏫 校园采购 / 政企合作</div>\n        <h2>批量采购咨询</h2>\n        <p class=\"subtitle\">政府/校园批量采购可享专属折扣与定制培训课</p>\n        <div class=\"form-group\">\n          <label class=\"form-label\">学校 / 机构名称 <span style=\"color:var(--red-500)\">*</span></label>\n          <input class=\"form-input\" type=\"text\" id=\"ent-org\" placeholder=\"例如：佛山市第一中学\">\n        </div>\n        <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:14px\">\n          <div class=\"form-group\">\n            <label class=\"form-label\">联系人姓名 <span style=\"color:var(--red-500)\">*</span></label>\n            <input class=\"form-input\" type=\"text\" id=\"ent-name\" placeholder=\"您的姓名\">\n          </div>\n          <div class=\"form-group\">\n            <label class=\"form-label\">职务</label>\n            <select class=\"form-input\" id=\"ent-title\">\n              <option value=\"校长/副校长\">校长/副校长</option>\n              <option value=\"教务主任\">教务主任</option>\n              <option value=\"学科组长\">学科组长</option>\n              <option value=\"信息技术负责人\">信息技术负责人</option>\n              <option value=\"采购负责人\">采购负责人</option>\n              <option value=\"教师\">教师</option>\n              <option value=\"其他\">其他</option>\n            </select>\n          </div>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">联系电话 <span style=\"color:var(--red-500)\">*</span></label>\n          <input class=\"form-input\" type=\"tel\" id=\"ent-phone\" placeholder=\"方便联系的手机号码\" maxlength=\"11\">\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">采购意向简述</label>\n          <textarea class=\"form-input\" id=\"ent-desc\" rows=\"3\" placeholder=\"例如：计划为全校理科教师采购会员，约50人...\" style=\"resize:vertical\"></textarea>\n        </div>\n        <button class=\"btn btn-primary btn-block btn-lg\" onclick=\"submitEnterprise()\">提交咨询</button>\n        <p style=\"font-size:11px;color:var(--gray-400);text-align:center;margin-top:12px\">\n          提交后我们将在 1 个工作日内与您联系。信息仅用于合作洽谈，绝不外泄。\n        </p>\n      </div>\n    </div>";
  document.body.appendChild(_0x48422f);
  requestAnimationFrame(() => _0x48422f.classList.add("show"));
}
async function submitEnterprise() {
  const _0x2f351c = $("#ent-org")?.value;
  const _0x270b76 = $("#ent-name")?.value;
  const _0x2a6292 = $("#ent-title")?.value;
  const _0x462b09 = $("#ent-phone")?.value;
  const _0x576cdc = $("#ent-desc")?.value;
  if (!_0x2f351c) {
    toast("请填写学校/机构名称", "error");
    return;
  }
  if (!_0x270b76) {
    toast("请填写联系人姓名", "error");
    return;
  }
  if (!_0x462b09 || _0x462b09.length < 11) {
    toast("请填写正确的联系电话", "error");
    return;
  }
  try {
    const _0x271bc8 = await fetch(API_BASE + "/api/inquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orgName: _0x2f351c,
        contactName: _0x270b76,
        title: _0x2a6292 || "",
        phone: _0x462b09,
        note: _0x576cdc || ""
      })
    });
    const _0x592610 = await _0x271bc8.json();
    if (_0x592610.success) {
      toast("提交成功！我们将尽快与您联系", "success");
      const _0x43177b = $(".modal-overlay");
      if (_0x43177b) {
        _0x43177b.classList.remove("show");
        setTimeout(() => _0x43177b.remove(), 300);
      }
    } else {
      toast(_0x592610.msg || "提交失败", "error");
    }
  } catch (_0x256648) {
    toast("网络错误", "error");
  }
}
function revealLinkedCourse() {
  const _0x11bbb2 = window.TuringCourseLinks.parse(window.location.hash);
  if (_0x11bbb2?.page !== "browse" || State.currentPage !== "browse" || programsLoadedForToken !== (State.token || "")) {
    return;
  }
  const _0x1c80a1 = window.location.hash + "|" + (State.token || "");
  document.querySelectorAll(".course-link-notice").forEach(_0x27a72c => _0x27a72c.remove());
  if (PROGRAMS.some(_0x356a96 => _0x356a96.id === _0x11bbb2.programId)) {
    if (_0x1c80a1 === revealedCourseLink) {
      return;
    }
    revealedCourseLink = _0x1c80a1;
    showDetail(_0x11bbb2.programId);
    document.querySelector(".modal-overlay:last-child")?.classList.add("course-link-detail");
    return;
  }
  const _0x20171f = document.createElement("div");
  _0x20171f.className = "course-link-notice";
  _0x20171f.setAttribute("role", "status");
  _0x20171f.style.cssText = "margin:24px;padding:20px;background:#f8fafc;border:1px solid #dbe2ea;border-radius:12px";
  _0x20171f.textContent = !GUEST_PROGRAMS_LIMITED ? "这份课件当前不可用，可以浏览其他作品。" : "请登录后查看这份课件。";
  if (GUEST_PROGRAMS_LIMITED) {
    const _0x23d79c = document.createElement("button");
    _0x23d79c.textContent = "登录并继续";
    _0x23d79c.className = "btn btn-primary";
    _0x23d79c.onclick = () => showAuthModal();
    _0x20171f.append(_0x23d79c);
  }
  document.querySelector("#app").prepend(_0x20171f);
}
window.addEventListener("hashchange", () => {
  document.querySelectorAll(".course-link-detail").forEach(_0x10adb8 => _0x10adb8.remove());
  const _0x3fa54c = window.TuringCourseLinks.parse(window.location.hash);
  const _0xa52c39 = _0x3fa54c?.page || window.location.hash.slice(1) || "home";
  if (["home", "browse", "premium", "resources", "membership", "upload", "dashboard", "edit-upload"].includes(_0xa52c39) && (State.currentPage !== _0xa52c39 || _0x3fa54c)) {
    revealedCourseLink = "";
    State.currentPage = _0xa52c39;
    render();
  }
});
(function () {
  const _0x2364de = document.createElement("button");
  _0x2364de.className = "back-to-top";
  _0x2364de.innerHTML = "↑";
  _0x2364de.title = "回到顶部";
  _0x2364de.onclick = () => window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
  document.body.appendChild(_0x2364de);
  window.addEventListener("scroll", () => {
    _0x2364de.classList.toggle("visible", window.scrollY > 400);
  });
})();
function initScrollReveal() {
  const _0x583983 = new IntersectionObserver(_0x128872 => {
    _0x128872.forEach(_0x4204a1 => {
      if (_0x4204a1.isIntersecting) {
        _0x4204a1.target.classList.add("visible");
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: "0px 0px 0px 0px"
  });
  document.querySelectorAll(".reveal:not(.visible)").forEach(_0x21cab9 => _0x583983.observe(_0x21cab9));
  setTimeout(() => {
    document.querySelectorAll(".reveal:not(.visible)").forEach(_0xa9b770 => _0xa9b770.classList.add("visible"));
  }, 1500);
}
function animateCounters() {
  document.querySelectorAll("[data-count]").forEach(_0x270d58 => {
    if (_0x270d58.dataset.animated) {
      return;
    }
    const _0x531217 = parseFloat(_0x270d58.getAttribute("data-count"));
    const _0x1b9301 = _0x270d58.getAttribute("data-suffix") || "";
    const _0x48cc3a = _0x270d58.getAttribute("data-prefix") || "";
    const _0x11e8b6 = 1800;
    function runAnimation() {
      _0x270d58.dataset.animated = "1";
      const _0x2a626d = performance.now();
      function update(_0x546ed0) {
        const _0x27cb01 = Math.min((_0x546ed0 - _0x2a626d) / _0x11e8b6, 1);
        const _0x59e6a7 = 1 - Math.pow(1 - _0x27cb01, 3);
        const _0x117c75 = _0x531217 * _0x59e6a7;
        _0x270d58.textContent = _0x48cc3a + Math.floor(_0x117c75).toLocaleString() + _0x1b9301;
        if (_0x27cb01 < 1) {
          requestAnimationFrame(update);
        }
      }
      requestAnimationFrame(update);
    }
    const _0x5161d3 = new IntersectionObserver(_0x561293 => {
      _0x561293.forEach(_0x591633 => {
        if (_0x591633.isIntersecting) {
          runAnimation();
          _0x5161d3.unobserve(_0x270d58);
        }
      });
    }, {
      threshold: 0.2
    });
    _0x5161d3.observe(_0x270d58);
    setTimeout(() => {
      if (!_0x270d58.dataset.animated) {
        runAnimation();
      }
    }, 1000);
  });
}
const origRender = render;
render = function (_0x68c330) {
  origRender(_0x68c330);
  setTimeout(() => {
    initScrollReveal();
    animateCounters();
  }, 100);
};
const initHash = window.TuringCourseLinks.parse(window.location.hash)?.page || window.location.hash.slice(1) || "home";
State.currentPage = ["home", "browse", "premium", "resources", "membership", "upload", "dashboard", "admin", "edit-upload"].includes(initHash) ? initHash : "home";
render();
fetch("/api/premium/capabilities", {
  cache: "no-store"
}).then(_0x2b73c9 => _0x2b73c9.ok ? _0x2b73c9.json() : null).then(_0x33a4f8 => {
  if (_0x33a4f8?.enabled) {
    premiumCatalogueEnabled = true;
    premiumPlaybackEnabled = _0x33a4f8.playbackEnabled === true;
    const _0x2f6ea6 = document.querySelector(".site-header")?.parentElement;
    if (_0x2f6ea6) {
      _0x2f6ea6.replaceWith(renderHeader());
    }
    if (["home", "premium", "membership", "admin", "dashboard"].includes(State.currentPage)) {
      render();
    }
  }
}).catch(() => {});
fetch("/api/pay/vip-prices", {
  cache: "no-store"
}).then(_0x495e5e => _0x495e5e.ok ? _0x495e5e.json() : null).then(_0x14290f => {
  if (_0x14290f?.dynamic) {
    vipPricingEnabled = true;
    if (State.currentPage === "membership") {
      render();
    }
  }
}).catch(() => {});
(function () {
  const _0x413207 = window.location.hostname;
  if (!ALLOWED_HOSTS.includes(_0x413207) && !_0x413207.endsWith(".aifunengjiaoyu.com")) {
    document.body.innerHTML = "";
    const _0x2a1cdb = document.createElement("div");
    _0x2a1cdb.className = "domain-block-overlay";
    _0x2a1cdb.innerHTML = "<h1>非法盗版环境</h1><p>当前域名未经授权，无法使用本平台服务。<br>请访问官方网站：aifunengjiaoyu.com</p>";
    document.body.appendChild(_0x2a1cdb);
  }
})();
(function enableOnlineDebugProtection() {
  const _0x1e1ba7 = String(window.location.hostname || "").toLowerCase();
  const _0x24be6d = (_0x1e1ba7 === "aifunengjiaoyu.com" || _0x1e1ba7.endsWith(".aifunengjiaoyu.com")) && _0x1e1ba7 !== "dev.aifunengjiaoyu.com";
  if (!_0x24be6d) {
    return;
  }
  let _0x445099 = false;
  function redirectToBlankImmediately() {
    if (_0x445099) {
      return;
    }
    _0x445099 = true;
    window.stop();
    document.documentElement.innerHTML = "";
    window.location.replace("about:blank");
  }
  document.addEventListener("contextmenu", _0x4668c9 => {
    _0x4668c9.preventDefault();
  }, true);
  document.addEventListener("keydown", _0x262652 => {
    const _0x1c71b9 = String(_0x262652.key || "").toLowerCase();
    const _0x1cb53b = (_0x262652.ctrlKey || _0x262652.metaKey) && (_0x1c71b9 === "s" || _0x1c71b9 === "u") || _0x262652.metaKey && _0x262652.altKey && _0x1c71b9 === "u";
    const _0x747f3a = _0x1c71b9 === "f12" || (_0x262652.ctrlKey || _0x262652.metaKey) && _0x262652.shiftKey && (_0x1c71b9 === "i" || _0x1c71b9 === "j" || _0x1c71b9 === "c" || _0x1c71b9 === "k") || _0x262652.metaKey && _0x262652.altKey && (_0x1c71b9 === "i" || _0x1c71b9 === "j" || _0x1c71b9 === "c");
    if (_0x1cb53b) {
      _0x262652.preventDefault();
      _0x262652.stopImmediatePropagation();
      return;
    }
    if (_0x747f3a) {
      _0x262652.preventDefault();
      _0x262652.stopImmediatePropagation();
      redirectToBlankImmediately();
    }
  }, true);
  function detectDockedDevtools() {
    if (document.hidden || _0x445099) {
      return;
    }
    const _0x42ceaa = Math.max(0, window.outerWidth - window.innerWidth);
    const _0x16011f = Math.max(0, window.outerHeight - window.innerHeight);
    if (_0x42ceaa > 260 || _0x16011f > 260) {
      redirectToBlankImmediately();
    }
  }
  detectDockedDevtools();
  window.setInterval(detectDockedDevtools, 250);
})();
async function userUpdateOwnProgram(_0x5721da) {
  const _0x19f814 = parseFloat(document.getElementById("user-price-" + _0x5721da)?.value);
  if (isNaN(_0x19f814) || _0x19f814 < 0) {
    toast("价格格式不正确", "error");
    return;
  }
  if (!State.token) {
    showAuthModal();
    toast("请先登录", "error");
    return;
  }
  toast("正在同步到云端...", "info");
  const _0x29b846 = await fetch(API_BASE + "/api/programs/self-price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + State.token
    },
    body: JSON.stringify({
      id: _0x5721da,
      price: _0x19f814
    })
  });
  var _0x5642ad = await _0x29b846.json();
  if (_0x5642ad.success) {
    toast("作品价格已更新！", "success");
    loadProgramsFromDatabase();
  } else {
    toast(_0x5642ad.msg || "改价失败，请稍后再试", "error");
  }
}
async function userDelistProgram(_0x4932d6) {
  if (!confirm("确定要下架此作品吗？下架后可重新修改并提交审核。")) {
    return;
  }
  var _0x28c8fb = await fetch(API_BASE + "/api/programs/self-delist", {
    method: "POST",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, State.token ? {
      Authorization: "Bearer " + State.token
    } : {}),
    body: JSON.stringify({
      id: _0x4932d6
    })
  });
  var _0x22e088 = await _0x28c8fb.json();
  if (_0x22e088.success) {
    toast("作品已下架，可修改后重新提交", "success");
    await loadProgramsFromDatabase();
    PROGRAMS_ALL = [];
    switchDashTab(document.querySelector(".dash-tab.active"), "uploaded");
  } else {
    toast(_0x22e088.msg || "操作失败", "error");
  }
}
async function userResubmitProgram(_0x13bef1) {
  if (!confirm("确定要重新提交审核吗？")) {
    return;
  }
  var _0x58d0f1 = await fetch(API_BASE + "/api/programs/resubmit", {
    method: "POST",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, State.token ? {
      Authorization: "Bearer " + State.token
    } : {}),
    body: JSON.stringify({
      id: _0x13bef1
    })
  });
  var _0x1d8641 = await _0x58d0f1.json();
  if (_0x1d8641.success) {
    toast("已重新提交审核，请等待管理员审核", "success");
    await loadProgramsFromDatabase();
    PROGRAMS_ALL = [];
    switchDashTab(document.querySelector(".dash-tab.active"), "uploaded");
  } else {
    toast(_0x1d8641.msg || "操作失败", "error");
  }
}
async function userCancelReview(_0x2a9fb3) {
  if (!confirm("确定要取消审核吗？作品将退回草稿状态。")) {
    return;
  }
  var _0x27fb99 = await fetch(API_BASE + "/api/programs/cancel-review", {
    method: "POST",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, State.token ? {
      Authorization: "Bearer " + State.token
    } : {}),
    body: JSON.stringify({
      id: _0x2a9fb3
    })
  });
  var _0x459f0e = await _0x27fb99.json();
  if (_0x459f0e.success) {
    toast("已取消审核，作品退回到草稿", "success");
    await loadProgramsFromDatabase();
    PROGRAMS_ALL = [];
    switchDashTab(document.querySelector(".dash-tab.active"), "uploaded");
  } else {
    toast(_0x459f0e.msg || "操作失败", "error");
  }
}
async function userDeleteProgram(_0xf8633c) {
  if (!confirm("确定要永久删除此作品吗？删除后不可恢复。")) {
    return;
  }
  var _0x4696b6 = await fetch(API_BASE + "/api/programs/self-delete", {
    method: "POST",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, State.token ? {
      Authorization: "Bearer " + State.token
    } : {}),
    body: JSON.stringify({
      id: _0xf8633c
    })
  });
  var _0x1f5c31 = await _0x4696b6.json();
  if (_0x1f5c31.success) {
    toast("作品已永久删除", "success");
    await loadProgramsFromDatabase();
    PROGRAMS_ALL = [];
    switchDashTab(document.querySelector(".dash-tab.active"), "uploaded");
  } else {
    toast(_0x1f5c31.msg || "删除失败", "error");
  }
}
function openEditProgram(_0x590b96) {
  State.editProgramId = _0x590b96;
  State.currentPage = "edit-upload";
  render();
}
let editUploadedFile = null;
function renderEditUpload() {
  if (!State.user) {
    setTimeout(function () {
      showAuthModal();
      toast("请先登录", "error");
    }, 100);
    var _0x126380 = document.createElement("div");
    _0x126380.style.cssText = "margin-top:var(--header-h);padding:120px 24px;text-align:center;color:var(--gray-400)";
    _0x126380.innerHTML = "<div style=\"font-size:48px;margin-bottom:16px\">🔒</div><p style=\"font-size:16px\">请先登录后访问此页面</p>";
    return _0x126380;
  }
  var _0x57b8fd = document.createElement("div");
  _0x57b8fd.className = "upload-page";
  _0x57b8fd.innerHTML = "<div style=\"text-align:center;padding:80px;color:var(--gray-400)\">加载作品数据中...</div>";
  editUploadedFile = null;
  (async function () {
    try {
      var _0x23d0d6 = PROGRAMS.find(function (_0x110e8a) {
        return _0x110e8a.id === State.editProgramId;
      });
      try {
        var _0x245b5c = await fetch(API_BASE + "/api/programs?myOpenid=1", {
          headers: State.token ? {
            Authorization: "Bearer " + State.token
          } : {}
        });
        var _0x425034 = await _0x245b5c.json();
        if (_0x425034.success) {
          var _0x2d3d68 = (_0x425034.programs || []).find(function (_0x5674bb) {
            return _0x5674bb.id === State.editProgramId;
          });
          if (_0x2d3d68) {
            _0x23d0d6 = _0x2d3d68;
          }
        }
      } catch (_0x5ab07a) {}
      if (!_0x23d0d6) {
        _0x57b8fd.innerHTML = "<div style=\"text-align:center;padding:80px;color:var(--red-500)\">找不到该作品</div>";
        return;
      }
      var _0x21e430 = _0x23d0d6.source_kind === "external";
      var _0xd60bec = null;
      if (!_0x21e430) {
        try {
          var _0x34cbe2 = sessionStorage.getItem("tuxiaoling_upload_html");
          if (_0x34cbe2) {
            _0xd60bec = _0x34cbe2;
            sessionStorage.removeItem("tuxiaoling_upload_html");
            sessionStorage.removeItem("tuxiaoling_upload_title");
            sessionStorage.removeItem("tuxiaoling_edit_prog_id");
            window._pendingEditHtml = _0x34cbe2;
          }
        } catch (_0x578cb5) {}
      } else {
        window._pendingEditHtml = null;
      }
      var _0xf870c6 = SUBJECTS.filter(function (_0xbb8671) {
        return _0xbb8671 !== "全部";
      }).map(function (_0x306c2f) {
        return "<option value=\"" + _0x306c2f + "\"" + (_0x306c2f === _0x23d0d6.subject ? " selected" : "") + ">" + _0x306c2f + "</option>";
      }).join("");
      var _0x3227e8 = GRADES.filter(function (_0x42a5ca) {
        return _0x42a5ca !== "全部";
      }).map(function (_0x11b961) {
        return "<option value=\"" + _0x11b961 + "\"" + (_0x11b961 === _0x23d0d6.grade ? " selected" : "") + ">" + _0x11b961 + "</option>";
      }).join("");
      var _0x2de572 = GRADE_LEVELS[_0x23d0d6.grade] || [];
      var _0x236037 = "<option value=\"\">不限</option>" + _0x2de572.map(function (_0xb8c676) {
        return "<option value=\"" + _0xb8c676 + "\"" + (_0xb8c676 === _0x23d0d6.grade_level ? " selected" : "") + ">" + _0xb8c676 + "</option>";
      }).join("");
      var _0x1a5150 = TYPES.filter(function (_0x5223d4) {
        return _0x5223d4 !== "全部";
      }).map(function (_0x2e3b2c) {
        return "<option value=\"" + _0x2e3b2c + "\"" + (_0x2e3b2c === _0x23d0d6.type ? " selected" : "") + ">" + _0x2e3b2c + "</option>";
      }).join("");
      var _0x39a785 = "";
      if (_0x23d0d6.cover_url) {
        _0x39a785 = "<div style=\"margin-top:10px\"><img src=\"" + API_BASE + _0x23d0d6.cover_url + "\" style=\"max-height:120px;border-radius:8px;border:1px solid var(--gray-200)\"><div style=\"font-size:11px;color:var(--gray-400);margin-top:4px\">当前封面（选择新文件将替换）</div></div>";
      }
      window._editDescState = {
        removedUrls: {},
        existingUrls: [],
        newFiles: []
      };
      var _0x20d56d = "";
      if (_0x23d0d6.desc_images) {
        try {
          var _0x38f298 = JSON.parse(_0x23d0d6.desc_images);
          if (_0x38f298 && _0x38f298.length > 0) {
            window._editDescState.existingUrls = _0x38f298.slice();
            _0x20d56d = _0x38f298.map(function (_0x298f89, _0x285465) {
              return "<div style=\"position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--gray-200);flex-shrink:0\" data-desc-url=\"" + _0x298f89.replace(/"/g, "&quot;") + "\"><img src=\"" + API_BASE + _0x298f89 + "\" style=\"width:100%;height:100%;object-fit:cover\"><button type=\"button\" onclick=\"editRemoveDescImage(this,'" + _0x298f89.replace(/"/g, "&quot;") + "')\" style=\"position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;font-size:12px;cursor:pointer;line-height:20px;text-align:center;padding:0\">✕</button></div>";
            }).join("") + "<div style=\"font-size:11px;color:var(--gray-400);align-self:center\">点击 × 可删除</div>";
          }
        } catch (_0x150c61) {}
      }
      window.updateEditGradeLevels = function () {
        var _0x1dc68d = document.getElementById("edit-grade");
        var _0x4fb5bb = document.getElementById("edit-grade-level");
        if (!_0x1dc68d || !_0x4fb5bb) {
          return;
        }
        var _0x496320 = _0x1dc68d.value;
        var _0x5e47b8 = GRADE_LEVELS[_0x496320] || [];
        var _0x4be22d = _0x4fb5bb.value;
        _0x4fb5bb.innerHTML = "<option value=\"\">不限</option>" + _0x5e47b8.map(function (_0x435c4c) {
          return "<option value=\"" + _0x435c4c + "\"" + (_0x435c4c === _0x4be22d ? " selected" : "") + ">" + _0x435c4c + "</option>";
        }).join("");
      };
      var _0x15d638 = "";
      if (_0x23d0d6.attachment_name) {
        _0x15d638 = "<div style=\"font-size:12px;color:var(--gray-500);margin-top:6px\">📎 当前附件: " + _0x23d0d6.attachment_name + "（选择新文件将替换）</div>";
      }
      var _0x1821bd = !_0x23d0d6.price || _0x23d0d6.price === 0 ? " active" : "";
      var _0x42e780 = _0x23d0d6.price && _0x23d0d6.price > 0 ? " active" : "";
      var _0xc3a978 = _0x23d0d6.price && _0x23d0d6.price > 0 ? "" : "display:none";
      var _0x44a74a = _0x21e430 ? "<div class=\"upload-section\"><h3>1. 网页地址</h3><div class=\"form-group\"><input class=\"form-input\" type=\"url\" id=\"edit-external-url\" value=\"" + htmlEscape(_0x23d0d6.external_url || "") + "\" placeholder=\"https://example.com/  （仅支持 https，不支持 http）\" autocomplete=\"off\"><p class=\"hint\" style=\"margin-top:8px;color:var(--gray-500);font-size:12px\">该链接将以受限 iframe 嵌入展示。若目标网站禁止被嵌入（X-Frame-Options/CSP），将无法正常显示。</p></div></div>" : "<div class=\"upload-section\"><h3>1. 核心文件</h3><div style=\"margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap\"><button class=\"btn btn-outline\" onclick=\"editLoadToTuxiaoling(" + _0x23d0d6.id + ")\" style=\"font-size:13px\">🤖 在图小灵中继续修改</button><span style=\"font-size:12px;color:var(--gray-500);align-self:center\">打开图小灵加载此作品的 HTML，可以继续对话修改</span></div><div class=\"dual-upload\"><div><div class=\"upload-label\">重新上传文件（可选，不选则保留原文件）</div><div class=\"upload-dropzone\" onclick=\"document.getElementById('edit-file-input').click()\" ondragover=\"event.preventDefault();this.style.borderColor='var(--blue-400)'\"><div class=\"upload-dropzone-icon\" id=\"edit-file-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div><p id=\"edit-file-name-display\">点击选择或拖拽新文件（可选）</p><p class=\"hint\">支持 .html 或 .zip 项目包（含JS/GLB/JSON等依赖），不超过 500MB</p></div><input type=\"file\" id=\"edit-file-input\" accept=\".html,.htm,.zip\" style=\"display:none\" onchange=\"handleEditFileSelect(this)\"></div><div><div class=\"upload-label\">配套教案/附件（可选）</div><div class=\"upload-dropzone\" onclick=\"document.getElementById('edit-attach-input').click()\"><div class=\"upload-dropzone-icon\" id=\"edit-attach-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div><p id=\"edit-attach-name-display\">选择新附件（可选）</p><p class=\"hint\">ZIP / PDF / PPT / 图片，不超过 50MB</p></div><input type=\"file\" id=\"edit-attach-input\" accept=\".zip,.rar,.pdf,.ppt,.pptx,.doc,.docx,.jpg,.png\" style=\"display:none\" onchange=\"handleEditAttachSelect(this)\">" + _0x15d638 + "</div></div></div>";
      _0x57b8fd.innerHTML = "<h1>✏️ 编辑作品</h1><p class=\"page-desc\">修改作品信息后重新提交审核</p>" + (_0xd60bec ? "<div style=\"background:#e8f5e9;border:1px solid #a5d6a7;border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:10px\"><span style=\"font-size:20px\">✅</span><div><strong>图小灵已生成新版本</strong><br><span style=\"font-size:13px;color:var(--gray-600)\">来自图小灵修改的新 HTML 已就绪，点击下方保存按钮即可更新。</span></div></div>" : "") + _0x44a74a + "<div class=\"upload-section\"><h3>2. 封面图片（可选，不选则保留原封面）</h3><div class=\"upload-dropzone\" id=\"edit-cover-dropzone\" onclick=\"document.getElementById('edit-cover-input').click()\" style=\"padding:32px;position:relative\">" + (_0x23d0d6.cover_url ? "<img id=\"edit-cover-preview\" src=\"" + API_BASE + _0x23d0d6.cover_url + "\" style=\"width:100%;max-height:200px;object-fit:contain;border-radius:8px\">" : "<div id=\"edit-cover-placeholder\"><div class=\"upload-dropzone-icon\" id=\"edit-cover-icon\" style=\"color:#bbb;font-size:32px;font-weight:200\">+</div><p>点击选择新封面图片</p><p class=\"hint\">建议尺寸 800x500，支持 JPG/PNG 格式</p></div>") + "</div><input type=\"file\" id=\"edit-cover-input\" accept=\"image/*\" style=\"display:none\" onchange=\"handleEditCoverSelect(this)\"></div><div class=\"upload-section\"><h3>可选：作品演示视频</h3><p style=\"font-size:12px;color:var(--gray-400);margin-bottom:10px\">已上架作品替换视频不会立即公开，会提交给管理员审核；审核通过前仍展示当前视频。</p>" + (_0x23d0d6.video_url ? "<div style=\"margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap\"><button class=\"btn btn-outline btn-sm\" onclick=\"openProgramVideo(" + _0x23d0d6.id + ")\">▶ 查看当前演示视频</button><span style=\"font-size:12px;color:var(--gray-500)\">" + htmlEscape(_0x23d0d6.video_name || "当前已有演示视频") + "</span></div>" : "<div style=\"font-size:12px;color:var(--gray-400);margin-bottom:10px\">当前没有演示视频，作品仍会按原封面展示。</div>") + (_0x23d0d6.pending_video_url ? "<div style=\"margin-bottom:10px;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:12px;color:#9a3412\">已有待审核演示视频：" + htmlEscape(_0x23d0d6.pending_video_name || "未命名视频") + "</div>" : "") + "<div class=\"upload-dropzone\" onclick=\"document.getElementById('edit-program-video-input').click()\" style=\"padding:22px\"><div class=\"upload-dropzone-icon\" id=\"edit-program-video-icon\" style=\"color:#bbb;font-size:30px;font-weight:200\">+</div><p id=\"edit-program-video-name-display\">选择新演示视频（可选）</p><p class=\"hint\">MP4 / MOV，普通作者不超过 200MB</p></div><input type=\"file\" id=\"edit-program-video-input\" accept=\"video/mp4,video/quicktime,.mp4,.mov\" style=\"display:none\" onchange=\"handleEditProgramVideoSelect(this)\"><div style=\"margin-top:10px;display:flex;gap:8px;flex-wrap:wrap\"><button class=\"btn btn-outline btn-sm\" type=\"button\" onclick=\"submitEditProgramVideo(" + _0x23d0d6.id + ")\">提交视频审核</button>" + (_0x23d0d6.pending_video_url ? "<button class=\"btn btn-ghost btn-sm\" type=\"button\" onclick=\"cancelEditProgramVideo(" + _0x23d0d6.id + ")\">撤回待审视频</button>" : "") + "</div></div><div class=\"upload-section\"><h3>作品展示图（可选，最多5张）</h3><div id=\"edit-desc-images-container\"><div class=\"edit-desc-images-grid\" id=\"edit-desc-images-grid\" style=\"display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;min-height:40px\">" + (_0x20d56d || "") + "<div onclick=\"document.getElementById('edit-desc-images-input').click()\" style=\"width:80px;height:80px;border:2px dashed var(--gray-300);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gray-400);font-size:28px;font-weight:200\">+</div></div><div id=\"edit-desc-new-previews\" style=\"display:flex;gap:10px;margin-top:8px;flex-wrap:wrap\"></div></div><input type=\"file\" id=\"edit-desc-images-input\" accept=\"image/*\" multiple style=\"display:none\" onchange=\"handleEditDescImagesSelect(this)\"></div><div class=\"upload-section\"><h3>3. 基本信息</h3><div style=\"display:grid;grid-template-columns:1fr 1fr;gap:14px\"><div class=\"form-group\"><label class=\"form-label\">作品标题 <span style=\"color:var(--red-500)\">*</span></label><input class=\"form-input\" type=\"text\" id=\"edit-title\" value=\"" + (_0x23d0d6.title || "").replace(/"/g, "&quot;") + "\"></div><div class=\"form-group\"><label class=\"form-label\">作者署名</label><input class=\"form-input\" type=\"text\" id=\"edit-author-alias\" value=\"" + htmlEscape(_0x23d0d6.author || "") + "\"" + (State.user && (State.user.role === "admin" || State.user.role === "moderator") ? "" : " readonly") + "></div></div><div class=\"form-group\"><label class=\"form-label\">作品详细介绍</label><div class=\"rich-editor-area form-input\" id=\"edit-desc\" contenteditable=\"true\" data-placeholder=\"图文并茂地介绍您的作品：功能亮点、适用年级、课堂使用场景等...\"></div></div><div style=\"display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px\"><div class=\"form-group\"><label class=\"form-label\">学科</label><select class=\"form-input\" id=\"edit-subject\">" + _0xf870c6 + "</select></div><div class=\"form-group\"><label class=\"form-label\">学段</label><select class=\"form-input\" id=\"edit-grade\" onchange=\"updateEditGradeLevels()\">" + _0x3227e8 + "</select></div><div class=\"form-group\"><label class=\"form-label\">年级</label><select class=\"form-input\" id=\"edit-grade-level\">" + _0x236037 + "</select></div><div class=\"form-group\"><label class=\"form-label\">类型</label><select class=\"form-input\" id=\"edit-type\">" + _0x1a5150 + "</select></div></div></div><div class=\"upload-section\"><h3>4. 定价设置</h3><div class=\"pricing-options\"><button class=\"pricing-option" + _0x1821bd + "\" onclick=\"selectPricing(this,'free')\"><div class=\"po-label\">🆓 免费</div></button><button class=\"pricing-option" + _0x42e780 + "\" onclick=\"selectPricing(this,'paid')\"><div class=\"po-label\">💰 付费</div></button></div><div id=\"price-input-area\" style=\"" + _0xc3a978 + "\"><div class=\"form-group\"><label class=\"form-label\">定价（元）</label><input class=\"form-input\" type=\"number\" id=\"upload-price\" min=\"0.1\" step=\"0.1\" value=\"" + (_0x23d0d6.price || "") + "\" placeholder=\"建议 1.0 ~ 50.0 元\"></div></div></div><div style=\"text-align:center;margin-top:8px\"><button class=\"btn btn-primary btn-lg\" onclick=\"submitEditUpload()\" style=\"min-width:280px\">📝 保存修改并重新提交审核</button><p style=\"font-size:12px;color:var(--gray-400);margin-top:12px\">修改后将重新进入审核流程</p><button class=\"btn btn-ghost\" onclick=\"navigate('dashboard')\" style=\"margin-top:8px\">返回我的仪表盘</button></div>";
      var _0x2bf911 = document.getElementById("edit-desc");
      if (_0x2bf911 && _0x23d0d6.desc) {
        _0x2bf911.innerHTML = _0x23d0d6.desc;
      }
    } catch (_0x80ad33) {
      _0x57b8fd.innerHTML = "<div style=\"text-align:center;padding:60px;color:var(--red-500)\">❌ 加载出错: " + (_0x80ad33.message || "未知错误") + "</div>";
      console.error("[edit]", _0x80ad33);
    }
  })();
  return _0x57b8fd;
}
function handleEditFileSelect(_0x30dc2d) {
  if (_0x30dc2d.files[0]) {
    var _0x15b72e = _0x30dc2d.files[0];
    var _0xb461d6 = _0x15b72e.size / 1048576;
    if (_0xb461d6 > 10) {
      toast("文件大小不能超过 10MB", "error");
      return;
    }
    editUploadedFile = _0x15b72e;
    var _0x3b24c5 = document.getElementById("edit-file-name-display");
    if (_0x3b24c5) {
      _0x3b24c5.textContent = "✅ 已选择: " + _0x15b72e.name + " (" + _0xb461d6.toFixed(1) + "MB)";
    }
    var _0x20095e = document.getElementById("edit-file-icon");
    if (_0x20095e) {
      _0x20095e.textContent = "✅";
      _0x20095e.style.color = "#22c55e";
    }
    toast("文件已选择", "success");
  }
}
function handleEditAttachSelect(_0x2c7e92) {
  if (_0x2c7e92.files[0]) {
    var _0x3bdff5 = document.getElementById("edit-attach-name-display");
    if (_0x3bdff5) {
      _0x3bdff5.textContent = "✅ 已选择: " + _0x2c7e92.files[0].name;
    }
    var _0x4ce615 = document.getElementById("edit-attach-icon");
    if (_0x4ce615) {
      _0x4ce615.textContent = "✅";
      _0x4ce615.style.color = "#22c55e";
    }
  }
}
function handleEditCoverSelect(_0x2b3353) {
  if (_0x2b3353.files[0]) {
    var _0x179cdf = _0x2b3353.files[0];
    var _0x2ef5b0 = new FileReader();
    _0x2ef5b0.onload = function (_0x45210f) {
      var _0x361f6a = document.getElementById("edit-cover-dropzone");
      if (_0x361f6a) {
        _0x361f6a.innerHTML = "<img src=\"" + _0x45210f.target.result + "\" style=\"width:100%;max-height:200px;object-fit:contain;border-radius:8px\">";
      }
    };
    _0x2ef5b0.readAsDataURL(_0x179cdf);
  }
}
let editProgramVideoFile = null;
function handleEditProgramVideoSelect(_0x252b83) {
  const _0x383f89 = _0x252b83 && _0x252b83.files && _0x252b83.files[0];
  if (!_0x383f89) {
    return;
  }
  if (!/\.(mp4|mov)$/i.test(_0x383f89.name || "")) {
    toast("演示视频仅支持 MP4 或 MOV", "error");
    _0x252b83.value = "";
    editProgramVideoFile = null;
    return;
  }
  const _0x537485 = 209715200;
  if (_0x383f89.size > _0x537485) {
    toast("普通作者演示视频不能超过 200MB", "error");
    _0x252b83.value = "";
    editProgramVideoFile = null;
    return;
  }
  editProgramVideoFile = _0x383f89;
  const _0x2cfc37 = (_0x383f89.size / 1048576).toFixed(1);
  const _0x35d875 = document.getElementById("edit-program-video-name-display");
  if (_0x35d875) {
    _0x35d875.textContent = "已选择: " + _0x383f89.name + " (" + _0x2cfc37 + "MB)";
  }
  const _0x3a2667 = document.getElementById("edit-program-video-icon");
  if (_0x3a2667) {
    _0x3a2667.textContent = "✓";
    _0x3a2667.style.color = "#22c55e";
  }
}
async function submitEditProgramVideo(_0x1e3d17) {
  if (!editProgramVideoFile) {
    return toast("请先选择要提交的演示视频", "error");
  }
  const _0x2e78a6 = await submitProgramVideo(_0x1e3d17, editProgramVideoFile);
  if (_0x2e78a6.success) {
    toast("演示视频已提交审核，通过前当前公开视频不变", "success");
    editProgramVideoFile = null;
    await loadProgramsFromDatabase();
    render();
  } else {
    toast(_0x2e78a6.msg || "演示视频提交失败", "error");
  }
}
async function cancelEditProgramVideo(_0x433f7f) {
  if (!confirm("确定撤回待审核的演示视频吗？视频文件会直接删除，不进入回收站。")) {
    return;
  }
  const _0x3997b2 = await fetch(API_BASE + "/api/programs/" + encodeURIComponent(_0x433f7f) + "/video-submission", {
    method: "DELETE",
    headers: State.token ? {
      Authorization: "Bearer " + State.token
    } : {}
  });
  const _0x4238cb = await _0x3997b2.json();
  if (_0x4238cb.success) {
    toast("待审演示视频已撤回并删除", "success");
    await loadProgramsFromDatabase();
    render();
  } else {
    toast(_0x4238cb.msg || "撤回失败", "error");
  }
}
function handleEditDescImagesSelect(_0x58507a) {
  if (!_0x58507a.files || _0x58507a.files.length === 0) {
    return;
  }
  var _0x16563e = window._editDescState || {
    newFiles: []
  };
  for (var _0x4b0a19 = 0; _0x4b0a19 < Math.min(_0x58507a.files.length, 5); _0x4b0a19++) {
    _0x16563e.newFiles.push(_0x58507a.files[_0x4b0a19]);
  }
  var _0x3048fb = document.getElementById("edit-desc-new-previews");
  if (!_0x3048fb) {
    return;
  }
  _0x3048fb.innerHTML = "";
  _0x16563e.newFiles.forEach(function (_0x17d063, _0x8194f3) {
    var _0xc50958 = new FileReader();
    _0xc50958._idx = _0x8194f3;
    _0xc50958.onload = function (_0x897029) {
      var _0x62a941 = document.createElement("div");
      _0x62a941.style.cssText = "position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--gray-200);flex-shrink:0";
      _0x62a941.innerHTML = "<img src=\"" + _0x897029.target.result + "\" style=\"width:100%;height:100%;object-fit:cover\"><button type=\"button\" onclick=\"this.parentElement.remove();window._editDescState.newFiles.splice(" + _0x897029.target._idx + ",1)\" style=\"position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;font-size:12px;cursor:pointer;line-height:20px;text-align:center;padding:0\">✕</button>";
      _0x3048fb.appendChild(_0x62a941);
    };
    _0xc50958.readAsDataURL(_0x17d063);
  });
}
function editRemoveDescImage(_0x37e709, _0x38c2de) {
  var _0x31758a = _0x37e709.parentElement;
  _0x31758a.style.opacity = "0.3";
  _0x31758a.style.pointerEvents = "none";
  var _0x53024d = window._editDescState;
  if (_0x53024d) {
    _0x53024d.removedUrls[_0x38c2de] = true;
  }
}
async function submitEditUpload() {
  if (!State.token) {
    showAuthModal();
    toast("请先登录", "error");
    return;
  }
  var _0x12fb07 = State.editProgramId;
  var _0x32325 = document.getElementById("edit-title")?.value?.trim();
  var _0xd839d7 = document.getElementById("edit-desc");
  var _0x2e2405 = _0xd839d7 ? _0xd839d7.innerHTML : "";
  if (_0x2e2405) {
    var _0x4137c0 = _0xd839d7.textContent.trim();
    if (!_0x4137c0) {
      _0x2e2405 = "";
    }
  }
  var _0x29570c = document.getElementById("edit-subject")?.value;
  var _0x2319eb = document.getElementById("edit-grade")?.value;
  var _0xedd205 = document.getElementById("edit-grade-level")?.value || "";
  var _0x3c8e5d = document.getElementById("edit-type")?.value;
  var _0x4f40e7 = document.getElementById("edit-author-alias")?.value?.trim();
  var _0x14e03d = document.getElementById("edit-external-url");
  var _0x4b3920 = _0x14e03d ? _0x14e03d.value.trim() : null;
  var _0x187294 = document.getElementById("upload-price");
  var _0x5904a4 = document.getElementById("price-input-area");
  var _0x74e6b6 = 0;
  if (_0x5904a4 && _0x5904a4.style.display !== "none" && _0x187294) {
    _0x74e6b6 = parseFloat(_0x187294.value) || 0;
  }
  if (!_0x32325) {
    toast("标题不能为空", "error");
    return;
  }
  if (_0x14e03d) {
    if (!_0x4b3920) {
      toast("请填写网页 URL", "error");
      return;
    }
    if (!/^https:\/\//i.test(_0x4b3920)) {
      toast("仅支持 https:// 链接", "error");
      return;
    }
  }
  toast("保存中...", "info");
  var _0x56e005 = null;
  var _0x526adf = false;
  if (!_0x14e03d && editUploadedFile) {
    var _0x3072e9 = new FormData();
    _0x3072e9.append("file", editUploadedFile);
    try {
      var _0x1b0c73 = await fetch(API_BASE + "/api/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + State.token
        },
        body: _0x3072e9
      });
      var _0x4d61bc = await readUploadResponse(_0x1b0c73);
      if (_0x4d61bc.success) {
        _0x56e005 = _0x4d61bc.url;
      } else {
        toast(_0x4d61bc.msg || "文件上传失败", "error");
        return;
      }
    } catch (_0x239cce) {
      toast(uploadFailureMessage(_0x239cce), "error");
      return;
    }
  } else if (!_0x14e03d && window._pendingEditHtml) {
    var _0x2c5247 = new Blob([window._pendingEditHtml], {
      type: "text/html"
    });
    var _0x38e473 = new File([_0x2c5247], "tuxiaoling_" + Date.now() + ".html", {
      type: "text/html"
    });
    var _0x3072e9 = new FormData();
    _0x3072e9.append("file", _0x38e473);
    try {
      var _0x1b0c73 = await fetch(API_BASE + "/api/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + State.token
        },
        body: _0x3072e9
      });
      var _0x4d61bc = await readUploadResponse(_0x1b0c73);
      if (_0x4d61bc.success) {
        _0x56e005 = _0x4d61bc.url;
      } else {
        toast(_0x4d61bc.msg || "文件上传失败", "error");
        return;
      }
    } catch (_0x365a0a) {
      toast(uploadFailureMessage(_0x365a0a), "error");
      return;
    }
    _0x526adf = true;
  }
  var _0x583747 = null;
  var _0x25c782 = document.getElementById("edit-cover-input");
  if (_0x25c782 && _0x25c782.files && _0x25c782.files.length > 0) {
    var _0x1e4417 = new FormData();
    _0x1e4417.append("cover", _0x25c782.files[0]);
    try {
      var _0x134ce9 = await fetch(API_BASE + "/api/upload-cover", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + State.token
        },
        body: _0x1e4417
      });
      var _0x22bbad = await _0x134ce9.json();
      if (_0x22bbad.success) {
        _0x583747 = _0x22bbad.url;
      }
    } catch (_0x4cd425) {
      console.error("封面上传失败", _0x4cd425);
    }
  }
  var _0x148126 = null;
  var _0x228985 = window._editDescState || {
    removedUrls: {},
    existingUrls: [],
    newFiles: []
  };
  var _0x17702c = _0x228985.existingUrls.filter(function (_0x2bfd24) {
    return !_0x228985.removedUrls[_0x2bfd24];
  });
  var _0x37b5f2 = _0x228985.newFiles && _0x228985.newFiles.length > 0;
  var _0xec92e6 = Object.keys(_0x228985.removedUrls).length > 0;
  if (_0x37b5f2 || _0xec92e6) {
    var _0x5e03b2 = [];
    if (_0x37b5f2) {
      var _0x20c831 = new FormData();
      for (var _0x8fd4f2 = 0; _0x8fd4f2 < Math.min(_0x228985.newFiles.length, 5); _0x8fd4f2++) {
        _0x20c831.append("images", _0x228985.newFiles[_0x8fd4f2]);
      }
      try {
        var _0x328282 = await fetch(API_BASE + "/api/upload-images", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + State.token
          },
          body: _0x20c831
        });
        var _0x13e735 = await _0x328282.json();
        if (_0x13e735.success) {
          _0x5e03b2 = _0x13e735.urls;
        }
      } catch (_0x1a175d) {
        console.error("展示图上传失败", _0x1a175d);
      }
    }
    var _0x51c04a = _0x17702c.concat(_0x5e03b2).slice(0, 5);
    _0x148126 = JSON.stringify(_0x51c04a);
    window._editDescState = null;
  }
  var _0x380dde = null;
  var _0x58aabb = null;
  var _0x2ca252 = document.getElementById("edit-attach-input");
  if (_0x2ca252 && _0x2ca252.files && _0x2ca252.files.length > 0) {
    var _0x186726 = new FormData();
    _0x186726.append("file", _0x2ca252.files[0]);
    try {
      var _0x18bfd5 = await fetch(API_BASE + "/api/upload-attachment", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + State.token
        },
        body: _0x186726
      });
      var _0x2ce367 = await _0x18bfd5.json();
      if (_0x2ce367.success) {
        _0x380dde = _0x2ce367.url;
        _0x58aabb = _0x2ce367.name;
      }
    } catch (_0x44ea2c) {
      console.error("附件上传失败", _0x44ea2c);
    }
  }
  try {
    var _0x4176f4 = {
      id: _0x12fb07,
      title: _0x32325,
      desc: _0x2e2405,
      subject: _0x29570c,
      grade: _0x2319eb,
      grade_level: _0xedd205,
      type: _0x3c8e5d,
      price: _0x74e6b6,
      author: _0x4f40e7
    };
    if (_0x4b3920 !== null) {
      _0x4176f4.external_url = _0x4b3920;
    }
    if (_0x56e005) {
      _0x4176f4.file_url = _0x56e005;
    }
    if (_0x583747) {
      _0x4176f4.cover_url = _0x583747;
    }
    if (_0x148126 !== null) {
      _0x4176f4.desc_images = _0x148126;
    }
    if (_0xec92e6 && _0x148126 === null) {
      _0x148126 = JSON.stringify(_0x17702c);
      _0x4176f4.desc_images = _0x148126;
    }
    if (_0x380dde) {
      _0x4176f4.attachment_url = _0x380dde;
      _0x4176f4.attachment_name = _0x58aabb;
    }
    var _0x549e4e = await fetch(API_BASE + "/api/programs/self-edit", {
      method: "POST",
      headers: Object.assign({
        "Content-Type": "application/json"
      }, State.token ? {
        Authorization: "Bearer " + State.token
      } : {}),
      body: JSON.stringify(_0x4176f4)
    });
    var _0x4fa205 = await readUploadResponse(_0x549e4e);
    if (!_0x4fa205.success) {
      toast(_0x4fa205.msg || "保存失败", "error");
      return;
    }
    if (_0x526adf) {
      window._pendingEditHtml = null;
    }
    var _0x4ec21e = {
      success: false,
      msg: "审核状态暂未确认，请刷新后查看"
    };
    try {
      var _0x5dcc3b = await fetch(API_BASE + "/api/programs/resubmit", {
        method: "POST",
        headers: Object.assign({
          "Content-Type": "application/json"
        }, State.token ? {
          Authorization: "Bearer " + State.token
        } : {}),
        body: JSON.stringify({
          id: _0x12fb07
        })
      });
      _0x4ec21e = await _0x5dcc3b.json();
    } catch (_0x8f1bd5) {}
    toast(_0x4ec21e.success ? "作品已更新并重新提交审核" : "作品已保存；" + (_0x4ec21e.msg || "未重新提交审核"), _0x4ec21e.success ? "success" : "error");
    showUploadWarnings(_0x4fa205.warnings);
    try {
      await loadProgramsFromDatabase({
        throwOnError: true
      });
    } catch (_0x49e235) {
      toast("作品已保存，但作品列表刷新失败，请稍后刷新作品列表查看。", "error");
      return;
    }
    navigate("dashboard");
  } catch (_0x40df30) {
    toast(uploadFailureMessage(_0x40df30), "error");
  }
}
function updateTuxiaolingPresentation(_0x146eab) {
  const _0x31ffe3 = document.querySelector(".ai-chat-iframe");
  if (_0x146eab.origin !== location.origin || !_0x31ffe3 || _0x146eab.source !== _0x31ffe3.contentWindow) {
    return;
  }
  const _0x1a7b77 = _0x146eab.data.height;
  if (typeof _0x1a7b77 !== "number" || !Number.isFinite(_0x1a7b77)) {
    return;
  }
  _0x31ffe3.style.height = Math.min(1200, Math.max(320, _0x1a7b77)) + "px";
  if (typeof _0x146eab.data.conversationActive === "boolean") {
    _0x31ffe3.closest(".home-ai-refined")?.classList.toggle("is-conversation", _0x146eab.data.conversationActive);
  }
}
window.addEventListener("message", function (_0x24d936) {
  if (_0x24d936.data && _0x24d936.data.type === "tuxiaoling-show-points") {
    const _0x42001f = document.querySelector(".ai-chat-iframe");
    if (_0x24d936.origin !== location.origin || !_0x42001f || _0x24d936.source !== _0x42001f.contentWindow) {
      return;
    }
    if (State.user) {
      showPointsModal();
    } else {
      showAuthModal();
    }
  } else if (_0x24d936.data && _0x24d936.data.type === "tuxiaoling-expand") {
    updateTuxiaolingPresentation(_0x24d936);
  } else if (_0x24d936.data && _0x24d936.data.type === "tuxiaoling-upload") {
    window._tuxiaolingPreviewHtml = _0x24d936.data.html;
    window._tuxiaolingPreviewPrompt = _0x24d936.data.prompt || "";
    if (typeof uploadPreviewHtml === "function") {
      uploadPreviewHtml();
    }
  } else if (_0x24d936.data && _0x24d936.data.type === "tuxiaoling-require-login") {
    if (typeof showAuthModal === "function") {
      showAuthModal();
    }
  } else if (_0x24d936.data && _0x24d936.data.type === "tuxiaoling-points") {
    const _0x4efc46 = document.querySelector(".ai-chat-iframe");
    if (_0x24d936.origin !== location.origin || !_0x4efc46 || _0x24d936.source !== _0x4efc46.contentWindow) {
      return;
    }
    State.refreshPoints();
  } else if (_0x24d936.data && _0x24d936.data.type === "tuxiaoling-preview") {
    window._tuxiaolingPreviewHtml = _0x24d936.data.html;
    window._tuxiaolingPreviewPrompt = _0x24d936.data.prompt || "";
    var _0xc12fb2 = document.getElementById("preview-overlay");
    var _0x208420 = document.getElementById("preview-iframe");
    if (_0xc12fb2 && _0x208420 && _0x24d936.data.html) {
      _0x208420.srcdoc = _0x24d936.data.html;
      _0xc12fb2.classList.add("active", "tuxiaoling-fullscreen");
    }
  }
});
function closePreview() {
  var _0x32b01c = document.getElementById("preview-overlay");
  var _0x267a1d = document.getElementById("preview-iframe");
  if (_0x32b01c) {
    _0x32b01c.classList.remove("active", "tuxiaoling-fullscreen");
  }
  if (_0x267a1d) {
    _0x267a1d.srcdoc = "";
  }
}
function downloadPreviewHtml() {
  var _0xaab99e = window._tuxiaolingPreviewHtml || "";
  if (!_0xaab99e) {
    toast("当前没有可下载的 HTML", "error");
    return;
  }
  var _0xcaf1d4 = window.TuxiaolingHtmlExport;
  if (!_0xcaf1d4 || typeof _0xcaf1d4.downloadHtml !== "function") {
    toast("下载功能加载失败，请刷新后重试", "error");
    return;
  }
  var _0x44e101 = _0xcaf1d4.downloadHtml(_0xaab99e);
  if (!_0x44e101.ok) {
    toast("下载失败，请更换浏览器后重试", "error");
  }
}
function uploadPreviewHtml() {
  var _0x3c4506 = window._tuxiaolingPreviewHtml || "";
  var _0x1103e2 = window._tuxiaolingPreviewPrompt || "";
  if (!_0x3c4506) {
    return;
  }
  if (!State.user) {
    showAuthModal();
    return;
  }
  if (State.user.points < 0) {
    toast("积分不足，无法上传。请充值后再试", "error");
    return;
  }
  var _0x17427f = null;
  try {
    _0x17427f = sessionStorage.getItem("tuxiaoling_edit_prog_id");
  } catch (_0x13d184) {}
  if (_0x17427f) {
    State.editProgramId = parseInt(_0x17427f);
    try {
      sessionStorage.setItem("tuxiaoling_upload_html", _0x3c4506);
      sessionStorage.setItem("tuxiaoling_upload_title", _0x1103e2 ? _0x1103e2.slice(0, 30) : "修改后的作品");
      sessionStorage.removeItem("tuxiaoling_edit_prog_id");
    } catch (_0x1dc3cd) {}
    closePreview();
    toast("正在跳转到编辑页面...", "info");
    navigate("edit-upload");
    return;
  }
  var _0x53cb98 = "";
  var _0x5ab5da = _0x3c4506.match(/<title>([^<]+)<\/title>/i);
  if (_0x5ab5da) {
    _0x53cb98 = _0x5ab5da[1].trim();
  }
  if (!_0x53cb98) {
    _0x5ab5da = _0x3c4506.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (_0x5ab5da) {
      _0x53cb98 = _0x5ab5da[1].trim();
    }
  }
  if (!_0x53cb98) {
    _0x53cb98 = _0x1103e2 ? _0x1103e2.slice(0, 30) : "图小灵生成_" + new Date().toISOString().slice(0, 10);
  }
  try {
    sessionStorage.setItem("tuxiaoling_upload_html", _0x3c4506);
    sessionStorage.setItem("tuxiaoling_upload_title", _0x53cb98);
    sessionStorage.setItem("tuxiaoling_upload_desc", _0x1103e2 || "由图小灵 AI 自动生成的交互式教学演示页面");
  } catch (_0x1de6d3) {}
  closePreview();
  navigate("upload");
}
async function editLoadToTuxiaoling(_0x6f2b30) {
  if (!State.user) {
    showAuthModal();
    return;
  }
  toast("正在加载作品数据...", "info");
  var _0x1681e6 = null;
  try {
    var _0x1ac180 = await fetch(API_BASE + "/api/programs?myOpenid=1", {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    var _0x499dd8 = await _0x1ac180.json();
    if (_0x499dd8.success) {
      _0x1681e6 = (_0x499dd8.programs || []).find(function (_0x4b80d3) {
        return _0x4b80d3.id === _0x6f2b30;
      });
    }
  } catch (_0x39974e) {}
  if (!_0x1681e6) {
    toast("找不到作品数据", "error");
    return;
  }
  if (!_0x1681e6.file_url) {
    toast("该作品没有关联的 HTML 文件", "error");
    return;
  }
  try {
    var _0x2d1e06 = await fetch(API_BASE + "/api/programs/file-content/" + _0x6f2b30, {
      headers: State.token ? {
        Authorization: "Bearer " + State.token
      } : {}
    });
    var _0x108c7f = await _0x2d1e06.json();
    if (!_0x108c7f.success) {
      toast(_0x108c7f.msg || "无法读取 HTML 内容", "error");
      return;
    }
    var _0x1690b9 = _0x108c7f.html || _0x108c7f.content || "";
    if (!_0x1690b9) {
      toast(_0x108c7f.msg || "无法读取 HTML 内容", "error");
      return;
    }
    try {
      sessionStorage.setItem("tuxiaoling_edit_html", _0x1690b9);
      sessionStorage.setItem("tuxiaoling_edit_title", _0x1681e6.title || "作品");
      sessionStorage.setItem("tuxiaoling_edit_prog_id", String(_0x1681e6.id));
    } catch (_0x358d4b) {}
    toast("切换到首页加载图小灵...", "info");
    navigate("home");
  } catch (_0x341628) {
    toast("加载失败: " + _0x341628.message, "error");
  }
}