const DEG = Math.PI / 180;
const RADIUS = 10;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class PanoramaViewer {
  constructor({ viewport, canvas, curtain, onViewChange }) {
    this.viewport = viewport;
    this.canvas = canvas;
    this.curtain = curtain;
    this.onViewChange = onViewChange;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.mesh = null;
    this.geometry = null;
    this.texture = null;
    this.media = null;
    this.config = {};
    this.currentScene = null;
    this.cameraState = {
      yaw: 0, pitch: 0, zoom: 1,
      targetYaw: 0, targetPitch: 0, targetZoom: 1,
      dragging: false, pointerId: null, startX: 0, startY: 0, originYaw: 0, originPitch: 0
    };
  }

  init(config = {}) {
    this.config = config;
    this.arc = (config.arcDegrees ?? 180) * DEG;
    this.edgeGuard = (config.edgeGuardDegrees ?? 5) * DEG;
    this.pitchLimit = (config.pitchLimitDegrees ?? 10) * DEG;
    this.baseVFov = (config.baseVerticalFovDegrees ?? 55) * DEG;
    this.cameraState.yaw = (config.initialYawDegrees ?? 0) * DEG;
    this.cameraState.targetYaw = this.cameraState.yaw;

    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x17150f, 1);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(55, 1, .1, 50);
      this.camera.rotation.order = "YXZ";
      this.setupInput();
      addEventListener("resize", () => this.resize(), { passive: true });
      this.render();
    }
    this.resize();
  }

  async loadScene(scene, immediate = false) {
    this.currentScene = scene;
    if (!immediate) {
      this.curtain.classList.add("active");
      await new Promise(resolve => setTimeout(resolve, 340));
    }

    const prepared = await this.prepareTexture(scene);
    this.disposeCurrent();
    this.media = prepared.media;
    this.texture = prepared.texture;
    const aspect = prepared.aspect || 16 / 9;
    const height = RADIUS * this.arc / aspect;
    this.geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, height, 112, 1, true, Math.PI - this.arc / 2, this.arc);
    this.mesh = new THREE.Mesh(this.geometry, window.LongMarchVideoColor.prepareMaterial(THREE, new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.BackSide, toneMapped: false })));
    this.scene.add(this.mesh);
    this.cylinderHeight = height;
    this.canvas.dataset.resourceState = prepared.placeholder ? "placeholder" : "loaded";
    this.canvas.dataset.currentScene = scene.id;
    this.resetView(scene.initialYawDegrees);
    if (this.media) this.media.play().catch(() => {});
    if (!immediate) {
      await new Promise(resolve => setTimeout(resolve, 120));
      this.curtain.classList.remove("active");
    }
  }

  async prepareTexture(scene) {
    if (scene.video?.source && await this.resourceExists(scene.video.source)) {
      try { return await this.loadVideo(scene.video.source, scene.video); }
      catch (error) { console.warn(`${scene.video.source} 无法解码，启用场景占位。`, error); }
    }
    if (scene.image && await this.resourceExists(scene.image)) {
      try {
        const texture = await new Promise((resolve, reject) => new THREE.TextureLoader().load(scene.image, resolve, undefined, reject));
        this.configureTexture(texture);
        const image = texture.image;
        return { texture, aspect: image.width / Math.max(image.height, 1), media: null, placeholder: false };
      } catch (error) { console.warn(`${scene.image} 尚未提供，启用场景占位。`, error); }
    }
    return this.createPlaceholder(scene);
  }

  async resourceExists(source) {
    try {
      const response = await fetch(source, { method: "HEAD", cache: "no-store" });
      return response.ok;
    } catch {
      return false;
    }
  }

  loadVideo(source, options = {}) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      // Always start muted so the panorama can autoplay. AudioManager applies
      // the scene's final video-audio policy after the media is attached.
      video.muted = true;
      video.defaultMuted = true;
      video.dataset.audioMode = options.muted === false ? "managed" : "muted";
      video.loop = options.loop !== false;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";
      video.hidden = true;
      video.setAttribute("playsinline", "");
      document.body.appendChild(video);
      const cleanup = () => {
        video.removeEventListener("loadeddata", ready);
        video.removeEventListener("error", failed);
      };
      const ready = () => {
        cleanup();
        const texture = new THREE.VideoTexture(video);
        this.configureTexture(texture);
        resolve({ texture, aspect: video.videoWidth / Math.max(video.videoHeight, 1), media: video, placeholder: false });
      };
      const failed = () => { cleanup(); video.remove(); reject(new Error("video load failed")); };
      video.addEventListener("loadeddata", ready, { once: true });
      video.addEventListener("error", failed, { once: true });
      video.src = source;
      video.load();
    });
  }

  createPlaceholder(scene) {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    const colors = scene.placeholder?.colors || ["#534632", "#1d1a14"];
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(230,205,148,.08)";
    for (let x = 0; x < canvas.width; x += 96) context.fillRect(x, 0, 1, canvas.height);
    context.fillStyle = "rgba(0,0,0,.2)";
    context.fillRect(0, 700, canvas.width, 324);
    const texture = new THREE.CanvasTexture(canvas);
    this.configureTexture(texture);
    return { texture, aspect: 2, media: null, placeholder: true };
  }

  configureTexture(texture) {
    window.LongMarchVideoColor.configureTexture(THREE, texture);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    texture.offset.x = 1;
    texture.needsUpdate = true;
  }

  disposeCurrent() {
    if (this.mesh) this.scene.remove(this.mesh);
    this.mesh?.material?.dispose();
    this.geometry?.dispose();
    this.texture?.dispose();
    if (this.media) {
      this.media.pause();
      this.media.removeAttribute("src");
      this.media.load();
      this.media.remove();
    }
    this.mesh = this.geometry = this.texture = this.media = null;
  }

  resetView(initialYaw = 0) {
    const yaw = (initialYaw ?? this.config.initialYawDegrees ?? 0) * DEG;
    Object.assign(this.cameraState, { yaw, targetYaw: yaw, pitch: 0, targetPitch: 0, zoom: 1, targetZoom: 1 });
  }

  holdView() {
    const snapshot = {
      yaw: this.cameraState.yaw,
      pitch: this.cameraState.pitch,
      zoom: this.cameraState.zoom
    };
    Object.assign(this.cameraState, {
      targetYaw: snapshot.yaw,
      targetPitch: snapshot.pitch,
      targetZoom: snapshot.zoom,
      dragging: false,
      pointerId: null
    });
    this.viewport.classList.remove("dragging");
    return snapshot;
  }

  restoreView(snapshot) {
    if (!snapshot) return;
    Object.assign(this.cameraState, {
      yaw: snapshot.yaw,
      targetYaw: snapshot.yaw,
      pitch: snapshot.pitch,
      targetPitch: snapshot.pitch,
      zoom: snapshot.zoom,
      targetZoom: snapshot.zoom,
      dragging: false,
      pointerId: null
    });
    this.viewport.classList.remove("dragging");
  }

  updateViewFov() {
    const aspect = Math.max(this.viewport.clientWidth / Math.max(this.viewport.clientHeight, 1), .6);
    this.viewVFov = this.baseVFov / this.cameraState.zoom;
    this.viewHFov = Math.min(2 * Math.atan(Math.tan(this.viewVFov / 2) * aspect), 88 * DEG);
  }

  maxYaw() { return Math.max(0, this.arc / 2 - this.viewHFov / 2 - this.edgeGuard); }

  resize() {
    if (!this.renderer) return;
    const width = Math.max(1, this.viewport.clientWidth);
    const height = Math.max(1, this.viewport.clientHeight);
    this.renderer.setSize(width, height, false);
    this.updateViewFov();
    this.camera.aspect = width / height;
    this.camera.fov = this.viewVFov / DEG;
    this.camera.updateProjectionMatrix();
  }

  imagePointToWorld(u, v) {
    const theta = Math.PI - this.arc / 2 + (1 - u) * this.arc;
    return new THREE.Vector3(RADIUS * Math.sin(theta), (.5 - v) * this.cylinderHeight, RADIUS * Math.cos(theta));
  }

  projectBounds(bounds) {
    if (!this.camera || !this.cylinderHeight) return { visible: false };
    const project = (u, v) => {
      const world = this.imagePointToWorld(u, v);
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      const inFront = world.clone().normalize().dot(direction) > 0;
      const point = world.clone().project(this.camera);
      return { x: (point.x * .5 + .5) * this.viewport.clientWidth, y: (.5 - point.y * .5) * this.viewport.clientHeight, visible: inFront && Math.abs(point.x) < 1.2 && Math.abs(point.y) < 1.28 };
    };
    const center = project((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
    if (!center.visible) return { visible: false };
    const points = [project(bounds.left, bounds.top), project(bounds.right, bounds.top), project(bounds.left, bounds.bottom), project(bounds.right, bounds.bottom)];
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    return {
      visible: true,
      left: Math.max(0, Math.min(...xs)),
      top: Math.max(0, Math.min(...ys)),
      right: Math.min(this.viewport.clientWidth, Math.max(...xs)),
      bottom: Math.min(this.viewport.clientHeight, Math.max(...ys))
    };
  }

  setupInput() {
    this.viewport.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest("button, [role=dialog]")) return;
      const state = this.cameraState;
      Object.assign(state, { dragging: true, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originYaw: state.targetYaw, originPitch: state.targetPitch });
      this.viewport.setPointerCapture(event.pointerId);
      this.viewport.classList.add("dragging");
    });
    this.viewport.addEventListener("pointermove", event => {
      const state = this.cameraState;
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      state.targetYaw = clamp(state.originYaw - (event.clientX - state.startX) * .00145, -this.maxYaw(), this.maxYaw());
      state.targetPitch = clamp(state.originPitch + (event.clientY - state.startY) * .0012, -this.pitchLimit, this.pitchLimit);
    });
    const stop = event => {
      if (!this.cameraState.dragging || event.pointerId !== this.cameraState.pointerId) return;
      this.cameraState.dragging = false;
      this.cameraState.pointerId = null;
      this.viewport.classList.remove("dragging");
    };
    this.viewport.addEventListener("pointerup", stop);
    this.viewport.addEventListener("pointercancel", stop);
    this.viewport.addEventListener("wheel", event => {
      if (event.target.closest("[role=dialog]")) return;
      event.preventDefault();
      this.cameraState.targetZoom = clamp(this.cameraState.targetZoom - event.deltaY * .00018, .96, 1.08);
    }, { passive: false });
  }

  render = () => {
    requestAnimationFrame(this.render);
    if (!this.renderer) return;
    const state = this.cameraState;
    state.yaw += (state.targetYaw - state.yaw) * .2;
    state.pitch += (state.targetPitch - state.pitch) * .2;
    state.zoom += (state.targetZoom - state.zoom) * .16;
    this.updateViewFov();
    state.yaw = clamp(state.yaw, -this.maxYaw(), this.maxYaw());
    state.targetYaw = clamp(state.targetYaw, -this.maxYaw(), this.maxYaw());
    this.camera.rotation.x = state.pitch;
    this.camera.rotation.y = -state.yaw;
    this.camera.fov = this.viewVFov / DEG;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    this.onViewChange?.();
  };
}
