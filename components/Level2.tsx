import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native';

const ASL_SIGNS = {
  'A': 'https://asl-hands.s3.amazonaws.com/gifs/A-Sign-Language-Alphabet.gif',
  'B': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-B-in-Sign-Language-ASL.gif',
  'C': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-say-letter-C-in-ASL-sign-Language.gif',
  'D': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-D-in-Sign-Language-ASL.gif',
  'E': 'https://asl-hands.s3.amazonaws.com/gifs/The-Letter-E-in-Sign-Language.gif',
  'F': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-F-in-Sign-Language-ASL.gif',
  'G': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-G-in-Sign-Language-ASL.gif',
  'H': 'https://asl-hands.s3.amazonaws.com/gifs/H-in-Sign-Language-Alphabet.gif',
  'I': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-I-in-Sign-Language-ASL.gif',
  'J': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-J-in-ASL-Alphabets.gif',
  'K': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-J-in-ASL-Alphabets.gif',
  'L': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-L-in-ASL-Alphabets.gif',
  'M': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-M-in-ASL-Alphabets.gif',
  'N': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-N-in-ASL-Alphabets.gif',
  'O': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-O-in-ASL-Alphabets.gif',
  'P': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-P-in-ASL-Alphabets.gif',
  'Q': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Q-in-ASL-Alphabets.gif',
  'R': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-R-in-ASL-Alphabets.gif',
  'S': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-S-in-ASL-Alphabets.gif',
  'T': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-T-in-ASL-Alphabets.gif',
  'U': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-U-in-ASL-Alphabets.gif',
  'V': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-V-in-ASL-Alphabets.gif',
  'W': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-W-in-ASL-Alphabets.gif',
  'X': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-X-in-ASL-Alphabets.gif',
  'Y': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Y-in-ASL-Alphabets.gif',
  'Z': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Z-in-ASL-Alphabets.gif',
};

const Level2Screen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [health, setHealth] = useState<number>(1);

  useEffect(() => {
    newQuestion();
  }, []);

  const newQuestion = () => {
    const letters = Object.keys(ASL_SIGNS);
    const correctAnswer = letters[Math.floor(Math.random() * letters.length)];
    setCurrentQuestion(correctAnswer);

    let wrongAnswers = letters.filter(letter => letter !== correctAnswer);
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
        <Text className='text-2xl font-bold text-center mb-4'>ASL Alphabet Learning</Text>
        <View className='w-full h-5 bg-gray-200 rounded-full mb-2'>
          <View className={`h-full rounded-full ${getHealthColor()}`} style={{ width: `${health * 100}%` }} />
        </View>
        <Text className='text-center text-lg font-semibold mb-4'>{`Health: ${Math.round(health * 100)}%`}</Text>
        <Image 
          source={{ uri: ASL_SIGNS[currentQuestion as keyof typeof ASL_SIGNS] }} 
          className='w-48 h-48 self-center mb-6' 
          resizeMode="contain" 
        />
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

export default Level2Screen;