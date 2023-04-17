// @ts-nocheck

import persist from '@alpinejs/persist'
import Alpine from 'alpinejs'

import { getRepeatMode, RepeatMode } from './mode'
import './style.css'

function updateDocumentHeight() {
  console.log(`height: ${window.innerHeight}`)
  document.documentElement.style.setProperty(
    '--vh-100',
    `${window.innerHeight}px`,
  )
}

updateDocumentHeight()
window.addEventListener('resize', updateDocumentHeight)

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

  currentPlayIndex: Alpine.$persist(-1).as('x-listening'),

  // 是否暂停播放. chrome 不允许自动播放, 无需持久化此状态
  paused: true,
  // paused: Alpine.$persist(false).as('x-paused'),

  // 循环模式
  _repeatMode: Alpine.$persist(RepeatMode.LOOP).as('x-repeat-mode'),
  repeatMode: null,

  // 当前播放的音乐
  current: {},
  // 当前播放时间
  cursor: Alpine.$persist(0).as('x-cursor'),
  // 当前音乐的总时长
  duration: 0,

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

    this.player.volume = this.getVolume()
    this.volume = this.player.volume

    this.player.ontimeupdate = () => {
      this.cursor = this.player.currentTime
      if (this.duration > 0) {
        if (this.cursor === this.duration) {
          this.playNext()
        }
      }
    }

    this.player.ondurationchange = () => {
      console.log(`duration ${this.player.duration}`)
      this.duration = this.player.duration
    }

    this.player.onvolumechange = () => {
      console.log(`volume ${this.player.volume}`)
      if (this.volume) {
        this.preVolume = this.volume
      }
      this.volume = this.player.volume
    }

    this.player.onplaying = () => {
      this.paused = false
      console.log(`paused: ${this.paused}`)
    }

    this.player.onpause = () => {
      this.paused = true
      console.log(`paused: ${this.paused}`)
    }

    this.player.currentTime = this.cursor

    const resp = await fetch('./data.json')
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

      if (this.musicList?.length > 0) {
        if (
          !(
            this.currentPlayIndex >= 0 &&
            this.currentPlayIndex < this.musicList.length
          )
        ) {
          this.currentPlayIndex = 0
        }

        this.current = this.musicList[this.currentPlayIndex]
        this.player.load()
      } else {
        this.currentPlayIndex = -1
      }
    }

    console.log(`set pause`)
    this.player.pause()
    this.player.autoplay = true
  },

  togglePaused() {
    if (this.paused) {
      this.player.currentTime = toFiexd(this.cursor, 2)
      this.player.play()
    } else {
      this.player.pause()
    }
  },

  playCurrent() {
    if (this.currentPlayIndex >= 0) {
      this.current = this.musicList[this.currentPlayIndex]
      if (this.paused) {
        this.paused = false
        this.player.play()
      }
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
    this.player.currentTime = 0
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
    this.player.currentTime = 0

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

  get progress() {
    if (this.duration > 0) {
      return Math.min(100, (this.cursor * 100) / this.duration)
    }
    return 0
  },

  get muted() {
    return this.volume === 0
  },

  toggleMuted() {
    if (this.player.volume > 0) {
      this.player.volume = 0
    } else {
      this.updateVolume(this.preVolume)
    }
  },

  updateVolume(volume: number) {
    volume = parseFloat(volume.toFixed(1))
    this.player.volume = volume
  },

  volumeUp() {
    this.updateVolume(Math.min(this.player.volume + 0.1, 1))
  },

  volumeDown() {
    this.updateVolume(Math.max(this.player.volume - 0.1, 0))
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

  get repeatModeIsLoop(): boolean {
    return this.repeatMode.getMode() == RepeatMode.LOOP
  },

  get repeatModeIsOne(): boolean {
    return this.repeatMode.getMode() == RepeatMode.ONE
  },

  get repeatModeIsShuffle(): boolean {
    return this.repeatMode.getMode() == RepeatMode.SHUFFLE
  },

  formatTime(seconds: number) {
    let m = `${Math.floor(seconds / 60)}`.padStart(2, '0')
    let s = `${Math.floor(seconds % 60)}`.padStart(2, '0')
    return `${m}:${s}`
  },
})

Alpine.start()
