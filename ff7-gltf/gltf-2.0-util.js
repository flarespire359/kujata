// glTF 2.0 utilities

// usage: require('gltf-2.0-util.js')();

// glTF 2.0 spec: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0

// glTF 2.0 element types
const NUM_COMPONENTS_FOR_ELEMENT_TYPE = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16
}

// glTF 2.0 component types
const COMPONENT_TYPE = {
  'BYTE': 5120,
  'UNSIGNED_BYTE': 5121,
  'SHORT': 5122,
  'UNSIGNED_SHORT': 5123,
  'UNSIGNED_INT': 5125,
  'FLOAT': 5126
}

const COMPONENT_TYPES = [
  { 'id': 5120, 'name': 'BYTE', bytes: 1 },
  { 'id': 5121, 'name': 'UNSIGNED_BYTE', bytes: 1 },
  { 'id': 5122, 'name': 'SHORT', bytes: 2 },
  { 'id': 5123, 'name': 'UNSIGNED_SHORT', bytes: 2 },
  { 'id': 5125, 'name': 'UNSIGNED_INT', bytes: 4 },
  { 'id': 5126, 'name': 'FLOAT', bytes: 4 }
]

const componentTypeSize = function (componentTypeId) {
  // TODO: make this more efficient by building lookup map instead
  for (let cType of this.COMPONENT_TYPES) {
    if (cType.id == componentTypeId) {
      return cType.bytes
    }
  }
  throw new Error('Invalid componentTypeId:', componentTypeId)
}

const POINTS_PER_VERTEX = 3

const FLOAT_SIZE = 4

// glTF primitive.mode values
const PRIMITIVE_MODE = {
  'POINTS': 0,
  'LINES': 1,
  'LINE_LOOP': 2,
  'LINE_STRIP': 3,
  'TRIANGLES': 4,
  'TRIANGLE_STRIP': 5,
  'TRIANGLE_FAN': 6
}

// glTF bufferView.target values
const ARRAY_BUFFER = 34962
const ELEMENT_ARRAY_BUFFER = 34963

// glTF sampler.magFilter and sampler.minFilter values
const FILTER = {
  'NEAREST': 9728,
  'LINEAR': 9729,
  'NEAREST_MIPMAP_NEAREST': 9984,
  'LINEAR_MIPMAP_NEAREST': 9985,
  'NEAREST_MIPMAP_LINEAR': 9986,
  'LINEAR_MIPMAP_LINEAR': 9987
}

// glTF sampler.wrapS and sampler.wrapT values
const WRAPPING_MODE = {
  'CLAMP_TO_EDGE': 33071,
  'MIRRORED_REPEAT': 33648,
  'REPEAT': 10497
}

module.exports = {
  NUM_COMPONENTS_FOR_ELEMENT_TYPE,
  COMPONENT_TYPE,
  COMPONENT_TYPES,
  componentTypeSize,
  POINTS_PER_VERTEX,
  FLOAT_SIZE,
  PRIMITIVE_MODE,
  ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER,
  FILTER,
  WRAPPING_MODE
}
