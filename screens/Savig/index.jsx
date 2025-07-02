import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Saving() {
  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>PDF 파일로 생성</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>DOC 파일로 생성</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.exitButton}>
        <Text style={styles.exitButtonText}>종료</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  buttonGroup: {
    marginTop: 100,
    alignItems: 'center',
    gap: 30,
  },
  saveButton: {
    backgroundColor: BLUE,
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: RED,
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    marginBottom: 40,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
