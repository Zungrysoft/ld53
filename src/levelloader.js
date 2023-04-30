import * as level1 from './levels/test1.js'
import * as fanIntro from './levels/fanIntro.js'
import * as fanPushesFan from './levels/fanPushesFan.js'
import * as stacking from './levels/stacking.js'
import * as intro from './levels/intro.js'
import * as shuffle from './levels/shuffle.js'
import * as sorting from './levels/sorting.js'
import * as limitedResources from './levels/limitedResources.js'
import * as plinko from './levels/plinko.js'
import * as zapYourProblems from './levels/zapYourProblems.js'

export function getLevel(lvl) {
  // Retrieve level data
  const levelList = [
    intro,
    fanIntro,
    stacking,
    fanPushesFan,
    sorting,
    shuffle,
    plinko,
    zapYourProblems,
    limitedResources,
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

