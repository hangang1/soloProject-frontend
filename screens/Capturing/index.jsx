import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Toast from 'react-native-root-toast';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import GuideOverlay from './GuidedOverlay';

export default function Capturing() {
  const route = useRoute();
  const navigation = useNavigation();
  const { localUri, photoCells = [] } = route.params || {};
  const [currentIdx, setCurrentIdx] = useState(0);
  const [photos, setPhotos] = useState([]);
  const devices = useCameraDevices();
  const device = devices?.find(d => d.position === 'back');
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  console.log('devices:', JSON.stringify(devices, null, 2));

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized' || status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (localUri) {
      Toast.show(
        '파일이 저장소에 저장되었습니다!',
        {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        }
      );
    }
  }, [localUri]);

  const currentCell = photoCells[currentIdx];
  let aspectRatio = 1.0;
  let frameWidth = 100;
  let frameHeight = 100;

  if (currentCell) {
    const w = Number(currentCell.cellWidthMm);
    const h = Number(currentCell.rowHeightMm);
    aspectRatio = w / h;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    if (aspectRatio >= 1) {
      frameWidth = screenWidth * 0.9;
      frameHeight = frameWidth / aspectRatio;
      if (frameHeight > screenHeight * 0.7) {
        frameHeight = screenHeight * 0.7;
        frameWidth = frameHeight * aspectRatio;
      }
    } else {
      frameHeight = screenHeight * 0.7;
      frameWidth = frameHeight * aspectRatio;
      if (frameWidth > screenWidth * 0.9) {
        frameWidth = screenWidth * 0.9;
        frameHeight = frameWidth / aspectRatio;
      }
    }
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsSaving(true);
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      setPhotos([...photos, photo.path]);
      if (currentIdx < photoCells.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        Toast.show('모든 사진 촬영 완료!', { duration: Toast.durations.SHORT, position: Toast.positions.BOTTOM });
      }
    } catch (err) {
      Toast.show('사진 촬영 실패: ' + err.message, { duration: Toast.durations.SHORT, position: Toast.positions.BOTTOM });
    } finally {
      setIsSaving(false);
    }
  };

  if (!device || !hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>카메라 준비 중...</Text>
      </View>
    );
  }


  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const frameStyle = currentCell ? {
    position: 'absolute',
    left: (screenWidth - frameWidth) / 2,
    top: (screenHeight - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
    ...styles.guideFrame,
  } : {};

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />
      <GuideOverlay frameStyle={frameStyle} />

      <Text style={styles.guideText} pointerEvents="none">
        {currentCell ? `${currentCell.match} (${currentIdx + 1}/${photoCells.length})` : '사진 셀 정보 없음'}
      </Text>

      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          onPress={handleTakePhoto}
          style={[styles.captureButton, isSaving && styles.captureButtonDisabled]}
          disabled={isSaving}
        >
          <Text style={styles.captureButtonText}>촬영</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <View style={styles.thumbnailContainer} pointerEvents="none">
          {photos.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.thumbnail} />
          ))}
        </View>
      )}
    </View>
  );
}

const BLUE = '#2D71BE';
const YELLOW = '#FFD600';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  guideText: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    zIndex: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 10,
  },
  captureButton: {
    backgroundColor: BLUE,
    padding: 25,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  thumbnailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  thumbnail: {
    width: 48,
    height: 48,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
  },
  guideFrame: {
    borderWidth: 3,
    borderColor: YELLOW,
    borderRadius: 8,
    zIndex: 10,
  },
});
