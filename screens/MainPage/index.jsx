import React from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import JSZip from 'jszip';
import { Buffer } from 'buffer';
import { XMLParser } from 'fast-xml-parser';

export default function MainPage() {
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
    Alert.alert('성공', `파일이 로컬에 저장되었습니다.\n경로: ${copyResult.localUri}`);
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

  const xmlToJs = async (documentXml) => {
    const parser = new XMLParser({
      ignoreAttributes: false
    });
    const docObj = parser.parse(documentXml);
    const body = docObj['w:document']?.['w:body'];
    
    if (!body) {
      console.log('문서에 w:body가 없습니다.');
      return;
    }
    const bodyArr = Array.isArray(body) ? body : [body];

    bodyArr.forEach((page, pageIdx) => {
      const tables = page?.['w:tbl'];
      if (!tables) {
        console.log(`페이지 ${pageIdx + 1}에 표(w:tbl)가 없습니다.`);
        return;
      }

      const tablesArray = Array.isArray(tables) ? tables : [tables];
      
      tablesArray.forEach((tbl, tblIdx) => {
        const rows = tbl['w:tr'];
        if (!rows) return;
        
        const rowsArray = Array.isArray(rows) ? rows : [rows];
        
        rowsArray.forEach((row, rowIdx) => {
          let rowProps = row['w:trPr'];
          if (Array.isArray(rowProps)) rowProps = rowProps[0];
          let trHeight = rowProps?.['w:trHeight'];
          if (Array.isArray(trHeight)) trHeight = trHeight[0];
          const rowHeightDxa = trHeight?.['@_w:val'];
          const rowHeightMm = rowHeightDxa && rowHeightDxa !== '' ? (rowHeightDxa * 0.3528 / 20).toFixed(2) : '알수없음';
          const cells = row['w:tc'];
          if (!cells) return;
          const cellsArray = Array.isArray(cells) ? cells : [cells];
          
          cellsArray.forEach((cell, colIdx) => {
            
            let cellProps = cell['w:tcPr'];
            if (Array.isArray(cellProps)) cellProps = cellProps[0];
            let tcW = cellProps?.['w:tcW'];
            const cellWidthDxa = tcW?.['@_w:w'];
            const cellWidthMm = cellWidthDxa && cellWidthDxa !== '' ? (cellWidthDxa * 0.3528 / 20).toFixed(2) : '알수없음';

            let cellText = '';
            const paras = cell['w:p'] || [];
            const parasArray = Array.isArray(paras) ? paras : [paras];

            parasArray.forEach(p => {
              const runs = p['w:r'] || [];
              const runsArray = Array.isArray(runs) ? runs : [runs];
              runsArray.forEach(r => {
                if (r['w:t']) cellText += Array.isArray(r['w:t']) ? r['w:t'].join('') : r['w:t'];
              });
            });
            
            const photoMatches = cellText.match(/사진\d+/g);

            if (photoMatches) {
              photoMatches.forEach(match => {
                console.log(
                  `페이지${pageIdx+1} - 표${tblIdx+1} - [${rowIdx+1}행, ${colIdx+1}열] : ${match}\n` +
                  `가로: ${cellWidthMm}mm, 세로: ${rowHeightMm}mm`
                );
              });
            }
          });
        });
      });
    });
  };

  const handleUpload = async () => {
    try {
      const localUri = await importDocx();
      if (!localUri) return;
      const documentXml = await docxToXml(localUri);
      await xmlToJs(documentXml);
    } catch (err) {
      console.log('pick 함수 에러:', err);
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
