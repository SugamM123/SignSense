import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LessonsComponent from './lessons'; // Renamed import
const Stack = createStackNavigator();

function HomeScreen({ navigation }: { navigation: any }) {
  const [minutes, setMinutes] = useState(0);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    // Set today's date
    const date = new Date();
    setTodayDate(date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    // Start the timer
    const timer = setInterval(() => {
      setMinutes(prevMinutes => prevMinutes + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#EBF8FF' }}>
      <StatusBar style="auto" />
      {/* Header */}
      <ImageBackground
        source={require('../../assets/images/tidal_logo.png')}
        style={{ width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' }}
        resizeMode="cover"
      >
      </ImageBackground>
      {/* Main Content */}
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: '#1E40AF', fontSize: 20, fontWeight: '600', marginBottom: 16 }}>Welcome back, Sarah!</Text>
        <View style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Today's Progress</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1E40AF' }}>{minutes} minutes</Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>Time spent learning today</Text>
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Daily Goal</Text>
          <View style={{ backgroundColor: '#E5E7EB', height: 16, borderRadius: 8, marginTop: 8 }}>
            <View style={{ backgroundColor: '#10B981', height: 16, borderRadius: 8, width: '50%' }}></View>
          </View>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>10 / 20 signs learned</Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: '#3B82F6', borderRadius: 8, padding: 16, alignItems: 'center' }}
          onPress={() => navigation.navigate('Lessons')}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>Continue Learning</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: 'black', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>Developed by Tidal Hackathon Team:</Text>
      <Text style={{ color: 'blue', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>Harsh Dave, Shlok Bhakta, Sugam Mishra, Mehul Jain</Text>
      <View style={{ backgroundColor: '#1E40AF', padding: 16, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>{todayDate}</Text>
      </View>
    </View>
  );
}

// app navigator
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Lessons" component={LessonsComponent} />
    </Stack.Navigator>
  );
}

// level 2 screen
export default function Lessons() {
  return (
    <NavigationContainer independent={true}>
      <AppNavigator />
    </NavigationContainer>
  );
}