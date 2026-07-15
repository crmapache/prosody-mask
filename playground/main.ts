import { createMask, defaultStyle, type MaskHandle, type MaskStyle } from 'prosody-mask'
import { sampleAiTokens, sampleAudioTokens, sampleText, sampleWordTimings } from './sample'
import { $ } from './dom'
import { initStyleControls } from './style-controls'
import { initPresets, renderPresets } from './presets'
import { initModeToggle } from './mode-toggle'
import { initAudioPlayer } from './audio-player'
import { initAiPrompts } from './ai-prompts'

const style: MaskStyle = { ...defaultStyle }

const demoMask: MaskHandle = createMask($('demo'), { tokens: sampleAudioTokens }, style)

initStyleControls(demoMask, style, defaultStyle, () => renderPresets(style))
initPresets(style)
initModeToggle(
  demoMask,
  { text: sampleText, lang: 'en', aiTokens: sampleAiTokens, audioTokens: sampleAudioTokens },
  'audio',
)
initAudioPlayer(sampleWordTimings)
initAiPrompts()
