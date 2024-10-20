import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Alert, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const ASL_SIGNS = {
  'Nice to meet you': 'https://youtu.be/F7Wjb_AIvMA?si=UHE6-gm3HDvyQlRy',
  'And': 'https://youtu.be/PvFguNv1zIk?si=eVUP2W8i4QyT-J1m',
  'Us': 'https://youtu.be/DJU9Vnthfqk?si=p8V4apezjmd16lJI',
  'Need': 'https://www.youtube.com/watch?v=Eo-vEE1gFxM',
  'Thank you': 'https://www.youtube.com/watch?v=IvRwNLNR4_w',
  'Good Morning': 'https://www.youtube.com/watch?v=HWTOUetDsOk',
  'School': 'https://www.youtube.com/watch?v=vuE3RN10AGA',
  'Everyone': 'https://www.youtube.com/watch?v=FFVj-39E94c',
  'Mom': 'https://www.youtube.com/watch?v=DHl2-NT3mIM',
  'Happy': 'https://www.youtube.com/watch?v=ZXHHO_DY6_A',
  'I love you': 'https://www.youtube.com/watch?v=rwBDGMQmmXk',
  'Understand': 'https://www.youtube.com/watch?v=5N10dIavSYc',
  'See you later': 'https://www.youtube.com/watch?v=3n81DT4NTOw',
  'Dad': 'https://www.youtube.com/watch?v=1Vllc4F5ic0',
  'Good job': 'https://www.youtube.com/watch?v=ZyuJALfNGU8',
  'I dont like': 'https://www.youtube.com/watch?v=2zSgd7yskRg',
  'Chocolate': 'https://www.youtube.com/watch?v=pxyi6YW8gOE',
  'Come here please': 'https://www.youtube.com/watch?v=UlBU161E6pY',
  'Allow': 'https://www.youtube.com/watch?v=w705jpxY8m8',
  'Food is good': 'https://www.youtube.com/watch?v=JbNaGbl_7lM',
  'Pen?': 'https://www.youtube.com/watch?v=1JySi0OYMcc',
  'Trick or Treat?': 'https://www.youtube.com/watch?v=MwxlbFYyLhw',
  'I am sorry': 'https://www.youtube.com/watch?v=imDas8UGjv4',
  'Where do you live?': 'https://www.youtube.com/watch?v=NOpWKcox14o',
  'Texas': 'https://www.youtube.com/watch?v=YMdSm_OgAIo',
  'I am deaf': 'https://youtu.be/0S8dgbKhxpA?si=4HKDcx-yZoUde9g7'
};

const Level3Screen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [health, setHealth] = useState<number>(1);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    newQuestion();
  }, []);

  const newQuestion = () => {
    const signs = Object.keys(ASL_SIGNS);
    const correctAnswer = signs[Math.floor(Math.random() * signs.length)];
    setCurrentQuestion(correctAnswer);
    setCurrentVideoUrl(ASL_SIGNS[correctAnswer as keyof typeof ASL_SIGNS]);

    let wrongAnswers = signs.filter(sign => sign !== correctAnswer);
    wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);

    const allOptions = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  const handleAnswer = (selectedAnswer: string) => {
    if (selectedAnswer === currentQuestion) {
      setHealth(Math.min(1, health + 0.1));
      Alert.alert('Correct!', 'Great job!', [{ text: 'Next', onPress: () => newQuestion() }]);
    } else {
      setHealth(Math.max(0, health - 0.2));
      Alert.alert('Incorrect', `The correct answer was ${currentQuestion}. Try again!`, [
        { text: 'Next', onPress: () => newQuestion() }
      ]);
    }
  };

  const getHealthColor = () => {
    if (health > 0.6) return 'bg-green-500';
    if (health > 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const replayVideo = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        var video = document.querySelector('video');
        if (video) {
          video.currentTime = 0;
          video.play();
        }
        true;
      `);
    }
  };

  return (
    <View className='flex-1 justify-center items-center bg-gray-100 p-4'>
      <View className='bg-white rounded-lg shadow-md p-6 w-full max-w-md'>
        <Text className='text-2xl font-bold text-center mb-4'>ASL Learning</Text>
        <View className='w-full h-5 bg-gray-200 rounded-full mb-2'>
          <View className={`h-full rounded-full ${getHealthColor()}`} style={{ width: `${health * 100}%` }} />
        </View>
        <Text className='text-center text-lg font-semibold mb-4'>{`Health: ${Math.round(health * 100)}%`}</Text>
        
        <Text className='text-center text-lg font-semibold mb-2'>What sign is this?</Text>
        <WebView 
          ref={webViewRef}
          source={{ uri: currentVideoUrl }} 
          style={{ height: 200, marginBottom: 16 }} 
        />
        
        <TouchableOpacity
          onPress={replayVideo}
          className='bg-red-500 rounded-lg p-2 mb-4 self-center'
        >
          <Text className='text-white text-center font-bold px-2'>Play Again</Text>
        </TouchableOpacity>

        <View className='flex-row flex-wrap justify-center'>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleAnswer(option)}
              className='bg-blue-500 rounded-lg p-2 mb-4 mx-2' // Added horizontal margin
            >
              <Text className='text-white text-center font-bold px-2'>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default Level3Screen;