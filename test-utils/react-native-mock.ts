// Minimal React Native mock for Vitest — avoids Flow-typed react-native index.js
const StyleSheet = {
  flatten: (style: unknown) => (Array.isArray(style) ? Object.assign({}, ...style) : style ?? {}),
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  hairlineWidth: 1,
}

const Modal = 'Modal'
const Platform = { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default }

module.exports = {
  StyleSheet,
  Modal,
  Platform,
}
