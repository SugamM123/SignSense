import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native';

// ASL signs
const ASL_SIGNS = {
  '1': 'https://asl-hands.s3.amazonaws.com/LSQ_1.jpg',
  '2': 'https://asl-hands.s3.amazonaws.com/LSQ_2.jpg',
  '3': 'https://asl-hands.s3.amazonaws.com/LSQ_3.jpg',
  '4': 'https://asl-hands.s3.amazonaws.com/LSQ_4.jpg',
  '5': 'https://asl-hands.s3.amazonaws.com/LSQ_5.jpg',
  '6': 'https://asl-hands.s3.amazonaws.com/LSQ_6.jpg',
  '7': 'https://asl-hands.s3.amazonaws.com/LSQ_7.jpg',
  '8': 'https://asl-hands.s3.amazonaws.com/LSQ_8.jpg',
  '9': 'https://asl-hands.s3.amazonaws.com/LSQ_9.jpg',
  '10': 'https://asl-hands.s3.amazonaws.com/LSQ_10.jpg'
};

const Level1Screen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [health, setHealth] = useState<number>(1);

  useEffect(() => {
    newQuestion();
  }, []);

  const newQuestion = () => {
    const numbers = Object.keys(ASL_SIGNS);
    const correctAnswer = numbers[Math.floor(Math.random() * numbers.length)];
    setCurrentQuestion(correctAnswer);

    let wrongAnswers = numbers.filter(num => num !== correctAnswer);
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

  return (
    <View className='flex-1 justify-center items-center bg-gray-100 p-4'>
      <View className='bg-white rounded-lg shadow-md p-6 w-full max-w-md'>
        <Text className='text-2xl font-bold text-center mb-4'>ASL Learning</Text>
        <View className='w-full h-5 bg-gray-200 rounded-full mb-2'>
          <View className={`h-full rounded-full ${getHealthColor()}`} style={{ width: `${health * 100}%` }} />
        </View>
        <Text className='text-center text-lg font-semibold mb-4'>Health: {Math.round(health * 100)}%</Text>
        <Image source={{ uri: ASL_SIGNS[currentQuestion as keyof typeof ASL_SIGNS] }} className='w-48 h-48 self-center mb-6' resizeMode="contain" />
        <View className='flex-row flex-wrap justify-center'>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleAnswer(option)}
              className='bg-blue-500 rounded-lg m-2 p-4 w-24'
            >
              <Text className='text-white text-center font-bold text-lg'>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default Level1Screen;

