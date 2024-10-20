import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Types
type Difficulty = 'Apprentice' | 'Wizard' | 'Sorcerer';

type RootStackParamList = {
  Home: undefined;
  Game: { difficulty: Difficulty };
  Result: {
    finalScore: number;
    difficulty: Difficulty;
    timeSpent: number;
  };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;
type ResultScreenProps = NativeStackScreenProps<RootStackParamList, 'Result'>;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Home Screen Component
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [sparkle] = useState(new Animated.Value(0));

  const difficultyButtons = {
    Apprentice: styles.apprenticeButton,
    Wizard: styles.wizardButton,
    Sorcerer: styles.sorcererButton,
  } as const;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const startGame = (difficulty: Difficulty) => {
    navigation.navigate('Game', { difficulty });
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            opacity: sparkle,
            transform: [{
              scale: sparkle.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1.05],
              }),
            }],
          },
        ]}
      >
        <Text style={styles.title}>Welcome, Arithmetica!</Text>
      </Animated.View>

      <Text style={styles.story}>
        Young wizard, your journey to master the arcane arts of mathematics begins here.
        Solve magical equations to advance in your wizarding studies!
      </Text>

      {(['Apprentice', 'Wizard', 'Sorcerer'] as const).map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.button, difficultyButtons[level]]}
          onPress={() => startGame(level)}
        >
          <Text style={styles.buttonText}>Begin as {level}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Game Screen Component
const GameScreen: React.FC<GameScreenProps> = ({ route, navigation }) => {
  const { difficulty } = route.params;
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getDifficultyTime(difficulty));
  const [currentProblem, setCurrentProblem] = useState(generateProblem(difficulty));
  const [answer, setAnswer] = useState('');

  function getDifficultyTime(diff: Difficulty): number {
    const times = {
      Apprentice: 60,
      Wizard: 45,
      Sorcerer: 30,
    };
    return times[diff];
  }

  function generateProblem(diff: Difficulty) {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2;

    switch (diff) {
      case 'Apprentice':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        break;
      case 'Wizard':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        break;
      case 'Sorcerer':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        break;
      default:
        num1 = num2 = 1;
    }

    return {
      question: `${num1} ${operation} ${num2}`,
      answer: eval(`${num1} ${operation} ${num2}`),
      scenario: getRandomScenario(num1, num2, operation),
    };
  }

  function getRandomScenario(num1: number, num2: number, operation: string) {
    const scenarios = [
      `A magical chest requires solving ${num1} ${operation} ${num2} to unlock!`,
      `Cast a spell by calculating ${num1} ${operation} ${num2} magical orbs!`,
      `Defeat the dragon by solving ${num1} ${operation} ${num2} quickly!`,
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigation.navigate('Result', {
            finalScore: score,
            difficulty,
            timeSpent: getDifficultyTime(difficulty) - prev,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const checkAnswer = () => {
    const userAnswer = parseFloat(answer);
    if (userAnswer === currentProblem.answer) {
      const timeBonus = Math.floor(timeLeft / 10);
      const newScore = score + 10 + timeBonus;
      setScore(newScore);
      setCurrentProblem(generateProblem(difficulty));
      setAnswer('');
      Alert.alert('Correct!', `+${10 + timeBonus} points!`);
    } else {
      Alert.alert('Try Again!', 'That spell didn\'t quite work...');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>Time Remaining: {timeLeft}s</Text>
      <Text style={styles.scoreText}>Score: {score}</Text>
      <Text style={styles.scenario}>{currentProblem.scenario}</Text>
      <Text style={styles.problem}>{currentProblem.question}</Text>
      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={setAnswer}
        keyboardType="numeric"
        placeholder="Enter your answer..."
        placeholderTextColor="#666"
      />
      <TouchableOpacity style={styles.submitButton} onPress={checkAnswer}>
        <Text style={styles.buttonText}>Cast Spell!</Text>
      </TouchableOpacity>
    </View>
  );
};

// Result Screen Component
const ResultScreen: React.FC<ResultScreenProps> = ({ route, navigation }) => {
  const { finalScore, difficulty, timeSpent } = route.params;

  const getFeedback = (score: number): string => {
    if (score >= 100) return "Outstanding! You're a true magical mathematician!";
    if (score >= 50) return "Well done! Keep practicing your magical equations!";
    return "Keep studying! Every great wizard started somewhere.";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Training Results</Text>
      <Text style={styles.scoreText}>Final Score: {finalScore}</Text>
      <Text style={styles.difficultyText}>Difficulty: {difficulty}</Text>
      <Text style={styles.timeText}>Time Spent: {timeSpent} seconds</Text>
      <Text style={styles.feedback}>{getFeedback(finalScore)}</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

// App Component
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6a0dad',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'fantasy',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: "Arithmetica's Quest" }}
        />
        <Stack.Screen 
          name="Game" 
          component={GameScreen}
          options={{ title: "Magical Challenge" }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ title: "Training Results" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a0033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 20,
  },
  story: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: '80%',
    padding: 15,
    borderRadius: 25,
    marginVertical: 10,
    backgroundColor: '#6a0dad',
    alignItems: 'center',
  },
  apprenticeButton: {
    backgroundColor: '#4CAF50',
  },
  wizardButton: {
    backgroundColor: '#2196F3',
  },
  sorcererButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 28,
    color: '#ffd700',
    marginBottom: 20,
  },
  scenario: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    borderWidth: 2,
    borderColor: '#6a0dad',
    borderRadius: 10,
  },
  problem: {
    fontSize: 32,
    color: '#ffd700',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 24,
    marginBottom: 20,
  },
  submitButton: {
    width: '60%',
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  feedback: {
    fontSize: 20,
    color: '#ffd700',
    textAlign: 'center',
    marginVertical: 20,
    padding: 10,
  },
});