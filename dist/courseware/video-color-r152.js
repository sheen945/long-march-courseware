(function () {
  "use strict";
  const VERSION = "long-march-video-srgb-v1";
  function check(THREE) {
    if (String(THREE.REVISION) !== "152") throw new Error("VIDEO_COLOR_REVISION_REVIEW_REQUIRED");
  }
  function configureTexture(THREE, texture) {
    check(THREE);
    texture.colorSpace = texture.isVideoTexture ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    return texture;
  }
  function prepareMaterial(THREE, material) {
    check(THREE);
    if (!material.isMeshBasicMaterial || material.toneMapped !== false) throw new Error("VIDEO_COLOR_MATERIAL_REVIEW_REQUIRED");
    if (material.userData.longMarchVideoColor === VERSION) return material;
    const before = material.onBeforeCompile;
    const cache = material.customProgramCacheKey;
    material.onBeforeCompile = function (shader, renderer) {
      before.call(this, shader, renderer);
      if (!this.map?.isVideoTexture) return;
      if (this.map.colorSpace !== THREE.NoColorSpace) throw new Error("VIDEO_COLOR_TEXTURE_REVIEW_REQUIRED");
      const anchor = "#include <map_fragment>";
      if (shader.fragmentShader.split(anchor).length !== 2) throw new Error("VIDEO_COLOR_SHADER_REVIEW_REQUIRED");
      shader.fragmentShader = shader.fragmentShader.replace(anchor, [
        "#ifdef USE_MAP",
        "vec4 courseVideoTexel = texture2D( map, vMapUv );",
        "courseVideoTexel.rgb = mix(pow(courseVideoTexel.rgb * 0.9478672986 + vec3(0.0521327014), vec3(2.4)), courseVideoTexel.rgb * 0.0773993808, vec3(lessThanEqual(courseVideoTexel.rgb, vec3(0.04045))));",
        "diffuseColor *= courseVideoTexel;",
        "#endif"
      ].join("\n"));
    };
    material.customProgramCacheKey = function () {
      return cache.call(this) + "|" + VERSION + (this.map?.isVideoTexture ? ":video" : ":still");
    };
    material.userData.longMarchVideoColor = VERSION;
    material.needsUpdate = true;
    return material;
  }
  window.LongMarchVideoColor = Object.freeze({ version: VERSION, configureTexture, prepareMaterial });
})();
