import * as level1 from './levels/test1.js'
import * as level2 from './levels/test2.js'
import * as fanIntro from './levels/fanIntro.js'

export function getLevel(lvl) {
  // Retrieve level data
  const levelList = [
    fanIntro,
    level2,
  ]
  const ret = JSON.parse(JSON.stringify(levelList[lvl-1].data))
  return ret
}

