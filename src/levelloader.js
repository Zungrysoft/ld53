import * as level1 from './levels/test1.js'
import * as fanIntro from './levels/fanIntro.js'
import * as fanPushesFan from './levels/fanPushesFan.js'
import * as stacking from './levels/stacking.js'

export function getLevel(lvl) {
  // Retrieve level data
  const levelList = [
    stacking,
    fanPushesFan,
    fanIntro,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
  ]
  const ret = JSON.parse(JSON.stringify(levelList[lvl-1].data))
  return ret
}

