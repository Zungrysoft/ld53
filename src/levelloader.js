import * as level1 from './levels/test1.js'

export function getLevel(lvl) {
  // Retrieve level data
  const levelList = [level1]
  const ret = levelList[lvl].data
  return ret
}

