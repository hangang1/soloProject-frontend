import React, { useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import JSZip from 'jszip';
import { Buffer } from 'buffer';
import { XMLParser } from 'fast-xml-parser';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-root-toast';

export default function MainPage() {
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    if (route.params?.message) {
      Toast.show(route.params.message, {
        duration: Toast.durations.LONG,
        position: Toast.positions.CENTER,
      });
      navigation.setParams({ message: undefined });
    }
  }, [route.params?.message, navigation]);

  const importDocx = async () => {
    const [pickResult] = await pick({ type: [types.doc, types.docx] });
    const [copyResult] = await keepLocalCopy({
      files: [
        {
          uri: pickResult.uri,
          fileName: pickResult.name ?? '업로드파일.docx',
        },
      ],
      destination: 'documentDirectory',
    });
    if (copyResult.status !== 'success') {
      Alert.alert('실패', copyResult.error || '파일 저장에 실패했습니다.');
      return null;
    }
    return copyResult.localUri;
  };

  const docxToXml = async (localUri) => {
    const realPath = localUri.replace('file://', '');
    const fileBase64 = await RNFS.readFile(realPath, 'base64');
    const buffer = Buffer.from(fileBase64, 'base64');
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml').async('string');
    return documentXml;
  };

  const xmlToJsImproved = async (documentXml, localUri) => {
    const parser = new XMLParser({ ignoreAttributes: false });
    const docObj = parser.parse(documentXml);
    const body = docObj['w:document']?.['w:body'];
  
    if (!body) {
      Alert.alert('오류', '문서에 w:body가 없습니다.');
      return;
    }
  
    const photoCells = [];
    const tables = body['w:tbl']
      ? Array.isArray(body['w:tbl'])
        ? body['w:tbl']
        : [body['w:tbl']]
      : [];
  
    if (tables.length === 0) {
      Alert.alert('알림', '문서에 표(w:tbl)가 없습니다.');
      return;
    }
  
    tables.forEach((tbl, tblIdx) => {
      const rows = tbl['w:tr']
        ? Array.isArray(tbl['w:tr'])
          ? tbl['w:tr']
          : [tbl['w:tr']]
        : [];
  
      rows.forEach((row, rowIdx) => {
        const rowHeightDxa = row?.['w:trPr']?.['w:trHeight']?.['@_w:val'];
        const rowHeightMm = rowHeightDxa ? (rowHeightDxa * 0.3528 / 20).toFixed(2) : '알수없음';
  
        const cells = row['w:tc']
          ? Array.isArray(row['w:tc'])
            ? row['w:tc']
            : [row['w:tc']]
          : [];
  
        cells.forEach((cell, colIdx) => {
          const cellWidthDxa = cell?.['w:tcPr']?.['w:tcW']?.['@_w:w'];
          const cellWidthMm = cellWidthDxa ? (cellWidthDxa * 0.3528 / 20).toFixed(2) : '알수없음';
  
          const paras = cell['w:p']
            ? Array.isArray(cell['w:p'])
              ? cell['w:p']
              : [cell['w:p']]
            : [];
  
          let cellText = '';
  
          paras.forEach(p => {
            const runs = p['w:r']
              ? Array.isArray(p['w:r'])
                ? p['w:r']
                : [p['w:r']]
              : [];
  
            runs.forEach(r => {
              if (r['w:t']) {
                const text = Array.isArray(r['w:t']) ? r['w:t'].join('') : r['w:t'];
                cellText += text;
              }
            });
          });
  
          if (cellText.includes('PHOTO')) {
            photoCells.push({
              match: 'PHOTO',
              cellWidthMm,
              rowHeightMm,
              tblIdx,
              rowIdx,
              colIdx,
            });
          }
        });
      });
    });
  
    if (photoCells.length > 0) {
      navigation.navigate('Capturing', { localUri, photoCells });
    } else {
      Alert.alert('알림', '문서에서 PHOTO 태그를 찾지 못했습니다.');
    }
  };  

  const handleUpload = async () => {
    try {
      const localUri = await importDocx();
      if (!localUri) return;

      const documentXml = await docxToXml(localUri);
      await xmlToJsImproved(documentXml, localUri);
    } catch (err) {
      Alert.alert('오류', err?.message || String(err));
    }
  };

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
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Text style={styles.uploadButtonText}>보고서{"\n"}UPLOAD</Text>
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
