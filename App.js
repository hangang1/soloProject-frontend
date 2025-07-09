import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootSiblingParent } from 'react-native-root-siblings';
import 'react-native-gesture-handler';
import MainPage from './screens/MainPage';
import Capturing from './screens/Capturing';
import Saving from './screens/Savig';

const Stack = createStackNavigator();

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <RootSiblingParent>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Stack.Navigator initialRouteName="MainPage" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainPage" component={MainPage} />
          <Stack.Screen name="Capturing" component={Capturing} />
          <Stack.Screen name="Saving" component={Saving} />
        </Stack.Navigator>
      </NavigationContainer>
    </RootSiblingParent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
