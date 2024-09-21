const fs = require('fs')
const path = require('path')

const createInitialSceneGraphNodes = config => {
  let mapList = JSON.parse(
    fs.readFileSync(
      path.join(
        config.kujataDataDirectory,
        'data',
        'field',
        'flevel.lgp',
        'maplist.json'
      )
    )
  )
  const sceneGraph = {
    nodes: mapList.map((name, i) => {
      return {
        id: i,
        fieldName: name,
        mapName: '',
        type: name.startsWith('wm') ? 'wm' : 'error' // error is updated in processGatewaysForSceneGraph
      }
    }),
    links: []
  }
  return sceneGraph
}
const processOpForSceneGraph = (sceneGraph, fieldName, op, dialogStrings) => {
  const node = sceneGraph.nodes.find(n => n.fieldName === fieldName)
  if (op.op == 'MPNAM') {
    let mapName = dialogStrings[op.dialogId]
    if (mapName) {
      node.mapName = mapName
    }
  }
  if (op.op == 'MAPJUMP') {
    let link = {
      source: node.id,
      target: op.f,
      type: op.op
    }
    sceneGraph.links.push(link)
  }
  if (op.op == 'PMJMP') {
    let link = {
      source: node.id,
      target: op.i,
      type: op.op
    }
    sceneGraph.links.push(link)
  }
}
const processGatewaysForSceneGraph = (sceneGraph, fieldName, gateways) => {
  const node = sceneGraph.nodes.find(n => n.fieldName === fieldName)
  node.type = 'field'
  for (let gateway of gateways) {
    let link = {
      source: node.id,
      target: gateway.fieldId,
      type: 'gateway'
    }
    sceneGraph.links.push(link)
  }
}
const writeSceneGraph = (config, sceneGraph) => {
  //   console.log('sceneGraph', sceneGraph)
  fs.writeFileSync(
    path.join(config.kujataDataDirectory, 'metadata', 'scene-graph.json'),
    JSON.stringify(sceneGraph, null, 2)
  )
}
module.exports = {
  createInitialSceneGraphNodes,
  processOpForSceneGraph,
  processGatewaysForSceneGraph,
  writeSceneGraph
}
