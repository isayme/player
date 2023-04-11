// @ts-nocheck

import persist from '@alpinejs/persist'
import Alpine from 'alpinejs'

import { getRepeatMode, RepeatMode } from './mode'
import './style.css'

Alpine.plugin(persist)

function toFiexd(f, n) {
  return parseFloat(f.toFixed(n))
}

Alpine.store('data', {
  // 页面标题
  title: '音乐播放器',
  favicon: './favicon.png',

  // 音乐列表
  musicList: [],

  currentPlayIndex: 0,

  // 是否暂停播放. chrome 不允许自动播放, 无需持久化此状态
  paused: true,
  // paused: Alpine.$persist(false).as('x-paused'),

  // 循环模式
  _repeatMode: Alpine.$persist(RepeatMode.DEFAULT).as('x-repeat-mode'),
  repeatMode: null,

  // 当前播放的音乐
  current: {},
  // 当前播放时间
  cursor: Alpine.$persist(0).as('x-cursor'),
  // 当前音乐的总时长
  duration: 0,
  // 当前播放进度
  progress: Alpine.$persist(0).as('x-progress'),

  // 音量: [0-1]
  volume: Alpine.$persist(1).as('x-volume'),
  preVolume: Alpine.$persist(1).as('x-pre-volume'),

  init() {
    this.repeatMode = getRepeatMode(this._repeatMode)
  },

  get player() {
    return this.$refs.player
  },

  get progressbar() {
    return this.$refs.progressbar
  },

  initPlayer() {
    this.doInitPlayer().catch((err) => {
      console.log(`init player error: ${err}`)
    })
  },

  async doInitPlayer() {
    console.log(`init muted: ${this.muted}`)
    console.log(`init volume: ${this.volume}`)
    console.log(`init repeat-mode: ${this.repeatMode.getMode()}`)

    if (isNaN(this.volume) || this.volume < 0 || this.volume > 1) {
      this.volume = 1
    }

    this.player.ontimeupdate = () => {
      this.cursor = this.player.currentTime
      if (this.duration > 0) {
        this.progress = (this.cursor * 100) / this.duration
        if (this.cursor === this.duration) {
          this.playNext()
        }
      }
    }

    // 开始播放时获取新音乐的时长
    this.player.onplay = () => {
      // this.cursor = 0
      console.log(`duration ${this.player.duration}`)
      this.duration = this.player.duration
    }

    this.player.muted = this.muted
    this.player.volume = this.getVolume()
    this.player.pause()

    this.player.currentTime = this.cursor

    const resp = await fetch('/data.json')
    if (resp.ok) {
      const { title, favicon, musicList } = await resp.json()
      if (title) {
        this.title = title
      }
      if (favicon) {
        this.favicon = favicon
      }

      if (musicList && musicList.length) {
        console.log(`music-list: ${musicList.length}`)
        this.musicList = musicList
      }

      if (this.currentPlayIndex >= 0) {
        this.current = this.musicList[this.currentPlayIndex]
      }
    }
  },

  togglePaused() {
    this.paused = !this.paused
    console.log(`paused: ${this.paused}`)

    if (this.paused) {
      this.player.pause()
    } else {
      this.player.currentTime = toFiexd(this.cursor, 2)
      this.player.play()
    }
  },

  playCurrent() {
    if (this.currentPlayIndex >= 0) {
      this.current = this.musicList[this.currentPlayIndex]
      if (this.muted) {
        this.toggleMuted()
      }

      this.player.play()
    } else {
      this.paused = true
      this.player.pause()
      this.current = this.musicList[0]
    }
  },

  playNext() {
    let idx = this.repeatMode.getNextIndex(
      this.currentPlayIndex,
      this.musicList.length,
    )
    console.log(`play music changed: ${this.currentPlayIndex} => ${idx}`)
    this.currentPlayIndex = idx
    this.paused = false
    this.playCurrent()
  },

  playPrev() {
    let idx = this.repeatMode.getPrevIndex(
      this.currentPlayIndex,
      this.musicList.length,
    )
    console.log(`play music changed: ${this.currentPlayIndex} => ${idx}`)
    this.currentPlayIndex = idx

    this.paused = false
    this.playCurrent()
  },

  getVolume() {
    if (isNaN(this.volume)) {
      return 1
    }

    if (this.volume > 1) {
      return 1
    }

    if (this.volume < 0) {
      return 0
    }

    return this.volume
  },

  get muted() {
    return this.volume === 0
  },

  toggleMuted() {
    this.player.muted = !this.player.muted
    if (this.player.muted) {
      this.preVolume = this.volume
      this.volume = 0
    } else {
      this.volume = this.preVolume || this.player.volume || 1
      this.player.volume = this.volume
    }
    console.log(`muted: ${this.muted} volume: ${this.volume}`)
  },

  updateVolume(volume: number) {
    volume = parseFloat(volume.toFixed(1))
    console.log(`volume: ${volume}`)
    this.volume = volume
    this.player.volume = volume
    this.player.muted = this.muted
  },

  volumeUp() {
    this.updateVolume(Math.min(this.volume + 0.1, 1))
  },

  volumeDown() {
    this.updateVolume(Math.max(this.volume - 0.1, 0))
  },

  onClickProgressBar(event) {
    const rect = this.progressbar.getBoundingClientRect()
    this.player.currentTime = toFiexd(
      (this.duration * event.offsetX) / rect.width,
      2,
    )
  },

  changeToNextRepeatMode() {
    this.repeatMode = this.repeatMode.getNextMode()
    this._repeatMode = this.repeatMode.getMode()
    console.log(`repeat-mode: ${this._repeatMode}`)
  },

  get repeatModeIsDefault(): boolean {
    return this.repeatMode.getMode() == RepeatMode.DEFAULT
  },

  repeatModeIsRepeat(): boolean {
    return this.repeatMode.getMode() == RepeatMode.REPEAT
  },

  get repeatModeIsRandom(): boolean {
    return this.repeatMode.getMode() == RepeatMode.RANDOM
  },
})

Alpine.start()
