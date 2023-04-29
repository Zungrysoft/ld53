import * as level1 from './levels/test1.js'

export function getLevel(lvl) {
  const levelList = [level1]
  return levelList[lvl].data
}

