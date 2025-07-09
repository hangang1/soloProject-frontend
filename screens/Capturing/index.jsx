import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Toast from 'react-native-root-toast';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import GuideOverlay from './GuidedOverlay';
import RNFS from 'react-native-fs';
import PhotoManipulator from 'react-native-photo-manipulator';
import ViewShot from 'react-native-view-shot';

export default function Capturing() {
  const route = useRoute();
  const navigation = useNavigation();
  const { localUri, photoCells = [] } = route.params || {};
  const [currentIdx, setCurrentIdx] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [guidedPhotos, setGuidedPhotos] = useState([]);
  const devices = useCameraDevices();
  const device = devices?.find((d) => d.position === 'back');
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized' || status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (localUri) {
      Toast.show('파일이 저장소에 저장되었습니다!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  }, [localUri]);

  const currentCell = photoCells[currentIdx];
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  let aspectRatio = 1.0;
  let frameWidth = 100;
  let frameHeight = 100;

  if (currentCell) {
    const w = Number(currentCell.cellWidthMm);
    const h = Number(currentCell.rowHeightMm);
    aspectRatio = w / h;

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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: '저장소 권한 요청',
          message: '사진을 저장하려면 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '취소',
          buttonPositive: '확인',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleTakePhoto = async () => {
  if (!cameraRef.current || isSaving) return;

  setIsSaving(true);
  try {
    await requestStoragePermission();

    const photo = await cameraRef.current.takePhoto({ flash: 'off' });
    let photoUri = photo.path;
    if (!photoUri.startsWith('/')) {
      photoUri = photoUri.replace(/^file:\/\//, '');
    }

    const fileName = `IMG_${Date.now()}.jpg`;
    const destPath = `${RNFS.ExternalDirectoryPath}/${fileName}`;
    await RNFS.copyFile(photoUri, destPath);

    setPhotos(prev => [...prev, destPath]);

    const guidedPath = await handleTakeGuidedPhoto(destPath);
    const guidedUri = guidedPath.startsWith('file://') ? guidedPath : `file://${guidedPath}`;
    const newGuidedPhotos = [...guidedPhotos, guidedUri];

    if (currentIdx < photoCells.length - 1) {
      setGuidedPhotos(newGuidedPhotos);
      setCurrentIdx(currentIdx + 1);
      Toast.show('다음 셀로 이동합니다.', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } else {
      setGuidedPhotos(newGuidedPhotos);
      Toast.show('모든 촬영 완료!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });

      navigation.navigate('Saving', {
        guidedPhotos: newGuidedPhotos,
        photoCells: photoCells,
        originalDocxPath: localUri,
      });
    }

  } catch (err) {
    console.error('촬영/저장 실패:', err);
    Toast.show('촬영 실패: ' + err.message, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
    });
  } finally {
    setIsSaving(false);
  }
};
  
  const handleTakeGuidedPhoto = async (photoPath) => {
    try {
      const { left, top, width, height } = frameStyle;
      const originalImage = await RNFS.stat(photoPath);
      const imageWidth = 1920;
      const imageHeight = 1080;
  
      const xRatio = imageWidth / screenWidth;
      const yRatio = imageHeight / screenHeight;
  
      const cropRect = {
        x: left * xRatio,
        y: top * yRatio,
        width: width * xRatio,
        height: height * yRatio,
      };
  
      const croppedUri = await PhotoManipulator.crop(
        `file://${photoPath}`,
        cropRect
      );
  
      const destPath = `${RNFS.ExternalDirectoryPath}/GUIDED_${Date.now()}.jpg`;
      const croppedPath = croppedUri.replace(/^file:\/\//, '');
      await RNFS.moveFile(croppedPath, destPath);
  
      return destPath;
    } catch (err) {
      console.error('크롭 중 에러 발생:', err);
      return '';
    }
  };  

  if (!device || !hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>카메라 준비 중...</Text>
      </View>
    );
  }

  const frameStyle = currentCell
    ? {
        position: 'absolute',
        left: (screenWidth - frameWidth) / 2,
        top: (screenHeight - frameHeight) / 2,
        width: frameWidth,
        height: frameHeight,
        ...styles.guideFrame,
      }
    : {};

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={styles.camera} options={{ format: 'jpg', quality: 1 }}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />
        <GuideOverlay frameStyle={frameStyle} />
      </ViewShot>

      <Text style={styles.guideText} pointerEvents="none">
        {currentCell
          ? `${currentCell.match} (${currentIdx + 1}/${photoCells.length})`
          : '사진 셀 정보 없음'}
      </Text>

      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          onPress={handleTakePhoto}
          style={[styles.captureButton, isSaving && styles.captureButtonDisabled]}
          disabled={isSaving}
        >
          <Text style={styles.captureButtonText}>
            {isSaving ? '저장중...' : '촬영'}
          </Text>
        </TouchableOpacity>
      </View>

      {guidedPhotos.length > 0 && (
        <View style={styles.thumbnailContainer} pointerEvents="none">
          {guidedPhotos.map((uri, idx) => (
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
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
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
  captureButtonDisabled: { opacity: 0.5 },
  captureButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});
