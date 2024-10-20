import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import Level1 from '../../components/Level1';
import Level2 from '../../components/Level2';
import Level3 from '../../components/Level3';
const Stack = createStackNavigator();

// home screen
function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#ffcc00', padding: 20, borderRadius: 10, margin: 10 }}
          onPress={() => navigation.navigate('Level1')}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Level 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#fe9920', padding: 20, borderRadius: 10, margin: 10 }}
          onPress={() => navigation.navigate('Level2')}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Level 2</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#fc6058', padding: 20, borderRadius: 10, margin: 10 }}
          onPress={() => navigation.navigate('Level3')}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Level 3</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

// app navigator
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Lessons', headerShown: false }} />
      <Stack.Screen name="Level1" component={Level1} options={{ title: 'Level 1: ASL Numbers' }} />
      <Stack.Screen name="Level2" component={Level2} options={{ title: 'Level 2: ASL Alphabet' }} />
      <Stack.Screen name="Level3" component={Level3} options={{ title: 'Level 3: ASL Phrases' }} />
    </Stack.Navigator>
  );
}

// level 1 screen 
export function Level1Screen() {
    return (
      <NavigationContainer independent={true}>
        <AppNavigator />
      </NavigationContainer>
    );
}

// level 2 screen
export function Level2Screen() {
  return (
    <NavigationContainer independent={true}>
      <AppNavigator />
    </NavigationContainer>
  );
}

// level 3 screen
export default function Level3Screen() {
  return (
    <NavigationContainer independent={true}>
      <AppNavigator />
    </NavigationContainer>
  );
}