import * as game from './core/game.js'
import * as gfx from './core/webgl.js'
import Board from './board.js'

game.config.width = 800
game.config.height = 600
//game.config.isWebglEnabled = false
document.title = 'Super Solitaire'

await game.loadAssets({
  images: {
    spadeSuit: 'images/spadesuit.png',
    diamondSuit: 'images/diamondsuit.png',
    heartSuit: 'images/heartsuit.png',
    clubSuit: 'images/clubsuit.png',
    background: 'images/bg1.png',
    explosion: 'images/explosion.png'
  },

  sounds: {
    music: 'sounds/JDSherbert - Minigame Music Pack - Digital Waves.mp3',
    cardHover: 'sounds/cardhover1.wav',
    cardHover1: 'sounds/cardhover1.wav',
    cardMove: 'sounds/Spear throw 3.wav',
    cardMove1: 'sounds/Spear throw 4.wav',
    cardRotate: 'sounds/Switch sounds 4.wav',
    cardReveal: 'sounds/Buff 18.wav',
    cardFoundation1: 'sounds/foundation1.wav',
    cardFoundation2: 'sounds/foundation2.wav',
    cardFoundation3: 'sounds/foundation3.wav',
    cardFoundation4: 'sounds/foundation4.wav'
  },

  /*
  shaderSources: {
    defaultFrag: 'shaders/default.frag',
    defaultVert: 'shaders/default.vert'
  },

  models: {
    cube: 'models/cube.obj',
    cylinder: 'models/cylinder.obj',
  }
  */
})

/*
const { assets } = game
assets.shaders = {
  default: gfx.createShader(
    assets.shaderSources.defaultVert,
    assets.shaderSources.defaultFrag
  )
}

assets.textures = {
  background: gfx.createTexture(assets.images.background)
}

assets.meshes = Object.fromEntries(
  Object.entries(assets.models).map(([name, model]) => [
    name, gfx.createMesh(model)
  ])
)

console.log(assets)
*/

game.setScene(() => {
  game.addThing(new Board())
})
