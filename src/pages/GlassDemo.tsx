import { useEffect, useRef, useState } from 'react'
import { GlassNavbar } from '../components/GlassNavbar/GlassNavbar'
import './GlassDemo.css'

const cards = [
  { name: 'Red card', className: 'glass-demo__card--red' },
  { name: 'Blue card', className: 'glass-demo__card--blue' },
  { name: 'Purple card', className: 'glass-demo__card--purple' },
  { name: 'Orange card', className: 'glass-demo__card--orange' },
]

export function GlassDemo() {
  const [debugReflection, setDebugReflection] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const videoSectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoSection = videoSectionRef.current
    if (!videoSection) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadVideo(true)
          observer.disconnect()
        }
      },
      { rootMargin: '480px 0px' },
    )

    observer.observe(videoSection)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldLoadVideo) {
      return
    }

    const resumeVideo = () => {
      const video = videoRef.current
      if (video?.paused) {
        void video.play().catch(() => undefined)
      }
    }

    const frameId = window.requestAnimationFrame(resumeVideo)
    window.addEventListener('resize', resumeVideo)
    document.addEventListener('visibilitychange', resumeVideo)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resumeVideo)
      document.removeEventListener('visibilitychange', resumeVideo)
    }
  }, [shouldLoadVideo])

  return (
    <div className={`glass-demo${debugReflection ? ' debug-reflection' : ''}`}>
      <GlassNavbar />

      <button
        className="glass-demo__debug-toggle"
        type="button"
        aria-pressed={debugReflection}
        onClick={() => setDebugReflection((isEnabled) => !isEnabled)}
      >
        Debug Reflection Area
      </button>

      <main>
        <section className="glass-demo__section glass-demo__section--split" aria-labelledby="split-title">
          <div className="glass-demo__copy">
            <p className="glass-demo__eyebrow">Test 01</p>
            <h1 id="split-title">Red / Blue spatial reflection</h1>
            <p>Scroll through the split. The lower edge of the glass should retain red on the left and blue on the right.</p>
          </div>
        </section>

        <section className="glass-demo__section glass-demo__section--bands" aria-labelledby="bands-title">
          <div className="glass-demo__copy">
            <p className="glass-demo__eyebrow">Test 02</p>
            <h2 id="bands-title">Multiple colors in one backdrop</h2>
            <p>Four vertical color fields make it easy to verify that the reflection keeps its real spatial positions.</p>
          </div>
        </section>

        <section className="glass-demo__section glass-demo__section--cards" aria-labelledby="cards-title">
          <div className="glass-demo__copy">
            <p className="glass-demo__eyebrow">Test 03</p>
            <h2 id="cards-title">Card positions</h2>
            <p>Each card has its own contrasting color, text and rounded edge.</p>
          </div>

          <div className="glass-demo__card-grid">
            {cards.map((card) => (
              <article key={card.name} className={`glass-demo__card ${card.className}`}>
                <span>Backdrop target</span>
                <strong>{card.name}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-demo__section glass-demo__section--gradient" aria-labelledby="gradient-title">
          <div className="glass-demo__copy">
            <p className="glass-demo__eyebrow">Test 04</p>
            <h2 id="gradient-title">Detailed multi-color gradient</h2>
            <p>Ambient colors move through the bottom reflection without any JavaScript color detection.</p>
          </div>
        </section>

        <section
          ref={videoSectionRef}
          className="glass-demo__section glass-demo__section--video"
          data-reflection-source
          aria-labelledby="video-title"
        >
          <div className="glass-demo__video-frame">
            <video
              ref={videoRef}
              className="glass-demo__video"
              autoPlay
              controls
              loop
              muted
              playsInline
              preload="none"
              onCanPlay={() => {
                void videoRef.current?.play().catch(() => undefined)
              }}
            >
              {shouldLoadVideo && (
                <source src="https://media.w3.org/2010/05/sintel/trailer.mp4" type="video/mp4" />
              )}
              Your browser does not support HTML video.
            </video>
            <div className="glass-demo__video-caption">
              <p className="glass-demo__eyebrow">Test 05</p>
              <h2 id="video-title">Live video reflection</h2>
              <p>Scroll this colorful animation beneath the glass to see moving color and detail travel through the lower edge.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
