'use strict'

import {html, find} from 'property-information'
import h from 'snabbdom/h'

const own = Object.prototype.hasOwnProperty

const divWrapper = children => {
  return {type: 'element', tagName: 'div', properties: {}, children}
}

export default function toSnabbdom(uTree) {
  if (typeof uTree !== 'object' || Array.isArray(uTree)) {
    throw new TypeError('uTree must be an object')
  }

  if (uTree.type === 'root') {
    const c = uTree.children
    if (!Array.isArray(c) || c.length === 0) {
      return null
    }

    uTree = c.length === 1 ? c[0] : divWrapper(c)
  } else if (uTree.type === 'comment') {
    return null
  }

  return convert(uTree)
}

const convert = node => {
  if (node.type === 'text') {
    return node.value
  }

  // Ignoring `comment` and `doctype` nodes
  if (node.type !== 'element') {
    return null
  }

  const data = {}
  const attrs = {}

  const props = node.properties || {}
  if (typeof props.style === 'string' && props.style) {
    attrs.style = props.style
  } else if (typeof props.style === 'object' && !Array.isArray(props.style)) {
    data.style = props.style
  }

  for (const prop in props) {
    /* istanbul ignore else - Doesn’t matter */
    if (own.call(props, prop)) {
      let val = props[prop]
      const info = find(html, prop)

      // ignore nully, `false`, `NaN` and falsey known booleans
      if (
        val === null ||
        val === undefined ||
        val === false ||
        Number.isNaN(val) ||
        (info.boolean && !val)
      ) {
        continue
      }

      if (Array.isArray(val)) {
        val = info.commaSeparated ? val.join(', ') : val.join(' ')
      }

      attrs[info.attribute] = val
    }
  }

  const children = []

  for (const child of node.children) {
    const res = convert(child)
    if (res !== null && res !== undefined) {
      children.push(res)
    }
  }

  if (Object.keys(attrs).length > 0) {
    data.attrs = attrs
  }

  return h(node.tagName, data, children)
}
