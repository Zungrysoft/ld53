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

export default class Board extends Thing {
  state = {}
  anim = []
  stateStack = []
  backgroundScroll = [0, 0]
  backgroundPattern = game.ctx.createPattern(game.assets.images.background, 'repeat')
  viewAngle = [Math.PI/2, Math.PI*(1/4)]
  viewAngleTarget = this.viewAngle
  viewDistance = 4
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
    this.state = {
      cratesRequired: 3,
      cratesDelivered: 0,
      elements: [
        {
          type: 'crate',
          position: [0, 0, 0],
          letter: 'a',
          angle: 0,
        },
        {
          type: 'crate',
          position: [0, 0, 1],
          letter: 'a',
          angle: 0,
        },
        {
          type: 'block',
          position: [0, 0, -1],
        },
        {
          type: 'fan',
          position: [0, 1, 0],
          color: 'red',
          angle: 1,
        },
        {
          type: 'conveyor',
          position: [0, 1, -1],
          color: 'blue',
          angle: 1,
        },
      ],
    }

    this.setupControls()
    console.log(this.controlMap)
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
        console.log(control)
      }
    }
  }

  updateCamera() {
    // Set up 3D camera
    const cam = game.getCamera3D()
    cam.position[0] = Math.cos(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[1] = Math.sin(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[2] = Math.sin(this.viewAngle[1]) * this.viewDistance + 1
    cam.lookVector = vec3.anglesToVector(this.viewAngle[0], this.viewAngle[1])
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
      rotation: [Math.PI/2, 0, (elementState.angle || 0) * (Math.PI/2)],
      scale: 1.0
    }))
    gfx.drawMesh(rMesh || assets.meshes.cube)

    // If this is a fan, render the blade as well
    if (elementState.type === 'fan') {
      let offset = vec2.rotate(0, -0.1, (elementState.angle || 0) * (Math.PI/2))
      offset.push(0.1)

      const spin = this.time / Math.PI
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', this.colorMap[elementState.color])
      gfx.set('scroll', 0)
      gfx.setTexture(rTexture || assets.textures.square)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: vec3.add(elementState.position, offset),
        rotation: [Math.PI/2, spin, (elementState.angle || 0) * (Math.PI/2)],
        scale: 1.0
      }))
      gfx.drawMesh(assets.meshes.fanBlade)
    }

    // If this is a conveyor, render the belt as well
    if (elementState.type === 'conveyor') {
      const scroll = (this.time / 60) % 1.0
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', [1, 1, 1, 1])
      gfx.set('scroll', scroll)
      gfx.setTexture(assets.textures.uv_conveyorBelt)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: elementState.position,
        rotation: [Math.PI/2, 0, (elementState.angle || 0) * (Math.PI/2)],
        scale: 1.0
      }))
      gfx.drawMesh(assets.meshes.conveyorBelt)
    }
  }
}
