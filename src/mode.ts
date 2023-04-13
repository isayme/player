export enum RepeatMode {
  LOOP = 1,
  ONE,
  SHUFFLE,
}

export function getRepeatMode(mode: RepeatMode): IRepeatMode {
  if (mode == RepeatMode.ONE) {
    return new RepeatModeOne()
  } else if (mode == RepeatMode.SHUFFLE) {
    return new RepeatModeShuffle()
  } else {
    return new RepeatModeLoop()
  }
}

export interface IRepeatMode {
  getPrevIndex(cur: number, total: number): number
  getNextIndex(cur: number, total: number): number
  getNextMode(): IRepeatMode
  getMode(): RepeatMode
}

export class RepeatModeLoop implements IRepeatMode {
  playDelta(cur: number, total: number, delta: number) {
    if (cur < 0) {
      cur = 0
    }

    if (total <= 0) {
      return -1
    }

    delta = delta % total
    if (delta < 0) {
      delta += total
    }

    return (cur + delta + total) % total
  }

  getPrevIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, -1)
  }

  getNextIndex(cur: number, total: number): number {
    return this.playDelta(cur, total, 1)
  }
  getNextMode(): IRepeatMode {
    return new RepeatModeOne()
  }

  getMode() {
    return RepeatMode.LOOP
  }
}

export class RepeatModeOne implements IRepeatMode {
  getPrevIndex(cur: number, _total: number): number {
    return cur
  }

  getNextIndex(cur: number, _total: number): number {
    return cur
  }

  getNextMode(): IRepeatMode {
    return new RepeatModeShuffle()
  }

  getMode() {
    return RepeatMode.ONE
  }
}

export class RepeatModeShuffle implements IRepeatMode {
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
    return new RepeatModeLoop()
  }

  getMode() {
    return RepeatMode.SHUFFLE
  }
}
