import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';

export default function GoogleDriveScreen({ route }) {
  const { user, files, accessToken, folderId } = route.params;
  const navigation = useNavigation();

  const handleDownloadAndProcess = async (file) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error('다운로드 실패 상태:', response.status, text);
        throw new Error('파일 다운로드 실패');
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        const localPath = `${RNFS.DocumentDirectoryPath}/${file.name}`;
        await RNFS.writeFile(localPath, base64data, 'base64');

        navigation.navigate('MainPage', {
          downloadedDocxPath: `file://${localPath}`,
          accessToken,
          folderId,
        });
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      Alert.alert('오류', err.message || '다운로드 중 문제 발생');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GoogleDrive - Word문서 목록</Text>

      {user && (
        <View style={styles.userInfo}>
          <Text>👤 {user.name} ({user.email})</Text>
        </View>
      )}

      <ScrollView style={styles.fileList}>
        {files && files.length > 0 ? (
          files.map((file) => (
            <View key={file.id} style={styles.fileItem}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileMeta}>{file.mimeType}</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleDownloadAndProcess(file)}
              >
                <Text style={styles.selectButtonText}>선택</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noFiles}>Word 문서가 없습니다.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const BLUE = '#2D71BE';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: BLUE,
  },
  userInfo: { marginBottom: 20 },
  fileList: { marginTop: 10 },
  fileItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  fileName: { fontSize: 16 },
  fileMeta: { fontSize: 12, color: '#666' },
  selectButton: {
    marginTop: 5,
    padding: 6,
    backgroundColor: BLUE,
    alignSelf: 'flex-start',
    borderRadius: 6,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noFiles: {
    marginTop: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});
