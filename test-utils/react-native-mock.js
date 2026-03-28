'use strict'

const StyleSheet = {
  flatten: function (style) {
    if (Array.isArray(style)) return Object.assign.apply(Object, [{}].concat(style))
    return style != null ? style : {}
  },
  create: function (styles) {
    return styles
  },
  hairlineWidth: 1,
}

const Modal = 'Modal'

const Platform = {
  OS: 'ios',
  select: function (obj) {
    return obj.ios !== undefined ? obj.ios : obj.default
  },
}

module.exports = {
  StyleSheet: StyleSheet,
  Modal: Modal,
  Platform: Platform,
}
