import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MainPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>자동 보고문서 생성 카메라</Text>

      <View style={styles.logoContainer}>
        <View style={styles.logoRow}>
          <Text style={styles.logoLetter}>A</Text>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoText}>uto</Text>
          </View>
        </View>
        <View style={styles.logoRow}>
          <Text style={styles.logoLetter}>R</Text>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoText}>eport</Text>
          </View>
        </View>
        <View style={styles.logoRow}>
          <Text style={styles.logoLetter}>C</Text>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoText}>am</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>보고서{"\n"}UPLOAD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitButton}>
          <Text style={styles.exitButtonText}>종료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BLUE = '#2D71BE';
const RED = '#BE2D3A';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 15,
    color: '#111',
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 24,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoLetter: {
    fontSize: 70,
    fontWeight: '900',
    color: BLUE,
    width: 60,
    textAlign: 'center',
  },
  logoTextContainer: {
    justifyContent: 'center',
    height: 54,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#222',
    marginLeft: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    gap: 18,
  },
  uploadButton: {
    backgroundColor: BLUE,
    width: '80%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  exitButton: {
    backgroundColor: RED,
    width: '80%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
});
