import Thing from './core/thing.js'
import * as game from './core/game.js'
import * as u from './core/utils.js'

export default class Popup extends Thing {
  sprite = null
  depth = 100
  time = 0
  isRespectingSolidThings = false

  constructor (position, text) {
    super()
    this.position = [...position]
    this.velocity = [0, -5]
    this.text = text
  }

  update () {
    super.update()
    const friction = 0.9
    this.velocity[0] *= friction
    this.velocity[1] *= friction
    this.time += 1
    if (this.time > 60) {
      this.dead = true
    }
  }

  draw () {
    // if (this.time > 40 && this.time % 10 < 5) return
    const { ctx } = game
    const scoreString = this.text
    ctx.save()
    ctx.translate(...this.position)
    ctx.scale(...this.scale)
    ctx.rotate(this.rotation)
    ctx.globalAlpha = u.map(this.time, 40, 60, 1, 0) ** 2
    ctx.textAlign = 'center'
    ctx.font = 'italic 26px Arial'
    ctx.save()
    ctx.translate(4, 4)
    ctx.fillStyle = 'black'
    ctx.fillText(scoreString, 0, 0)
    ctx.restore()
    ctx.fillStyle = u.colorToString(u.hsvToRgb(this.time * 0.02, 1, 1))
    ctx.fillText(scoreString, 0, 0)
    ctx.restore()
  }

  checkShouldCollideWithThing () { return false }
}
