import { useLayoutEffect, useRef, useState } from 'react'
import './GlassNavbar.css'

type NavigationItem = 'overview' | 'features' | 'contact'

type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream
  mozCaptureStream?: () => MediaStream
}

const REFLECTION_DISTANCE = 56
const REFLECTION_BAND_SIZE = 14
const REFLECTION_FADE_DURATION = 260
const REFLECTION_MIN_OPACITY = 0.09
const REFLECTION_MAX_OPACITY = 0.72

const navigationItems: ReadonlyArray<{ id: NavigationItem; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'contact', label: 'Contact' },
]

function getReflectionProbeY(navbarBounds: DOMRect) {
  return Math.min(window.innerHeight - 1, navbarBounds.bottom + REFLECTION_DISTANCE)
}

function findReflectionSource(navbarBounds: DOMRect) {
  const probeY = getReflectionProbeY(navbarBounds)
  const probePositions = [0.5, 0.25, 0.75]

  for (const position of probePositions) {
    const probeX = navbarBounds.left + navbarBounds.width * position
    const target = document.elementFromPoint(probeX, probeY)

    if (!(target instanceof HTMLElement)) {
      continue
    }

    const source = target.closest<HTMLElement>('[data-reflection-source], section, article')
    if (source) {
      return source
    }
  }

  return null
}

function makeMirrorSafe(mirror: HTMLElement) {
  mirror.setAttribute('aria-hidden', 'true')
  mirror.setAttribute('inert', '')
  mirror.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'))
  mirror.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach((element) => {
    element.setAttribute('tabindex', '-1')
    element.setAttribute('aria-hidden', 'true')
  })
}

function connectMirroredVideos(source: HTMLElement, mirror: HTMLElement) {
  const sourceVideos = Array.from(source.querySelectorAll('video'))
  const mirrorVideos = Array.from(mirror.querySelectorAll('video'))
  const cleanups: Array<() => void> = []

  sourceVideos.forEach((sourceVideo, index) => {
    const mirrorVideo = mirrorVideos[index]
    if (!mirrorVideo) {
      return
    }

    mirrorVideo.muted = true
    mirrorVideo.autoplay = true
    mirrorVideo.playsInline = true
    mirrorVideo.controls = false

    const capturableVideo = sourceVideo as CapturableVideo
    const captureStream = capturableVideo.captureStream ?? capturableVideo.mozCaptureStream

    if (captureStream) {
      try {
        const stream = captureStream.call(capturableVideo)
        mirrorVideo.srcObject = stream
        void mirrorVideo.play().catch(() => undefined)
        cleanups.push(() => stream.getTracks().forEach((track) => track.stop()))
        return
      } catch {
        // Safari and restricted media contexts fall back to a muted, synchronised clone.
      }
    }

    const syncVideo = () => {
      mirrorVideo.playbackRate = sourceVideo.playbackRate
      if (Math.abs(mirrorVideo.currentTime - sourceVideo.currentTime) > 0.15) {
        mirrorVideo.currentTime = sourceVideo.currentTime
      }

      if (sourceVideo.paused) {
        mirrorVideo.pause()
      } else {
        void mirrorVideo.play().catch(() => undefined)
      }
    }

    ;['loadedmetadata', 'play', 'pause', 'seeking', 'seeked', 'ratechange', 'timeupdate'].forEach((eventName) => {
      sourceVideo.addEventListener(eventName, syncVideo)
    })
    syncVideo()
    cleanups.push(() => {
      ;['loadedmetadata', 'play', 'pause', 'seeking', 'seeked', 'ratechange', 'timeupdate'].forEach((eventName) => {
        sourceVideo.removeEventListener(eventName, syncVideo)
      })
      mirrorVideo.pause()
      mirrorVideo.removeAttribute('src')
      mirrorVideo.load()
    })
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}

function setMirrorGeometry(
  layer: HTMLDivElement,
  source: HTMLElement,
  navbarBounds: DOMRect,
) {
  const sourceBounds = source.getBoundingClientRect()
  const probeY = getReflectionProbeY(navbarBounds)
  const distance = Math.max(0, Math.min(REFLECTION_DISTANCE, sourceBounds.top - navbarBounds.bottom))
  const proximity = 1 - distance / REFLECTION_DISTANCE
  const strength = REFLECTION_MIN_OPACITY + (REFLECTION_MAX_OPACITY - REFLECTION_MIN_OPACITY) * proximity ** 1.8

  layer.style.setProperty('--mirror-width', `${Math.max(1, Math.round(sourceBounds.width))}px`)
  layer.style.setProperty('--mirror-height', `${Math.max(1, Math.round(sourceBounds.height))}px`)
  layer.style.setProperty('--mirror-x', `${Math.round(sourceBounds.left - navbarBounds.left)}px`)
  layer.style.setProperty('--mirror-y', `${Math.round(sourceBounds.top - probeY + navbarBounds.height - REFLECTION_BAND_SIZE)}px`)
  layer.style.setProperty('--reflection-strength', strength.toFixed(3))
}

export function GlassNavbar() {
  const [activeItem, setActiveItem] = useState<NavigationItem>('overview')
  const navbarRef = useRef<HTMLElement>(null)
  const reflectionARef = useRef<HTMLDivElement>(null)
  const reflectionBRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const navbar = navbarRef.current
    const layers = [reflectionARef.current, reflectionBRef.current]

    if (!navbar || layers.some((layer) => !layer)) {
      return
    }

    const resolvedLayers = layers as [HTMLDivElement, HTMLDivElement]
    let activeLayerIndex = 0
    let currentSource: HTMLElement | null = null
    let activeMutationObserver: MutationObserver | undefined
    let frameId: number | undefined
    let resizeTimer: ReturnType<typeof window.setTimeout> | undefined
    let fadeTimer: ReturnType<typeof window.setTimeout> | undefined
    const layerCleanups = new Map<HTMLDivElement, () => void>()

    const clearLayer = (layer: HTMLDivElement) => {
      layer.classList.remove('glass-navbar__reflection--visible')
      layerCleanups.get(layer)?.()
      layerCleanups.delete(layer)
      layer.replaceChildren()
    }

    const populateLayer = (layer: HTMLDivElement, source: HTMLElement) => {
      const createScene = (variant: 'edge' | 'glow') => {
        const mirror = source.cloneNode(true) as HTMLElement
        makeMirrorSafe(mirror)
        mirror.classList.add('glass-navbar__mirror-source')

        const scene = document.createElement('div')
        scene.className = `glass-navbar__mirror-scene glass-navbar__mirror-scene--${variant} glass-demo`
        scene.append(mirror)

        return { cleanup: connectMirroredVideos(source, mirror), scene }
      }

      const glow = createScene('glow')
      const edge = createScene('edge')
      const edgeFade = document.createElement('div')
      edgeFade.className = 'glass-navbar__mirror-edge-fade'
      edgeFade.append(edge.scene)

      layer.replaceChildren(glow.scene, edgeFade)
      layerCleanups.set(layer, () => {
        glow.cleanup()
        edge.cleanup()
      })
    }

    const observeActiveSource = (source: HTMLElement) => {
      activeMutationObserver?.disconnect()
      activeMutationObserver = new MutationObserver(scheduleReflectionUpdate)
      activeMutationObserver.observe(source, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'src', 'poster'],
      })
    }

    const updateReflection = () => {
      const navbarBounds = navbar.getBoundingClientRect()
      const source = findReflectionSource(navbarBounds)
      const activeLayer = resolvedLayers[activeLayerIndex]

      if (!source) {
        currentSource = null
        activeMutationObserver?.disconnect()
        window.clearTimeout(fadeTimer)
        resolvedLayers.forEach(clearLayer)
        return
      }

      if (source !== currentSource) {
        const nextLayerIndex = currentSource ? (activeLayerIndex === 0 ? 1 : 0) : activeLayerIndex
        const nextLayer = resolvedLayers[nextLayerIndex]

        window.clearTimeout(fadeTimer)
        clearLayer(nextLayer)
        populateLayer(nextLayer, source)
        setMirrorGeometry(nextLayer, source, navbarBounds)
        nextLayer.classList.add('glass-navbar__reflection--visible')

        if (currentSource) {
          activeLayer.classList.remove('glass-navbar__reflection--visible')
          fadeTimer = window.setTimeout(() => clearLayer(activeLayer), REFLECTION_FADE_DURATION)
        }

        activeLayerIndex = nextLayerIndex
        currentSource = source
        observeActiveSource(source)
        return
      }

      setMirrorGeometry(activeLayer, source, navbarBounds)
    }

    function scheduleReflectionUpdate() {
      if (frameId !== undefined) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = undefined
        updateReflection()
      })
    }

    const updateAfterResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(scheduleReflectionUpdate, 100)
    }

    const intersectionObserver = new IntersectionObserver(scheduleReflectionUpdate, {
      rootMargin: `0px 0px ${REFLECTION_DISTANCE}px 0px`,
      threshold: 0,
    })
    document
      .querySelectorAll<HTMLElement>('main [data-reflection-source], main section, main article')
      .forEach((element) => intersectionObserver.observe(element))

    const resizeObserver = new ResizeObserver(updateAfterResize)
    resizeObserver.observe(navbar)

    updateReflection()
    window.addEventListener('scroll', scheduleReflectionUpdate, { passive: true })
    window.addEventListener('resize', updateAfterResize)

    return () => {
      intersectionObserver.disconnect()
      activeMutationObserver?.disconnect()
      resizeObserver.disconnect()
      window.clearTimeout(fadeTimer)
      resolvedLayers.forEach(clearLayer)
      window.clearTimeout(resizeTimer)
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener('scroll', scheduleReflectionUpdate)
      window.removeEventListener('resize', updateAfterResize)
    }
  }, [])

  return (
    <nav ref={navbarRef} className="glass-navbar" aria-label="Demo navigation">
      <div
        ref={reflectionARef}
        className="glass-navbar__reflection glass-navbar__reflection--a"
        aria-hidden="true"
      />
      <div
        ref={reflectionBRef}
        className="glass-navbar__reflection glass-navbar__reflection--b"
        aria-hidden="true"
      />
      <div className="glass-navbar__content">
        {navigationItems.map((item) => {
          const isActive = activeItem === item.id

          return (
            <button
              key={item.id}
              className={`glass-navbar__item${isActive ? ' glass-navbar__item--active' : ''}`}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveItem(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
