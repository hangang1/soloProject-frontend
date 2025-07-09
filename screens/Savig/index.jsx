import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import Toast from 'react-native-root-toast';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

export default function Saving() {
  const route = useRoute();
  const navigation = useNavigation();
  const { guidedPhotos = [], photoCells = [], originalDocxPath } = route.params || {};
  const [isProcessing, setIsProcessing] = useState(false);

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

      await Promise.all(guidedPhotos.map(async (photoPath, idx) => {
        const exists = await RNFS.exists(photoPath);
      }));

      const imageModule = new ImageModule({
        centered: false,
        fileType: 'docx',
        getImage: async (tagValue, tagName) => {
          const idx = parseInt(tagName.replace("PHOTO", ""), 10) - 1;
          const imagePath = guidedPhotos[idx];

          const exists = await RNFS.exists(imagePath);
          if (!exists) throw new Error(`getImage: 파일이 존재하지 않음: ${imagePath}`);

          const imageBase64 = await RNFS.readFile(imagePath, 'base64');
          const buf = Buffer.from(imageBase64, 'base64');

          return buf;
        },
        getSize: (buf, tagValue, tagName) => {
          const idx = parseInt(tagName.replace("PHOTO", ""), 10) - 1;
          const cell = photoCells[idx];

          if (!cell || !cell.cellWidthMm || !cell.rowHeightMm) {
            throw new Error(`getSize: invalid cell size. cell=${JSON.stringify(cell)}`);
          }

          const widthEmu = parseFloat(cell.cellWidthMm) * 36000;
          const heightEmu = parseFloat(cell.rowHeightMm) * 36000;

          return [widthEmu, heightEmu];
        }
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

      navigation.navigate('MainPage', {
        processedDocxPath: outputPath,
        message: 'DOCX 파일이 성공적으로 생성되었습니다!',
      });
    } catch (err) {
      console.error('[ERROR] render 또는 파일 생성 중 문제 발생:', err);
      if (err.properties && err.properties.errors) {
        err.properties.errors.forEach(e => {
          console.error('[ERROR DETAIL]', e);
        });
      }
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
            {isProcessing ? '처리중...' : '문서 저장'}
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
