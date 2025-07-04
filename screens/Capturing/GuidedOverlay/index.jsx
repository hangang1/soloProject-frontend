import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BLUE = '#2D71BE';

export default function GuideOverlay({ frameStyle }) {
  if (!frameStyle.width || !frameStyle.height) return null;

  const { left, top, width, height } = frameStyle;

  return (
    <>
      <View style={[styles.overlay, styles.topOverlay, { height: top }]} />
      <View style={[styles.overlay, styles.bottomOverlay, { top: top + height }]} />
      <View style={[styles.overlay, styles.leftOverlay, { top, width: left, height }]} />
      <View style={[styles.overlay, styles.rightOverlay, { top, left: left + width, height }]} />
      <View style={[styles.frame, { left, top, width, height }]} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 5,
  },
  topOverlay: {
    left: 0,
    right: 0,
  },
  bottomOverlay: {
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftOverlay: {
    left: 0,
  },
  rightOverlay: {
    right: 0,
  },
  frame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: BLUE,
    borderRadius: 8,
    zIndex: 10,
  },
});
