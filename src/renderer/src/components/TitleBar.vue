<script setup lang="ts">
import { ref, onMounted } from 'vue'

const version = ref('')

onMounted(async () => {
  try {
    version.value = await window.api.getVersion()
  } catch (err) {
    console.error('Failed to get app version:', err)
    version.value = window.api.version || '1.0.0'
  }
})

const handleMinimize = (): void => {
  console.log('Renderer: Minimizing')
  window.api.minimize()
}

const handleMaximize = (): void => {
  console.log('Renderer: Maximizing')
  window.api.maximize()
}

const handleClose = (): void => {
  console.log('Renderer: Closing')
  window.api.close()
}
</script>

<template>
  <div class="title-bar">
    <div class="title-section">
      <h1 class="app-logo">CCA<span class="dot">.</span> Split</h1>
      <span v-if="version" class="app-version">v{{ version }}</span>
    </div>
    <div class="window-controls">
      <button class="control-btn minimize" title="Minimizar" @click="handleMinimize">
        <svg viewBox="0 0 12 12">
          <rect x="2" y="5.5" width="8" height="1" fill="currentColor" />
        </svg>
      </button>
      <button class="control-btn maximize" title="Maximizar" @click="handleMaximize">
        <svg viewBox="0 0 12 12">
          <rect
            x="3"
            y="3"
            width="6"
            height="6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </button>
      <button class="control-btn close" title="Fechar" @click="handleClose">
        <svg viewBox="0 0 12 12">
          <path d="M3,3 L9,9 M9,3 L3,9" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  height: 48px;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f3f4f6;
  -webkit-app-region: drag;
  user-select: none;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b; /* slate-800 style */
  letter-spacing: -0.025em;
  margin: 0; /* Remove default margin for perfect centering */
}

.dot {
  color: #2563eb; /* blue-600 from logo */
}

.app-version {
  font-size: 10px;
  font-weight: 700;
  color: #64748b; /* slate-500 */
  background: #f1f5f9; /* slate-100 */
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid #e2e8f0; /* slate-200 */
  display: inline-flex;
  align-items: center;
  height: fit-content;
  line-height: 1; /* Helps with vertical centering */
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 22px; /* Increased size */
  height: 22px;
  border-radius: 6px; /* Rounded squares as requested */
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.control-btn.minimize,
.control-btn.maximize {
  background: #f1f5f9; /* Light gray */
  border: 1px solid #e2e8f0; /* Contrast border */
  color: #475569; /* Slate 600 for contrast */
}

.control-btn.close {
  background: #ef4444; /* Vivid Red 500 */
  border: 1px solid #dc2626;
  color: white; /* Contrast with vivid red */
}

.control-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.control-btn.close:hover {
  background: #dc2626;
}

.control-btn svg {
  width: 10px;
  height: 10px;
  opacity: 0.8; /* More visible based on new color scheme */
  transition: opacity 0.2s ease;
}

.window-controls:hover .control-btn svg {
  opacity: 0.8;
}

.control-btn:hover svg {
  opacity: 1;
}

.control-btn:active {
  transform: scale(0.9);
  filter: brightness(0.9);
}

svg {
  display: block;
}
</style>
