import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Capturing() {
  return (
    <View style={styles.container}>
      <Text style={styles.resultText}>보고서 분석 완료!</Text>

      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>촬영 시작</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.endButton}>
        <Text style={styles.endButtonText}>촬영 종료{"\n"}문서 생성</Text>
      </TouchableOpacity>
    </View>
  );
}

const BLUE = '#2D71BE';
const RED = '#BE2D3A';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: BLUE,
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    width: 180,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: RED,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
});
