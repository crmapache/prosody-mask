import { $ } from './dom'

/** One word's spoken-time span, in seconds. */
export interface WordTiming {
  start: number
  end: number
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Wire the custom audio player under the demo passage (a Deepgram TTS render)
 * and karaoke-highlight the word currently spoken. Word spans are queried
 * fresh each frame - the mode toggle rebuilds them - and index-matched against
 * `wordTimings`, so highlighting keeps working across every pitch-source mode.
 */
export function initAudioPlayer(wordTimings: WordTiming[]): void {
  const audio = $<HTMLAudioElement>('audio')
  const wrap = $('audio-player')
  const btn = $('audio-btn')
  const fill = $('audio-fill')
  const time = $('audio-time')
  const track = $('audio-track')
  const demo = $('demo')

  const wordSpans = (): HTMLElement[] =>
    Array.from(demo.querySelectorAll<HTMLElement>('span')).filter((s) => s.getAttribute('aria-hidden') !== 'true')

  let highlightRaf = 0

  function clearHighlight(): void {
    for (const s of wordSpans()) s.classList.remove('speaking')
  }

  function highlightLoop(): void {
    const t = audio.currentTime
    const spoken = wordTimings.findIndex((w) => t >= w.start && t < w.end)
    const spans = wordSpans()
    spans.forEach((s, i) => s.classList.toggle('speaking', i === spoken))
    if (!audio.paused && !audio.ended) highlightRaf = requestAnimationFrame(highlightLoop)
  }

  btn.addEventListener('click', () => {
    if (audio.paused) void audio.play()
    else audio.pause()
  })
  audio.addEventListener('play', () => {
    wrap.classList.add('is-playing')
    btn.setAttribute('aria-label', 'Pause')
    cancelAnimationFrame(highlightRaf)
    highlightRaf = requestAnimationFrame(highlightLoop)
  })
  audio.addEventListener('pause', () => {
    wrap.classList.remove('is-playing')
    btn.setAttribute('aria-label', 'Play')
    cancelAnimationFrame(highlightRaf)
    clearHighlight()
  })
  audio.addEventListener('loadedmetadata', () => {
    time.textContent = formatTime(audio.duration)
  })
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
    fill.style.width = `${pct}%`
    time.textContent = formatTime(audio.currentTime)
  })
  audio.addEventListener('ended', () => {
    fill.style.width = '0%'
    time.textContent = formatTime(audio.duration)
    cancelAnimationFrame(highlightRaf)
    clearHighlight()
  })
  track.addEventListener('click', (e) => {
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, ((e as MouseEvent).clientX - rect.left) / rect.width))
    if (audio.duration) audio.currentTime = ratio * audio.duration
  })
}
