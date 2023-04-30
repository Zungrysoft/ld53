import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as soundmanager from './core/soundmanager.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec2 from './core/vector2.js'
import * as vec3 from './core/vector3.js'
import Thing from './core/thing.js'
import Card from './card.js'
import Popup from './popup.js'
import { assets } from './core/game.js'
import { getLevel } from './levelloader.js'

export default class Board extends Thing {
  state = {}
  anim = []
  stateStack = []
  backgroundScroll = [0, 0]
  backgroundPattern = game.ctx.createPattern(game.assets.images.background, 'repeat')
  viewAngle = [Math.PI/2, Math.PI*(1/4)]
  viewAngleTarget = this.viewAngle
  viewDistance = 4
  viewPosition = [0, 0, 0]
  time = 0
  colorMap = {
    'red': [0.3, 0.0, 0.0, 1],
    'green': [0.0, 0.6, 0.0, 1],
    'blue': [0.0, 0.0, 0.4, 1],
    'cyan': [0.0, 0.8, 0.8, 1],
    'yellow': [0.9, 0.9, 0.0, 1],
    'black': [0.0, 0.0, 0.0, 1],
    'pink': [1.0, 0.8, 0.8, 1],
  }
  controlMap = {}

  constructor () {
    super()
    game.setThingName(this, 'board')
    this.state = getLevel(0)

    // Set up camera based on level params
    this.setupCamera(this.state)

    this.setupControls()
  }

  setupCamera(state) {
    this.viewDistance = state.cameraDistance
    this.viewPosition = state.cameraPosition
    this.viewAngle = state.cameraStartAngle
    this.viewAngleTarget = state.cameraStartAngle
  }

  setupControls() {
    let controlOrder = [
      {keyCode: "KeyZ", name: "Z"},
      {keyCode: "KeyX", name: "X"},
      {keyCode: "KeyC", name: "C"},
      {keyCode: "KeyV", name: "V"},
      {keyCode: "KeyT", name: "B"},
      {keyCode: "KeyN", name: "N"},
      {keyCode: "KeyM", name: "M"},
    ]
    for (const element of this.state.elements) {
      const c = element.color
      if (c && !(c in this.controlMap)) {
        this.controlMap[c] = controlOrder.shift()
      }
    }
  }

  update () {
    super.update()

    this.time ++

    // Camera controls
    if (game.keysPressed.ArrowRight) {
      this.viewAngleTarget[0] -= Math.PI/4
    }
    if (game.keysPressed.ArrowLeft) {
      this.viewAngleTarget[0] += Math.PI/4
    }
    if (game.keysPressed.ArrowUp) {
      this.viewAngleTarget[1] += Math.PI/8
    }
    if (game.keysPressed.ArrowDown) {
      this.viewAngleTarget[1] -= Math.PI/8
    }
    this.viewAngleTarget[1] = u.clamp(this.viewAngleTarget[1], 0, Math.PI/2)
    this.viewAngle = vec2.lerp(this.viewAngle, this.viewAngleTarget, 0.2)
    this.updateCamera()

    // Game controls
    for (const control in this.controlMap) {
      if (game.keysPressed[this.controlMap[control].keyCode]) {
        // Conveyor
        this.advanceConveyor(control)
        this.advanceFall()

        // Fan
        this.advanceFan(control, 0)
        this.advanceFall()
        this.advanceFan(control, 1)
        this.advanceFall()
        this.advanceFan(control, 2)
        this.advanceFall()
        this.advanceFan(control, 3)
        this.advanceFall()
      }
    }
  }

  updateCamera() {
    // Set up 3D camera
    const cam = game.getCamera3D()
    cam.position[0] = Math.cos(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[1] = Math.sin(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[2] = Math.sin(this.viewAngle[1]) * this.viewDistance + 1
    cam.position = vec3.add(cam.position, this.viewPosition)
    cam.lookVector = vec3.anglesToVector(this.viewAngle[0], this.viewAngle[1])
  }

  moveable(type) {
    return type === 'crate' || type === 'fan'
  }

  pushable(type) {
    return type === 'crate' || type === 'fan'
  }

  getElementAt(pos) {
    for (let i = 0; i < this.state.elements.length; i ++) {
      if (vec3.equals(this.state.elements[i].position, pos)) {
        return i
      }
    }
    return -1
  }

  getElementDownward(position) {
    // Loop over positions below crate
    let pos = [...position]
    while (pos[2] > this.state.floorHeight) {
      pos[2] --

      // Loop over elements that could be there
      const index = this.getElementAt(pos)
      if (index >= 0) {
        const elem = this.state.elements[index]
        if (vec3.equals(elem.position, pos)) {
          return index
        }
      }
    }

    // Didn't find anything, return -1 for falling into the void
    return -1
  }

  // Return the new state of the element
  tryToMoveInto(pos, moveDir, eState, dState) {
    // Loop over elements
    for (let i = 0; i < eState.length; i ++) {
      const es = eState[i]
      const ds = dState[i]

      // Check if that element is in that space
      if (vec3.equals(pos, es.position)) {
        // If the element in that space is blocked, this element is blocked too
        if (ds.decision === 'blocked') {
          // console.log("Blocked by blocked element " + es.letter)
          return 'blocked'
        }

        // If the element in that space is undecided, this element is undecided too
        if (ds.decision === 'undecided') {
          return 'undecided'
        }

        // If the element in that space is moving out of this space, this element is moving if it's in the same direction
        // If it's moving in a different direction, it is blocked since it would hit the corner
        if (ds.decision === 'moving') {
          if (moveDir === ds.moveDirection) {
            return 'moving'
          }
          else {
            // console.log("Blocked by element " + es.letter + " moving out of space in wrong direction")
            return 'blocked'
          }
        }
      }

      // Check if that element is moving into this space
      if (ds.decision === 'moving') {
        if (vec3.equals(pos, ds.movePosition)) {
          // console.log(es.letter + " was blocked by element moving into space")
          return 'blocked'
        }
      }
    }
    return 'moving'
  }

  advanceConveyor(color) {
    // Track which elements are blocked and which ones have moved
    const states = this.state.elements.map((e) => {return{
      decision: 'blocked',
      moveDirection: -1,
      movePosition: e.position
    }})

    // Mark moveable elements as undecided
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      if (this.moveable(element.type)) {
        states[i].decision = 'undecided'
      }
    }

    // Direction to move vector
    const dirs = [[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]

    // Iterate until all elements have decided how to move
    while (states.filter(e => e.decision === 'undecided').length > 0) {
      // Loop over undecided elements
      for (const i in this.state.elements) {
        const element = this.state.elements[i]
        if (states[i].decision === 'undecided') {
          // Check what this element is sitting on top of
          const below = this.getElementAt(vec3.add(element.position, [0, 0, -1]))
          if (below !== -1) {
            // If on top of an active conveyor
            if (this.state.elements[below].type === 'conveyor' && this.state.elements[below].color === color) {
              // Set move direction
              const moveDir = this.state.elements[below].angle || 0
              states[i].moveDirection = moveDir

              // Get position it wants to move into
              const moveSpace = vec3.add(element.position, dirs[moveDir])
              states[i].movePosition = moveSpace
              // console.log(element.letter + " is moving into " + moveSpace)

              // Check if the space to move into is (or has been claimed as) occupied
              states[i].decision = this.tryToMoveInto(moveSpace, moveDir, this.state.elements, states)
            }

            // If on top of a moving element
            else if (states[below].decision === 'moving') {
              // Set move direction
              const moveDir = states[below].moveDirection || 0
              states[i].moveDirection = moveDir

              // Get position it wants to move into
              const moveSpace = vec3.add(element.position, dirs[moveDir])
              states[i].movePosition = moveSpace

              // Check if the space to move into is (or has been claimed as) occupied
              states[i].decision = this.tryToMoveInto(moveSpace, moveDir, this.state.elements, states)
            }

            // If on top of blocked element, set it as blocked
            else if (states[below].decision === 'blocked') {
              // console.log(element.letter + " was blocked by sitting on top of non-moving element")
              states[i].decision = 'blocked'
              continue
            }

            // If on top of undecided element, wait for that element to decide
            else if (states[below].decision === 'undecided') {
              continue
            }
          }
          else {
            // Sitting on air. Don't move it until the fall step
            // console.log(this.state.elements[i].letter + " was blocked by sitting on top of air")
            states[i].decision = 'blocked'
            continue
          }
        }
      }
    }

    // Advance state based on decisions
    for (let i = 0; i < this.state.elements.length; i ++) {
      if (states[i].decision === 'moving') {
        this.state.elements[i].position = states[i].movePosition
      }
    }
  }

  fanPushElement(position, direction) {
    const index = this.getElementAt(position)

    // Base case: this is air
    if (index === -1) {
      return true
    }
    // Base case: element is not pushable
    if (!this.pushable(this.state.elements[index].type)) {
      return false
    }

    // Recursion case: Check the next element behind
    const canPush = this.fanPushElement(vec3.add(position, direction), direction)

    // If the result is that we can push this element, do it
    if (canPush) {
      this.state.elements[index].position = vec3.add(position, direction)
    }

    // Return result to previous element
    return canPush
  }

  advanceFan(color, angle) {
    // To simplify logic, we do each fan direction separately

    // Direction to move vector
    const dirs = [[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]

    // Iterate over fans...
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      // If this is a fan of the right color and angle...
      if (element.type === 'fan' && element.angle === angle && element.color === color) {
        // Find elements in this fan's line
        let pos = [...element.position]
        while (vec2.magnitude(pos) < 50) {
          pos = vec3.add(pos, dirs[angle])
          const index = this.getElementAt(pos)

          // If this is a moveable element, try to push it
          if (index !== -1) {
            this.fanPushElement(pos, dirs[angle])
            break
          }
        }
      }
    }
  }

  advanceFall() {
    // Track which elements are blocked and which ones have moved
    const states = this.state.elements.map((e) => {return{
      decision: 'blocked',
      movePosition: e.position,
      fellInChute: false,
    }})

    // Mark moveable elements as undecided
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      if (this.moveable(element.type)) {
        states[i].decision = 'undecided'
      }
    }

    // Iterate until all elements have decided how to move
    while (states.filter(e => e.decision === 'undecided').length > 0) {
      // Loop over undecided elements
      for (const i in this.state.elements) {
        const element = this.state.elements[i]
        if (states[i].decision === 'undecided') {
          // Check what this element is sitting on top of
          const below = this.getElementDownward(element.position)
          if (below !== -1) {
            // If on top of a chute, destroy self
            if (this.state.elements[below].type === 'chute') {
              states[i].decision = 'moving'
              states[i].movePosition = [...states[below].movePosition]
              states[i].fellInChute = this.state.elements[below].letter
            }

            // If on top of a decided element, move down to it
            else if (states[below].decision === 'blocked' || states[below].decision === 'moving') {
              states[i].decision = 'moving'
              states[i].movePosition = vec3.add(states[below].movePosition, [0, 0, 1])
              continue
            }

            // If on top of undecided element, wait for that element to decide
            else if (states[below].decision === 'undecided') {
              continue
            }
          }
          else {
            // Sitting on the void. Fall into it.
            // console.log(element.letter + " fell into the void")
            states[i].decision = 'moving'
            states[i].movePosition[2] = this.state.floorHeight
            continue
          }
        }
      }
    }

    // Advance state based on decisions
    for (let i = 0; i < this.state.elements.length; i ++) {
      if (states[i].decision === 'moving') {
        // If it fell in a chute, special rules apply
        if (states[i].fellInChute) {
          this.state.elements[i].destroyed = true
          this.state.elements[i].position = [0, 0, -1000]
          if (this.state.elements[i].letter === states[i].fellInChute) {
            this.state.cratesDelivered ++
          }
        }
        // Otherwise, just move it where it's headed
        else {
          this.state.elements[i].position = states[i].movePosition
        }
      }
    }
  }

  postDraw () {
    const { ctx } = game

    // Skybox
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('color', [1, 1, 1, 1])
    gfx.setTexture(assets.textures.background)
    gfx.set('modelMatrix', mat.getTransformation({
      scale: [200, 200, -100],
    }))
    gfx.drawMesh(assets.meshes.skybox)
  }

  draw () {
    const { ctx } = game
    // Draw each of the game elements
    for (const element of this.state.elements) {
      this.drawElement(element)
    }

    // Draw the control HUD
    ctx.save()
    ctx.translate(32, game.config.height)
    ctx.font = 'italic 40px Times New Roman'
    const controls = Object.keys(this.controlMap).reverse()
    for (const control of controls) {
      const keyName = this.controlMap[control].name


      ctx.translate(0, -48)

      const str = keyName + ': ' + control
      ctx.fillStyle = 'black'
      ctx.fillText(str, 0, 0)
      ctx.fillStyle = 'white'
      ctx.fillText(str, 4, -4)
    }
    ctx.restore()

    // Draw the score HUD
    ctx.save()
    ctx.translate(32, 72)
    ctx.font = 'italic 40px Times New Roman'
    const str = this.state.cratesDelivered + "/" + this.state.cratesRequired + " crates correctly sorted"
    ctx.fillStyle = 'black'
    ctx.fillText(str, 0, 0)
    ctx.fillStyle = 'white'
    ctx.fillText(str, 4, -4)
    ctx.restore()
  }

  // Draws one game element
  drawElement (elementState) {
    // Shader
    let rShader = assets.shaders.shaded

    // Color
    let rColor = this.colorMap[elementState.color]
    if (elementState.type === 'fan') {
      rColor = [0.4, 0.4, 0.4, 1]
    }

    // Texture
    let rTexture = assets.textures['uv_' + elementState.type]
    if (elementState.type === 'crate' || elementState.type === 'chute') {
      rTexture = assets.textures['uv_' + elementState.type + "_" + elementState.letter]
    }

    // Mesh
    let rMesh = assets.meshes[elementState.type]

    // Perform the draw operations
    gfx.setShader(rShader)
    game.getCamera3D().setUniforms()
    gfx.set('color', rColor || [1, 1 ,1, 1])
    gfx.set('scroll', 0)
    gfx.setTexture(rTexture || assets.textures.square)
    gfx.set('modelMatrix', mat.getTransformation({
      translation: elementState.position,
      rotation: [Math.PI/2, 0, (-elementState.angle || 0) * (Math.PI/2)],
      scale: 1.0
    }))
    gfx.drawMesh(rMesh || assets.meshes.cube)

    // If this is a fan, render the blade as well
    if (elementState.type === 'fan') {
      let offset = vec2.rotate(0, -0.1, (-elementState.angle + 2 || 0) * (Math.PI/2))
      offset.push(0.1)

      const spin = this.time / Math.PI
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', this.colorMap[elementState.color])
      gfx.set('scroll', 0)
      gfx.setTexture(rTexture || assets.textures.square)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: vec3.add(elementState.position, offset),
        rotation: [Math.PI/2, spin, (-elementState.angle + 2 || 0) * (Math.PI/2)],
        scale: 1.0
      }))
      gfx.drawMesh(assets.meshes.fanBlade)
    }

    // If this is a conveyor, render the belt as well
    if (elementState.type === 'conveyor') {
      const scroll = -1 * ((this.time / 60) % 1.0)
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', [1, 1, 1, 1])
      gfx.set('scroll', scroll)
      gfx.setTexture(assets.textures.uv_conveyorBelt)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: elementState.position,
        rotation: [Math.PI/2, 0, (-elementState.angle || 0) * (Math.PI/2)],
        scale: 1.0
      }))
      gfx.drawMesh(assets.meshes.conveyorBelt)
    }
  }
}
