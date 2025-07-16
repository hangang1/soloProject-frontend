import RNFS from 'react-native-fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import Toast from 'react-native-root-toast';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

export default function Saving() {
  const route = useRoute();
  const navigation = useNavigation();

  const {
    guidedPhotos = [],
    photoCells = [],
    originalDocxPath,
    accessToken,
    folderId,
  } = route.params || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [dotText, setDotText] = useState('');

  useEffect(() => {
    let interval;
    if (isProcessing) {
      interval = setInterval(() => {
        setDotText(prev => {
          if (prev === '') return '.';
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '';
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const uploadToGoogleDrive = async (localPath) => {
    try {
      const fileContent = await RNFS.readFile(localPath, 'base64');

      const metadata = {
        name: `guided_${Date.now()}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        parents: [folderId],
      };

      const body =
        `--boundary_12345\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--boundary_12345\r\n` +
        `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${fileContent}\r\n` +
        `--boundary_12345--`;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/related; boundary=boundary_12345',
          },
          body,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('업로드 실패:', result);
        throw new Error(result.error?.message || '업로드 실패');
      }

      Toast.show('구글드라이브 업로드 성공!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.CENTER,
      });
    } catch (err) {
      console.error('업로드 에러:', err);
      Alert.alert('업로드 오류', err.message);
    }
  };

  const handleCreateDocx = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const docxContent = await RNFS.readFile(originalDocxPath, 'base64');
      const buffer = Buffer.from(docxContent, 'base64');
      const uint8array = new Uint8Array(buffer);
      const zip = new PizZip(uint8array);

      const templateData = {};
      guidedPhotos.forEach((photoPath, idx) => {
        templateData[`PHOTO${idx + 1}`] = photoPath;
      });

      const imageModule = new ImageModule({
        centered: false,
        fileType: 'docx',
        getImage: async (tagValue, tagName) => {
          const idx = parseInt(tagName.replace('PHOTO', ''), 10) - 1;
          const imagePath = guidedPhotos[idx];
          const imageBase64 = await RNFS.readFile(imagePath, 'base64');
          return Buffer.from(imageBase64, 'base64');
        },
        getSize: (buf, tagValue, tagName) => {
          const idx = parseInt(tagName.replace('PHOTO', ''), 10) - 1;
          const cell = photoCells[idx];
          const widthEmu = parseFloat(cell.cellWidthMm) * 36000;
          const heightEmu = parseFloat(cell.rowHeightMm) * 36000;
          return [widthEmu, heightEmu];
        },
      });

      const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });

      if (doc.renderAsync) {
        await doc.renderAsync(templateData);
      } else {
        doc.render(templateData);
      }

      const output = doc.getZip().generate({ type: 'uint8array' });
      const base64Output = Buffer.from(output).toString('base64');
      const outputPath = `${RNFS.ExternalDirectoryPath}/processed_${Date.now()}.docx`;

      await RNFS.writeFile(outputPath, base64Output, 'base64');

      Toast.show('DOCX 파일 생성 완료!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.CENTER,
      });

      if (accessToken && folderId) {
        await uploadToGoogleDrive(outputPath);
      } else {
        console.log("[Saving] 로컬 저장 전용 - 구글 업로드 생략");
      }

      navigation.navigate('MainPage', {
        processedDocxPath: outputPath,
        message: '문서 생성 및 업로드 완료!',
      });
    } catch (err) {
      console.error('[ERROR] 문서 생성 또는 업로드 중 문제 발생:', err);
      Toast.show('오류: ' + err.message, {
        duration: Toast.durations.LONG,
        position: Toast.positions.CENTER,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExit = () => {
    navigation.navigate('MainPage');
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.saveButton}
          disabled={isProcessing}
          onPress={handleCreateDocx}
        >
          <Text style={styles.saveButtonText}>
            {isProcessing ? `처리중${dotText}` : '문서 저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExit}
        disabled={isProcessing}
      >
        <Text style={styles.exitButtonText}>종 료</Text>
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
    marginTop: 50,
    alignItems: 'center',
    gap: 20,
  },
  saveButton: {
    backgroundColor: BLUE,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  exitButton: {
    backgroundColor: RED,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    marginBottom: 20,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
