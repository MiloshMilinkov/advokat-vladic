// Copyright (c) 2026 Miloš Milinkov. All rights reserved.
// Proprietary: no use, copying, modification or deployment without written permission. See LICENSE.

import './styles/main.css'
import './styles/additions.css'
import { INITIAL_DATA_ID } from '@shared/api-paths'
import { createWebHistory } from 'vue-router'
import { createVueApp } from './app'
import type { InitialData } from './lib/initial-data'

// Enables the entrance-animation styles (`.js .reveal:not(.in)` etc.). index.html
// sets it before first paint; this is a fallback.
document.documentElement.classList.add('js')

function readInitialData(): InitialData {
  const el = document.getElementById(INITIAL_DATA_ID)
  if (!el?.textContent) return {}
  try {
    return JSON.parse(el.textContent) as InitialData
  } catch {
    return {}
  }
}

const root = document.getElementById('app')!
// The Worker server-renders every public page; /admin/ (and any page whose server
// render failed) arrives empty and is rendered in the browser instead.
const hydrate = root.firstElementChild !== null
const { app, router } = createVueApp({ ssr: hydrate, history: createWebHistory(), initialData: readInitialData() })
void router.isReady().then(() => app.mount(root))
