import { View, Text, StyleSheet } from 'react-native'

export default function UnsupportedBrowserScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Browser Not Supported</Text>
        <Text style={styles.body}>
          This app requires a modern browser with Origin Private File System support.
        </Text>
        <Text style={styles.subtitle}>Compatible Browsers</Text>
        <Text style={styles.item}>• Chrome 86+</Text>
        <Text style={styles.item}>• Edge 86+</Text>
        <Text style={styles.item}>• Firefox 111+</Text>
        <Text style={styles.item}>• Safari 15.2+</Text>
        <Text style={styles.note}>
          Firefox private browsing mode is not supported.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 32,
    maxWidth: 420,
    width: '100%',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    color: '#e0e0e0',
    fontSize: 15,
    marginBottom: 4,
    paddingLeft: 8,
  },
  note: {
    color: '#ffa500',
    fontSize: 14,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
})
