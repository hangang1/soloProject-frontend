import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  offlineAccess: false,
  scopes: [
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents',
  ],
});

export const loginWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();

    console.log('로그인 성공:', userInfo);
    console.log('토큰:', tokens);

    return {
      accessToken: tokens.accessToken,
      user: userInfo.user,
    };
  } catch (err) {
    console.error('로그인 에러:', err);
    throw new Error('Google 로그인에 실패했습니다.');
  }
};
