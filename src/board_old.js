import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as soundmanager from './core/soundmanager.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import Thing from './core/thing.js'
import Card from './card.js'
import Popup from './popup.js'

const foundationDomain = [255, 695]
const foundationPositions = {
  spade: [u.lerp(...foundationDomain, 0), 70],
  club: [u.lerp(...foundationDomain, 1 / 3), 70],
  diamond: [u.lerp(...foundationDomain, 2 / 3), 70],
  heart: [u.lerp(...foundationDomain, 1), 70]
}

export default class Board extends Thing {
  deck = []
  tableau = [[], [], [], [], [], [], []]
  deckScroll = 0
  backgroundScroll = [0, 0]
  backgroundPattern = game.ctx.createPattern(game.assets.images.background, 'repeat')
  score = 0
  visualScore = 0
  time = 0
  revealCombo = 0
  foundationCombo = 0
  revealCount = 0
  isSimulation = false
  initialDeck = null
  hasWon = false
  foundation = {
    spade: [],
    club: [],
    heart: [],
    diamond: []
  }

  constructor () {
    super()
    // document.querySelector('#canvas2d').style.imageRendering = 'smooth'
    // document.body.style.backgroundImage = 'none'
    game.setThingName(this, 'board')
    game.addThing(new MouseCursor())
    // soundmanager.setSoundVolume(0.025)
    this.makeSolvableGame()
    console.log(this.checkGameDifficulty())
    this.getAllCards().forEach(card => {
      game.addThing(card)
      card.recalculate()
    })
    console.log(JSON.stringify(this.initialDeck))

    //this.winAnimation()
  }

  update () {
    super.update()
    if (game.assets.sounds.music.paused) {
      //soundmanager.playMusic('music', 0.065)
    }
    this.backgroundScroll[0] += 1 / 8
    this.backgroundScroll[1] += 1 / 16
    this.deckScroll -= game.mouse.scrollDelta[1]
    this.deckScroll = Math.min(this.deckScroll, 0)
    this.deckScroll = Math.max(this.deckScroll, -1 * (75 + this.deck.length * 65) + 600)
    if (!this.hasWon) this.time += 1
    const scoreDelta = u.lerp(this.visualScore, this.score, 0.15) - this.visualScore
    this.visualScore += Math.min(scoreDelta, 300)
    this.updateDeckCardTargets()

    if (game.keysDown.Space && !this.hasWon) {
      this.isSimulation = true
      this.executeBestPossibleMove()
      this.isSimulation = false
      this.getAllCards().forEach(card => card.recalculate())
      if (this.checkIsSolved() && this.deck.length === 0) {
        this.winAnimation()
      }
    }

    if (game.keysPressed.KeyR) {
      this.makeGame()
      this.getAllCards().forEach(card => {
        game.addThing(card)
        card.recalculate()
      })
    }

    if (!this.isSimulation && this.checkIsSolved() && this.deck.length === 0) {
      this.winAnimation()
    }
  }

  preDraw () {
    const { ctx } = game

    // draw cool 3d background
    /*
    const { assets } = game
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('color', [1, 1, 1, 1])
    gfx.setTexture(assets.textures.background)
    gfx.set('modelMatrix', mat.getTransformation({
      //scale: [200, 200, -100],
      //rotation: [0, 0, this.backgroundScroll[0] * -0.005]
    }))
    gfx.drawMesh(assets.meshes.cube)
    */

    // draw scrolling game background
    ctx.save()
    ctx.translate(...this.backgroundScroll)
    ctx.fillStyle = this.backgroundPattern
    ctx.fillRect(
      -1 * this.backgroundScroll[0],
      -1 * this.backgroundScroll[1],
      game.config.width,
      game.config.height
    )
    ctx.restore()

    // draw deck background
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fillRect(0, 0, 150, 600)
    ctx.restore()

    // draw foundation pile ghosts
    ctx.save()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 4
    for (const suit in foundationPositions) {
      ctx.save()
      ctx.translate(...foundationPositions[suit])
      ctx.globalAlpha = 0.5
      drawCardOutline()
      ctx.drawImage(game.assets.images[`${suit}Suit`], -24, -24, 48, 48)
      ctx.restore()
    }
    ctx.restore()
  }

  postDraw () {
    const { ctx } = game

    // draw score
    ctx.save()
    ctx.translate(160, 600 - 10)
    const scale = Math.min(
      u.squareMap(Math.sqrt(Math.abs(this.visualScore - this.score)), 0, 10, 1, 1.125),
      1.35
    )
    ctx.scale(scale, scale)
    const scoreString = String(Math.round(this.visualScore)).padStart(6, '0')
    ctx.font = 'italic bold 35px Courier New'
    ctx.fillStyle = 'black'
    ctx.fillText(scoreString, 2, 2)
    const hue = 0.5 + u.map(Math.sqrt(Math.abs(this.visualScore - this.score)), 0, 100, 0, 0.5, true)
    ctx.fillStyle = u.colorToString(u.hsvToRgb(hue, 1, 1))
    ctx.fillText(scoreString, 0, 0)
    ctx.restore()

    // draw time
    ctx.save()
    ctx.translate(800 - 10, 600 - 10)
    ctx.textAlign = 'right'
    const timeString = u.toTimeString(this.time / 60, 0).padStart(5, '0')
    ctx.font = 'italic bold 35px Courier New'
    ctx.fillStyle = 'black'
    ctx.fillText(timeString, 2, 2)
    ctx.fillStyle = 'cyan'
    ctx.fillText(timeString, 0, 0)
    ctx.restore()
  }

  reshuffle () {
    this.initialDeck = createDeck()
  }

  makeGame () {
    if (!this.initialDeck) this.reshuffle()
    game.getThings().forEach(thing => {
      if (thing instanceof Card) {
        thing.dead = true
      }
    })
    this.score = 0
    this.visualScore = 0
    this.foundationCombo = 0
    this.revealCombo = 0
    this.time = 0
    this.hasWon = false
    this.deck = this.initialDeck.map(([rank, suit]) => new Card(rank, suit))
    this.tableau = [[], [], [], [], [], [], []]
    this.foundation = {
      spade: [],
      club: [],
      heart: [],
      diamond: []
    }
    this.tableau.forEach((column, i) => {
      while (column.length <= i) {
        const card = this.deck.pop()
        if (column.length !== i) {
          card.isFlipped = true
        }
        column.push(card)
      }
    })
    this.updateTableauCardTargets()
    this.updateDeckCardTargets()
    this.getAllCards().forEach(card => card.recalculate())
  }

  makeSolvableGame () {
    let iter = 0
    while (true) {
      this.reshuffle()
      this.makeGame()
      if (this.checkIsGameSolvable()) {
        console.log(`solvable! ${iter}`)
        break
      }
      iter += 1
      if (iter > 100) {
        console.log('gave up! idk if this is solvable')
        break
      }
    }
    this.makeGame()
  }

  checkIsGameSolvable () {
    this.isSimulation = true
    for (let i = 0; i < 100; i += 1) {
      this.executeBestPossibleMove()
      if (this.checkIsSolved()) {
        this.isSimulation = false
        return true
      }
    }
    this.isSimulation = false
    return false
  }

  checkGameDifficulty () {
    let wins = 0
    for (let i = 0; i < 10; i += 1) {
      this.makeGame()
      if (this.checkIsGameSolvable()) {
        wins += 1
      }
    }
    this.makeGame()
    return 1 - wins / 10
  }

  getRankedPossibleMoves () {
    const moveHeuristic = (rank, suit, move) => {
      // try not to move things out of foundation...
      if (this.foundation[suit].includes(this.getCardReference(rank, suit))) {
        return -10
      }

      // once the game is solved, move everything to foundation
      if (this.checkIsSolved() && typeof move === 'string') {
        return Infinity
      }

      let score = 0

      // if this move is to the foundation, do it!
      if (typeof move === 'string') {
        score += 100
      }

      // if moving this card frees a column, do it!
      const parent = this.getParentOfCard(rank, suit)
      if (!parent) {
        score += 150
      }

      // if moving this card reveals a card, do it!
      if (parent?.isFlipped) {
        score += 50
      }

      return score
    }
    const moves = this.getAllPossibleMoves()
    moves.forEach(move => {
      move.score = moveHeuristic(move.rank, move.suit, move.move)
    })
    u.shuffle(moves)
    moves.sort((a, b) => a.score - b.score)
    return moves
  }

  executeBestPossibleMove () {
    const moves = this.getRankedPossibleMoves()
    if (moves.length > 0) {
      const getIndex = () => Math.floor(u.random(0, moves.length - 0.01))
      const maxIndex = Math.max(getIndex(), getIndex(), getIndex())
      const { rank, suit, move } = moves[maxIndex] // moves.at(-1)
      this.executeMove(rank, suit, move)
    }
    return moves
  }

  serialize () {
    const minify = ({ rank, suit, isFlipped }) => ({ rank, suit, isFlipped })
    return {
      tableau: this.tableau.map(column => column.map(minify)),
      deck: this.deck.map(minify),
      foundation: Object.fromEntries(
        Object.entries(this.foundation).map(([suit, pile]) => (
          [suit, pile.map(minify)]
        ))
      )
    }
  }

  deserialize (state) {
    const cardify = ({ rank, suit, isFlipped }) => {
      const card = new Card(rank, suit)
      card.isFlipped = isFlipped
      return card
    }
    this.tableau = state.tableau.map(column => column.map(cardify))
    this.deck = state.deck.map(cardify)
    this.foundation = Object.fromEntries(
      Object.entries(state.foundation).map(([suit, pile]) => (
        [suit, pile.map(cardify)]
      ))
    )
  }

  /* returns a 0-1 value based on how close to solved the tableau is */
  getProgress (state = this) {
    let progress = 21
    for (const column of state.tableau) {
      for (const card of column) {
        progress -= Number(card.isFlipped)
      }
    }
    return progress / 21
  }

  /* returns a list with references to all card objects in the game */
  getAllCards () {
    const cards = []
    for (const column of this.tableau) {
      for (const card of column) {
        cards.push(card)
      }
    }
    for (const card of this.deck) {
      cards.push(card)
    }
    for (const suit in this.foundation) {
      for (const card of this.foundation[suit]) {
        cards.push(card)
      }
    }
    return cards
  }

  /* solved is if the game can be finished, but not necessarily
     finished: all the cards are face up in tableau, foundation does
     not need to be complete */
  checkIsSolved () {
    for (const column of this.tableau) {
      for (const card of column) {
        if (card.isFlipped) {
          return false
        }
      }
    }
    return true
  }

  /* check if foundation is complete, does not matter if tableau is
     fully face up */
  checkIsFinished () {
    for (const pile of this.foundation) {
      if (pile.length !== 13) {
        return false
      }
    }
    return true
  }

  getChildrenOfCard (rank, suit) {
    let children = []
    this.tableau.forEach(column => (
      column.forEach((card, i) => {
        if (card.rank === rank && card.suit === suit && i < column.length - 1) {
          children = column.slice(i + 1)
        }
      })
    ))
    return children
  }

  getParentOfCard (rank, suit) {
    let parent
    this.tableau.forEach(column => (
      column.forEach((card, i) => {
        if (card.rank === rank && card.suit === suit) {
          parent = column[i - 1]
        }
      })
    ))
    return parent
  }

  /* get a list of the possible moves a card with a give rank and suit
     can make. a number represents a move to the end of the tableau
     column of the given index, while a string represents a move to
     the top of the foundation pile with that given suit. */
  getPossibleMoves (rank, suit) {
    if (!suit) debugger
    const possibilities = []
    const getColor = (suit) => (
      suit === 'spade' || suit === 'club' ? 'black' : 'red'
    )

    if (this.getCardReference(rank, suit).isFlipped) {
      return possibilities
    }

    this.tableau.forEach((column, i) => {
      // column ends with opposite color suit and is one bigger than current rank
      if (column.length > 0 &&
          getColor(column.at(-1).suit) !== getColor(suit) &&
          column.at(-1).rank === rank + 1) {
        possibilities.push(i)
      }

      // kings can start columns
      if (column.length === 0 && rank === 12) {
        // make sure this king isn't already starting a column
        let canMove = true
        for (const column of this.tableau) {
          if (column[0] && column[0].rank === rank && column[0].suit === suit) {
            canMove = false
          }
        }
        if (canMove) {
          possibilities.push(i)
        }
      }
    })

    /* can't move a card into foundation if it's not at the end of a
       column so we need to make sure it has no children */
    if (this.getChildrenOfCard(rank, suit).length === 0) {
      // aces can start foundation piles
      if (this.foundation[suit].length === 0 && rank === 0) {
        possibilities.splice(0, 0, suit)
      }

      if (this.foundation[suit].length > 0 && this.foundation[suit].at(-1).rank === rank - 1) {
        possibilities.splice(0, 0, suit)
      }
    }

    return possibilities
  }

  getAllPossibleMoves () {
    const moves = []
    for (const suit of ['spade', 'club', 'diamond', 'heart']) {
      for (const rank of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        moves.push(...this.getPossibleMoves(rank, suit).map(move => ({ rank, suit, move })))
      }
    }
    return moves
  }

  removeCardFromBoard (rank, suit) {
    const check = (item) => !(item.rank === rank && item.suit === suit)
    this.deck = this.deck.filter(check)
    this.tableau = this.tableau.map(column => column.filter(check))
    for (const suit in this.foundation) {
      this.foundation[suit] = this.foundation[suit].filter(check)
    }
  }

  getCardReference (rank, suit) {
    let result
    const check = (item) => {
      if (item.rank === rank && item.suit === suit) {
        result = item
      }
    }
    this.deck.forEach(check)
    this.tableau.map(column => column.forEach(check))
    for (const suit in this.foundation) {
      this.foundation[suit].forEach(check)
    }
    return result
  }

  // given a card thing and a move from getPossibleMoves(), execute it
  executeMove (rank, suit, move) {
    if (move === undefined) { return }

    const card = this.getCardReference(rank, suit)
    const children = this.getChildrenOfCard(rank, suit)
    this.removeCardFromBoard(rank, suit)
    for (const child of children) {
      this.removeCardFromBoard(child.rank, child.suit)
    }

    // put it in its new location
    if (typeof move === 'number') {
      this.tableau[move].push(card)
      this.tableau[move].push(...children)
      this.foundationCombo = 0
    } else {
      this.foundation[move].push(card)
      const position = [...foundationPositions[move]]
      position[1] += 30

      if (!card.executedMoves.includes(move)) {
        this.addScore(
          1000 + 200 * this.foundationCombo,
          position,
          this.foundationCombo && ('COMBO x' + (this.foundationCombo + 1))
        )
        this.foundationCombo += 1
        this.foundationCombo = Math.min(this.foundationCombo, 10)
      }
    }

    /* remember this move on this card, so that if it happens again,
       it doesn't get scored */
    card.executedMoves.push(move)

    this.updateTableauCardTargets()
    this.updateFoundationCardTargets()
    this.getAllCards().forEach(card => card.recalculate())
  }

  addScore (delta, position, comboAlert) {
    if (!this.checkShouldDoScoring()) return
    this.score += delta
    game.addThing(new Popup(position, '+' + delta))
    if (comboAlert) {
      const comboPosition = [...position]
      // comboPosition[0] += 40
      comboPosition[1] += 40
      game.addThing(new Popup(comboPosition, comboAlert))
    }
  }

  getTableauPosition (x, y = this.tableau[x].length, yMax = this.tableau[x].length) {
    const position = [
      u.map(x, 0, 6, 210, 800 - 60, true),
      200 + 32 * y
    ]
    if (yMax >= 12) {
      position[1] = u.map(y, 0, yMax - 1, 200, 540)
    }
    return position
  }

  getFoundationPosition (suit) {
    return [...foundationPositions[suit]]
  }

  /* set the targets of all the cards in the tableau to where they
     should be */
  updateTableauCardTargets () {
    let didReveal = false
    this.tableau.forEach((column, i) => (
      column.forEach((card, j) => {
        card.target = this.getTableauPosition(i, j)
        card.targetDepth = j
        card.mode = 'tableau'

        // reveal front card of column
        if (j === column.length - 1 && card.isFlipped) {
          didReveal = true
          const canAddScore = card.flip()
          if (canAddScore) {
            this.addScore(
              250 * (this.revealCombo + 1),
              card.target,
              this.revealCombo && ('REVEAL x' + (this.revealCombo + 1))
            )
          }
          this.revealCombo += 1
        }
      })
    ))

    if (!didReveal) {
      this.revealCombo = 0
    }
  }

  updateFoundationCardTargets () {
    for (const suit in this.foundation) {
      this.foundation[suit].forEach((card, i) => {
        card.mode = 'foundation'
        card.target = this.getFoundationPosition(suit)
        card.targetDepth = i
      })
    }
  }

  updateDeckCardTargets () {
    this.deck.forEach((card, i) => {
      card.mode = 'deck'
      card.target = [
        60 + 35 * (i % 2),
        75 + this.deckScroll + i * 65
      ]
    })
  }

  winAnimation () {
    if (this.hasWon) return
    this.hasWon = true
    this.score += 10000
    game.addThing(new WinAnimation())
  }

  checkShouldDoScoring () {
    return !this.isSimulation && !game.getThing('winanimation')
  }
}

// handles figuring out which card the user is hovering over
class MouseCursor extends Thing {
  aabb = [-1, -1, 1, 1]
  hovering = null

  constructor () {
    super()
    game.setThingName(this, 'mousecursor')
    //game.nameThing(this, 'mousecursor')
  }

  update () {
    this.position = [...game.mouse.position]

    /* determines which card i'm hovering over by going thru all my
       current colliders and picking the one with the highest depth */
    const lastHovering = this.hovering
    this.hovering = null
    const collisions = this.getAllThingCollisions()
    if (collisions.length > 0) {
      const hovering = (
        collisions.reduce((best, now) => (
          now.depth >= best.depth && now instanceof Card ? now : best
        ))
      )

      if (hovering &&
          hovering.possibilities?.length > 0 &&
          !hovering.isFlipped) {
        this.hovering = hovering
      }

      if (this.hovering !== lastHovering && this.hovering) {
        soundmanager.playSound(['cardHover', 'cardHover1'], 0.075, [0.5, 1.5])
      }
    }
  }
}

class WinAnimation extends Thing {
  started = false
  done = false

  constructor () {
    super()
    game.setThingName(this, 'winanimation')
    //game.nameThing(this, 'winanimation')
  }

  update () {
    super.update()
    const board = game.getThing('board')

    // wait until all cards are done moving before starting animation
    if (!this.started &&
        !board.getAllCards().some(card => u.distance(card.position, card.target) > 1)) {
      this.started = true
      this.after(30, () => this.arrangeCards(), 'shine')
    }
  }

  arrangeCards () {
    let i = 0
    const board = game.getThing('board')
    while (board.tableau.some(column => column.length > 0)) {
      for (const rank of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        for (const suit of ['spade', 'club', 'diamond', 'heart']) {
          const card = board.getCardReference(rank, suit)
          if (card.mode === 'tableau' && board.getChildrenOfCard(rank, suit).length === 0) {
            i += 1
            board.executeMove(rank, suit, suit)
            card.movementDelay = i * 5
          }
        }
      }
    }

    this.after(i * 5 + 15, () => { this.done = true })
  }

  postDraw () {
    const { ctx } = game
    if (this.timer('shine')) {
      ctx.save()
      ctx.fillStyle = 'green'
      ctx.globalAlpha = 0.4
      ctx.fillRect(0, 0, 800, 600)
      ctx.restore()
    }

    if (this.done) {
      const drawLetter = (string, index, x = 0, y = 0) => {
        ctx.save()
        const fullWidth = ctx.measureText(string).width
        const xOffset = ctx.measureText(string.slice(0, index)).width
        ctx.translate(xOffset + x - fullWidth / 2, y)
        for (let i = 0; i < Math.PI * 2; i += Math.PI * 2 / 16) {
          ctx.save()
          ctx.fillStyle = 'white'
          ctx.fillText(string[index], Math.cos(i) * 4, Math.sin(i) * 4)
          ctx.restore()
        }
        const h = game.getTime() / 10 + index * 0.05
        ctx.fillStyle = u.colorToString(u.hsvToRgb(h, 1, 1))
        ctx.fillText(string[index], 0, 0)
        ctx.restore()
      }
      ctx.save()
      ctx.translate(400, 330)
      ctx.font = 'italic bold 80px Arial'
      const string = 'You Win!'
      for (let i = 0; i < string.length; i += 1) {
        const bounce = Math.min(Math.sin(i * 0.2 + game.getTime() * 4) * 16, 0)
        drawLetter(string, i, 0, bounce)
      }
      ctx.restore()
    }
  }
}

function createDeck () {
  const deck = []
  for (const suit of ['spade', 'club', 'diamond', 'heart']) {
    for (const rank of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      deck.push([rank, suit])
    }
  }
  return u.shuffle(deck, Math.random)
}

function drawCardOutline () {
  const { ctx } = game
  const w = 80
  const h = 108
  const r = 7
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
  ctx.stroke()
}
