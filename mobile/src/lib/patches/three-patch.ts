import * as THREE from "three";

// Patch Three.js to handle undefined program in getProgramInfoLog
const patchThreeJS = () => {
  try {
    // @ts-ignore - accessing internal Three.js function
    const originalOnFirstUse = THREE.WebGLRenderer.prototype.onFirstUse;
    if (originalOnFirstUse) {
      // @ts-ignore - accessing internal Three.js function
      THREE.WebGLRenderer.prototype.onFirstUse = function () {
        const gl = this.getContext();
        if (gl) {
          // Store original getProgramInfoLog
          const originalGetProgramInfoLog = gl.getProgramInfoLog;

          // Override getProgramInfoLog to handle undefined/null cases
          gl.getProgramInfoLog = function (
            program: WebGLProgram | null
          ): string {
            if (!program) return "";
            const log = originalGetProgramInfoLog.call(this, program);
            return log ? log.trim() : "";
          };

          // Store original getShaderInfoLog
          const originalGetShaderInfoLog = gl.getShaderInfoLog;

          // Override getShaderInfoLog to handle undefined/null cases
          gl.getShaderInfoLog = function (shader: WebGLShader | null): string {
            if (!shader) return "";
            const log = originalGetShaderInfoLog.call(this, shader);
            return log ? log.trim() : "";
          };
        }
        return originalOnFirstUse.apply(this);
      };
    }
  } catch (error) {
    console.warn("Failed to patch Three.js:", error);
  }
};

// Apply the patch immediately
patchThreeJS();

export {};
