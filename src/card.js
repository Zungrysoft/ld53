import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as vec2 from './core/vector2.js'
import * as soundmanager from './core/soundmanager.js'
import Thing from './core/thing.js'

const rankStrings = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
]

const majorScale = [
  1,
  Math.pow(2, 2 / 12),
  Math.pow(2, 4 / 12),
  Math.pow(2, 5 / 12),
  Math.pow(2, 7 / 12),
  Math.pow(2, 9 / 12),
  Math.pow(2, 11 / 12),
  2
]

export default class Card extends Thing {
  rank = 0
  suit = 'spade'
  target = []
  isFlipped = false
  aabb = [-40, -55, 40, 55]
  hoverTime = 0
  mode = 'deck'
  choice = 0
  executedMoves = []
  exploded = false
  yScale = 1
  movementDelay = 0
  targetDepth = NaN

  constructor (rank, suit) {
    super()
    this.target = [0, 0]
    this.rank = rank
    this.suit = suit
  }

  update () {
    super.update()
    let delta = vec2.scale(vec2.subtract(this.target, this.position), 0.5)

    // if this card has a movement delay, don't move
    if (this.movementDelay > 0) {
      delta[0] = 0
      delta[1] = 0
      this.movementDelay -= 1
    }

    // if card has reached target, set depth to target depth
    if (vec2.magnitude(delta) > 1 && !Number.isNaN(this.targetDepth)) {
      this.depth = this.targetDepth
      this.targetDepth = NaN
    }

    // have a different speed depending on where this card is going
    let maxSpeed = 25
    if (this.mode === 'tableau') {
      maxSpeed = 60
    }
    if (this.mode === 'foundation') {
      maxSpeed = 90
    }

    // vertically squish the card when moving
    this.yScale = u.lerp(this.yScale, 1, 0.3)
    if (vec2.magnitude(delta) > maxSpeed) {
      delta = vec2.toLength(delta, maxSpeed)
      if (Math.abs(this.target[0] - this.position[0]) > 4) {
        this.yScale = 0.45
      }
    }

    // move by delta
    this.position[0] += delta[0]
    this.position[1] += delta[1]

    // check mouse over and do hover animation
    const mouseCursor = game.getThing('mousecursor')
    this.mouseOver = (
      mouseCursor && mouseCursor.hovering === this && this.checkCanInteract()
    )
    if (this.mouseOver) {
      this.hoverTime = Math.min(this.hoverTime + 1 / 3, 1)
    } else {
      this.hoverTime = Math.max(this.hoverTime - 1 / 2, 0)
    }

    // move this card when it's clicked
    const board = game.getThing('board')
    if (game.mouse.leftClick && this.mouseOver && this.possibilities.length > 0) {
      const move = this.possibilities[this.choice % this.possibilities.length]
      if (typeof move === 'string' && !this.executedMoves.includes(move)) {
        // move to foundation and do explosion animation
        const sound = u.choose('cardFoundation1', 'cardFoundation2', 'cardFoundation3', 'cardFoundation4')
        soundmanager.playSound(sound, 0.04)
        game.setImpactFrames(2)
        game.setScreenShake(12, 4)
        board.executeMove(this.rank, this.suit, move)
        this.position = [...this.target]
        this.depth = this.targetDepth
        this.targetDepth = NaN
        this.explode()
      } else {
        // move on tableau and do sound
        soundmanager.playSound(u.choose('cardMove', 'cardMove1'), 0.05)
        board.executeMove(this.rank, this.suit, move)
      }
      this.choice = 0
    }

    // rotate card choice when right clicked
    if (game.mouse.rightClick && this.mouseOver && this.possibilities.length > 1) {
      soundmanager.playSound('cardRotate', 0.1)
      this.choice += 1
    }
  }

  checkCanInteract () {
    return !game.getThing('board').hasWon && !this.isFlipped
  }

  flip () {
    if (this.timer('flip')) return false
    const board = game.getThing('board')
    if (board.isSimulation) {
      this.isFlipped = false
      return true
    }
    this.after(20, () => {
      this.isFlipped = false
      this.recalculate()
    }, 'flip')
    if (this.isFlipped) {
      soundmanager.playSound('cardReveal', 0.1, majorScale[Math.min(board.revealCombo, 7)])
      board.revealCount += 1
      game.setImpactFrames(1)
      // game.setScreenShake(4, 1)
    }
    return true
  }

  recalculate () {
    this.possibilities = game.getThing('board').getPossibleMoves(this.rank, this.suit)
  }

  draw () {
    const { ctx } = game
    ctx.save()
    ctx.translate(...this.position)
    const scalar = u.map(this.hoverTime, 0, 1, 1, 1.15, true)
    ctx.scale(scalar, scalar * this.yScale)
    const flip = (
      this.isFlipped
        ? 1 + this.timer('flip')
        : this.timer('flip')
    )
    drawCard(this.rank, this.suit, flip, this.possibilities.length === 0 || !this.checkCanInteract())
    ctx.restore()
  }

  postDraw () {
    const { ctx } = game
    // draw ghost of next position
    if (this.mouseOver && u.distance(this.target, this.position) < 4) {
      for (const move of this.possibilities) {
        ctx.save()
        if (typeof move === 'number') {
          ctx.translate(...game.getThing('board').getTableauPosition(move))
        } else {
          ctx.translate(...game.getThing('board').getFoundationPosition(move))
        }
        if (move === this.possibilities[this.choice % this.possibilities.length]) {
          ctx.scale(1.15, 1.15)
          ctx.globalAlpha = u.map(Math.sin(game.getTime() * 7), -1, 1, 0.5, 0.75)
        } else {
          ctx.scale(1.05, 1.05)
          ctx.globalAlpha = 0.25
        }
        drawCard(this.rank, this.suit, 0, true)
        ctx.restore()
      }
    }
  }

  explode () {
    if (game.getThing('board')?.isSimulation) return
    if (this.exploded) return
    this.exploded = true
    for (let i = 0; i < 16; i += 1) {
      game.addThing(new Explosion(this.position))
    }
  }
}

class Explosion extends Thing {
  sprite = 'explosion'
  depth = 50
  animations = {
    idle: {
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      speed: u.random(1 / 2, 1 / 3),
      frameSize: 100
    }
  }

  constructor (position, callback = () => {}) {
    super()
    this.position = [...position]
    this.speed = vec2.angleToVector(u.random(0, Math.PI * 2), u.random(0, 10))
    const scale = u.random(1, 2)
    this.scale = [scale, scale]
    this.after((1 / this.animations.idle.speed) * 16, () => {
      this.dead = true
      callback()
    })
  }

  update () {
    super.update()
    const friction = 0.95
    this.speed[0] *= friction
    this.speed[1] *= friction
  }
}

/*
   draws a card to the 2D canvas with a given rank, suit, and flip value
   flip is a float, where 0 is face-up and 1 is face-down
*/
export function drawCard (rank, suit, flip = 0, disabled = false) {
  const { ctx } = game
  const w = 80
  const h = 108
  const r = 7
  const isFlipped = Math.cos(flip * Math.PI) <= 0

  // rainbowy gradient
  const gradient = ctx.createLinearGradient(-80, -70, 80, 70)
  const time = game.getTime() / 4
  const scroll = time % 1
  for (let i = 0; i < 7; i += 1) {
    if (i / 7 - scroll >= 0) {
      gradient.addColorStop(i / 7 - scroll, u.colorToString(u.hsvToRgb(i / 7, 0.2, 1)))
    }
    if (i / 7 + 1 - scroll <= 1) {
      gradient.addColorStop(i / 7 + 1 - scroll, u.colorToString(u.hsvToRgb(i / 7, 0.2, 1)))
    }
  }

  ctx.save()
  ctx.scale(Math.cos(flip * Math.PI), 1)
  const flipAnnounce = 1 + Math.abs(Math.sin(flip * Math.PI)) * 0.5
  ctx.scale(flipAnnounce, flipAnnounce)
  ctx.strokeStyle = (
    !isFlipped && (suit === 'heart' || suit === 'diamond')
      ? 'red'
      : 'black'
  )
  ctx.lineWidth = 4
  if (isFlipped) {
    ctx.fillStyle = 'cornflowerBlue'
  } else {
    ctx.fillStyle = disabled ? 'white' : gradient
  }
  ctx.beginPath()
  ctx.moveTo(-w / 2, h / 2 - r)
  ctx.lineTo(-w / 2, r - h / 2)
  ctx.arc(-w / 2 + r, r - h / 2, r, Math.PI, Math.PI * 1.5)
  ctx.lineTo(w / 2 - r, -h / 2)
  ctx.arc(w / 2 - r, r - h / 2, r, Math.PI * 1.5, Math.PI * 2)
  ctx.lineTo(w / 2, h / 2 - r)
  ctx.arc(w / 2 - r, h / 2 - r, r, 0, Math.PI * 0.5)
  ctx.lineTo(r - w / 2, h / 2)
  ctx.arc(r - w / 2, h / 2 - r, r, Math.PI * 0.5, Math.PI * 1.01)
  ctx.fill()
  ctx.stroke()
  if (!isFlipped) {
    ctx.fillStyle = 'black'
    ctx.font = '24px Arial'
    ctx.fillText(rankStrings[rank], -w / 2 + 8, -h / 2 + 26)
    ctx.drawImage(game.assets.images[`${suit}Suit`], w / 2 - 28, -h / 2 + 5, 24, 24)
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(rankStrings[rank], 0, 32)
  }
  ctx.restore()
}
