/** Hiệu ứng âm thanh tổng hợp bằng Web Audio API, không dùng file asset. */

export type SoundName = "dice" | "step" | "leaveBase" | "capture" | "finishToken" | "win" | "turnLost" | "chat"

let context: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  context ??= new AudioContext()
  if (context.state === "suspended") void context.resume()
  return context
}

interface ToneOptions {
  frequency: number
  endFrequency?: number
  duration: number
  delay?: number
  type?: OscillatorType
  volume?: number
}

function tone(ctx: AudioContext, options: ToneOptions) {
  const { frequency, endFrequency, duration, delay = 0, type = "sine", volume = 0.2 } = options
  const start = ctx.currentTime + delay
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

/** Tiếng lách cách: vài xung nhiễu ngắn lọc thông dải. */
function rattle(ctx: AudioContext, clicks: number) {
  const length = Math.floor(ctx.sampleRate * 0.03)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2

  for (let i = 0; i < clicks; i++) {
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    source.buffer = buffer
    filter.type = "bandpass"
    filter.frequency.value = 1800 + Math.random() * 1600
    gain.gain.value = 0.35
    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(ctx.currentTime + i * 0.06 + Math.random() * 0.02)
  }
}

const SOUNDS: Record<SoundName, (ctx: AudioContext) => void> = {
  dice: (ctx) => rattle(ctx, 7),
  step: (ctx) => tone(ctx, { frequency: 660, duration: 0.07, type: "triangle", volume: 0.12 }),
  leaveBase: (ctx) => {
    tone(ctx, { frequency: 392, duration: 0.12, type: "triangle" })
    tone(ctx, { frequency: 587, duration: 0.18, delay: 0.09, type: "triangle" })
  },
  capture: (ctx) => {
    tone(ctx, { frequency: 880, endFrequency: 110, duration: 0.35, type: "sawtooth", volume: 0.12 })
    rattle(ctx, 2)
  },
  finishToken: (ctx) =>
    [523, 659, 784].forEach((frequency, i) =>
      tone(ctx, { frequency, duration: 0.18, delay: i * 0.08, type: "triangle" })
    ),
  win: (ctx) =>
    [523, 659, 784, 1047, 784, 1047].forEach((frequency, i) =>
      tone(ctx, { frequency, duration: i === 5 ? 0.5 : 0.16, delay: i * 0.13, type: "square", volume: 0.08 })
    ),
  turnLost: (ctx) => tone(ctx, { frequency: 330, endFrequency: 196, duration: 0.3, type: "triangle" }),
  chat: (ctx) => {
    tone(ctx, { frequency: 988, duration: 0.06, type: "sine", volume: 0.1 })
    tone(ctx, { frequency: 1319, duration: 0.09, delay: 0.06, type: "sine", volume: 0.1 })
  },
}

export function playSound(name: SoundName) {
  const ctx = audioContext()
  if (ctx) SOUNDS[name](ctx)
}
