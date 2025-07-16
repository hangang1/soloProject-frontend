import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';

const GoogleDriveScreen = ({ route }) => {
  const { tokens } = route.params;

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDriveFiles = async () => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name)',
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.files) {
        setFiles(data.files);
      } else {
        Alert.alert('오류', '파일 목록을 가져오지 못했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>구글 드라이브 파일 목록</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default GoogleDriveScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
