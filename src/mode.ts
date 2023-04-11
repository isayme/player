export enum RepeatMode {
  DEFAULT = 1,
  REPEAT,
  RANDOM,
}

export function getRepeatMode(mode: RepeatMode): IRepeatMode {
  if (mode == RepeatMode.REPEAT) {
    return new RepeatModeRepeat()
  } else if (mode == RepeatMode.RANDOM) {
    return new RepeatModeRandom()
  } else {
    return new RepeatModeDefault()
  }
}

export interface IRepeatMode {
  getPrevIndex(cur: number, total: number): number
  getNextIndex(cur: number, total: number): number
  getNextMode(): IRepeatMode
  getMode(): RepeatMode
}

export class RepeatModeDefault implements IRepeatMode {
  playDelta(cur: number, total: number, delta: number) {
    if (cur < 0) {
      cur = 0
    }

    if (total <= 0) {
      return -1
    }

    return (cur + delta) % total
  }

  getPrevIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, -1)
  }

  getNextIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, 1)
  }

  getNextMode(): IRepeatMode {
    return new RepeatModeRepeat()
  }

  getMode() {
    return RepeatMode.DEFAULT
  }
}

export class RepeatModeRepeat implements IRepeatMode {
  playDelta(cur: number, total: number, delta: number) {
    if (cur < 0) {
      cur = 0
    }

    if (total <= 0) {
      return -1
    }

    return (cur + delta) % total
  }

  getPrevIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, -1)
  }

  getNextIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, 1)
  }
  getNextMode(): IRepeatMode {
    return new RepeatModeRandom()
  }

  getMode() {
    return RepeatMode.REPEAT
  }
}

export class RepeatModeRandom implements IRepeatMode {
  playDelta(cur: number, total: number, _delta: number) {
    if (total <= 0) {
      return -1
    }

    if (total == 1) {
      return 0
    }

    let idx = Math.round(Math.random() * (total - 1))
    if (idx === cur) {
      return idx + 1
    } else {
      return idx
    }
  }
  getPrevIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, -1)
  }

  getNextIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, 1)
  }

  getNextMode(): IRepeatMode {
    return new RepeatModeDefault()
  }

  getMode() {
    return RepeatMode.RANDOM
  }
}
