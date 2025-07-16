export const findFolderId = async (accessToken, folderName) => {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`;
  const encodedQuery = encodeURIComponent(query);

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    `q=${encodedQuery}` +
    `&fields=files(id,name)` +
    `&pageSize=1`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!data.files || data.files.length === 0) {
    throw new Error(`폴더 '${folderName}'를 찾을 수 없습니다.`);
  }

  const folderId = data.files[0].id;
  return folderId;
};

export const fetchWordFilesInFolder = async (accessToken, folderId) => {
  const query = `('${folderId}' in parents) and (
    mimeType='application/msword' or 
    mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) and trashed=false`;

  const encodedQuery = encodeURIComponent(query);

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    `q=${encodedQuery}` +
    `&fields=files(id,name,mimeType,owners(displayName))` +
    `&pageSize=50`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!data.files || data.files.length === 0) {
    console.log(`폴더에 Word 문서가 없습니다.`);
    return [];
  }

  console.log(`폴더 안 Word 문서 ${data.files.length}개 목록:`);
  data.files.forEach((f) => {
    console.log(
      `- ${f.name} (${f.mimeType}) | 소유자: ${f.owners?.[0]?.displayName ?? '알 수 없음'}`
    );
  });

  return data.files;
};
