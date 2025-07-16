import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  offlineAccess: false,
  scopes: [
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents',
  ],
});

export const loginWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();

  return {
    accessToken: tokens.accessToken,
    user: userInfo.user,
  };
};
