import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pre-loaded workout templates
const PRESET_TEMPLATES = {
  'Push Day': [
    { name: 'Bench Press', sets: '4', reps: '8', weight: '' },
    { name: 'Incline Dumbbell Press', sets: '3', reps: '10', weight: '' },
    { name: 'Shoulder Press', sets: '3', reps: '10', weight: '' },
    { name: 'Tricep Dips', sets: '3', reps: '12', weight: '' },
    { name: 'Lateral Raises', sets: '3', reps: '15', weight: '' },
  ],
  'Pull Day': [
    { name: 'Deadlift', sets: '4', reps: '6', weight: '' },
    { name: 'Pull Ups', sets: '3', reps: '10', weight: '' },
    { name: 'Barbell Row', sets: '4', reps: '8', weight: '' },
    { name: 'Face Pulls', sets: '3', reps: '15', weight: '' },
    { name: 'Bicep Curls', sets: '3', reps: '12', weight: '' },
  ],
  'Leg Day': [
    { name: 'Squat', sets: '4', reps: '8', weight: '' },
    { name: 'Romanian Deadlift', sets: '3', reps: '10', weight: '' },
    { name: 'Leg Press', sets: '3', reps: '12', weight: '' },
    { name: 'Leg Curls', sets: '3', reps: '12', weight: '' },
    { name: 'Calf Raises', sets: '4', reps: '15', weight: '' },
  ],
  'Upper Body': [
    { name: 'Bench Press', sets: '4', reps: '8', weight: '' },
    { name: 'Barbell Row', sets: '4', reps: '8', weight: '' },
    { name: 'Overhead Press', sets: '3', reps: '10', weight: '' },
    { name: 'Pull Ups', sets: '3', reps: '10', weight: '' },
    { name: 'Dumbbell Curls', sets: '3', reps: '12', weight: '' },
  ],
  'Lower Body': [
    { name: 'Squat', sets: '5', reps: '5', weight: '' },
    { name: 'Deadlift', sets: '3', reps: '5', weight: '' },
    { name: 'Leg Press', sets: '3', reps: '12', weight: '' },
    { name: 'Lunges', sets: '3', reps: '10', weight: '' },
    { name: 'Calf Raises', sets: '4', reps: '15', weight: '' },
  ],
  'Full Body': [
    { name: 'Squat', sets: '3', reps: '8', weight: '' },
    { name: 'Bench Press', sets: '3', reps: '8', weight: '' },
    { name: 'Barbell Row', sets: '3', reps: '8', weight: '' },
    { name: 'Overhead Press', sets: '3', reps: '10', weight: '' },
    { name: 'Deadlift', sets: '3', reps: '6', weight: '' },
  ],
  'Chest & Triceps': [
    { name: 'Bench Press', sets: '4', reps: '8', weight: '' },
    { name: 'Incline Press', sets: '3', reps: '10', weight: '' },
    { name: 'Chest Flyes', sets: '3', reps: '12', weight: '' },
    { name: 'Tricep Pushdown', sets: '3', reps: '12', weight: '' },
    { name: 'Overhead Extension', sets: '3', reps: '12', weight: '' },
  ],
  'Back & Biceps': [
    { name: 'Deadlift', sets: '4', reps: '6', weight: '' },
    { name: 'Pull Ups', sets: '3', reps: '10', weight: '' },
    { name: 'Cable Row', sets: '3', reps: '12', weight: '' },
    { name: 'Barbell Curl', sets: '3', reps: '10', weight: '' },
    { name: 'Hammer Curls', sets: '3', reps: '12', weight: '' },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [workouts, setWorkouts] = useState([]);
  const [bodyWeights, setBodyWeights] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({});
  const [customTemplates, setCustomTemplates] = useState({});
  
  // Modal states
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddRun, setShowAddRun] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  
  // Workout form state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const [templateName, setTemplateName] = useState('');

  // Running form state
  const [runDistance, setRunDistance] = useState('');
  const [runTime, setRunTime] = useState('');
  const [runCalories, setRunCalories] = useState('');

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('90');

  // Body weight state
  const [currentWeight, setCurrentWeight] = useState('');

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            Vibration.vibrate([0, 500, 200, 500]);
            setIsTimerRunning(false);
            Alert.alert('Rest Complete! 💪', 'Time to crush your next set!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const loadData = async () => {
    try {
      const [savedWorkouts, savedWeights, savedRecords, savedTemplates] = await Promise.all([
        AsyncStorage.getItem('workouts'),
        AsyncStorage.getItem('bodyWeights'),
        AsyncStorage.getItem('personalRecords'),
        AsyncStorage.getItem('customTemplates'),
      ]);
      
      if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
      if (savedWeights) setBodyWeights(JSON.parse(savedWeights));
      if (savedRecords) setPersonalRecords(JSON.parse(savedRecords));
      if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveWorkouts = async (newWorkouts) => {
    try {
      await AsyncStorage.setItem('workouts', JSON.stringify(newWorkouts));
      setWorkouts(newWorkouts);
    } catch (error) {
      console.error('Error saving workouts:', error);
    }
  };

  const saveBodyWeights = async (newWeights) => {
    try {
      await AsyncStorage.setItem('bodyWeights', JSON.stringify(newWeights));
      setBodyWeights(newWeights);
    } catch (error) {
      console.error('Error saving weights:', error);
    }
  };

  const savePersonalRecords = async (newRecords) => {
    try {
      await AsyncStorage.setItem('personalRecords', JSON.stringify(newRecords));
      setPersonalRecords(newRecords);
    } catch (error) {
      console.error('Error saving records:', error);
    }
  };

  const saveCustomTemplates = async (newTemplates) => {
    try {
      await AsyncStorage.setItem('customTemplates', JSON.stringify(newTemplates));
      setCustomTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  };

  const loadTemplate = (templateName) => {
    const template = PRESET_TEMPLATES[templateName] || customTemplates[templateName];
    if (template) {
      // Auto-fill with last used weights for these exercises
      const filledTemplate = template.map(ex => {
        const lastWorkout = findLastWorkoutWithExercise(ex.name);
        return {
          ...ex,
          weight: lastWorkout ? lastWorkout.weight : ex.weight,
        };
      });
      
      setExercises(filledTemplate);
      setWorkoutName(templateName);
      setShowTemplates(false);
      setShowAddWorkout(true);
      Alert.alert('Template Loaded! 💪', 'Weights auto-filled from your last workout');
    }
  };

  const findLastWorkoutWithExercise = (exerciseName) => {
    for (const workout of workouts) {
      if (workout.type === 'gym') {
        const exercise = workout.exercises.find(
          ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );
        if (exercise && exercise.weight) {
          return exercise;
        }
      }
    }
    return null;
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    const validExercises = exercises.filter(ex => ex.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    // Remove weights from template (we'll auto-fill them later)
    const templateExercises = validExercises.map(ex => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: '',
    }));

    const newTemplates = {
      ...customTemplates,
      [templateName]: templateExercises,
    };

    saveCustomTemplates(newTemplates);
    setTemplateName('');
    setShowSaveTemplate(false);
    Alert.alert('Success', 'Template saved! You can now load it anytime.');
  };

  const deleteTemplate = (name) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newTemplates = { ...customTemplates };
            delete newTemplates[name];
            saveCustomTemplates(newTemplates);
          },
        },
      ]
    );
  };

  const calculateTotalVolume = (workout) => {
    if (workout.type !== 'gym') return 0;
    
    let totalVolume = 0;
    workout.exercises.forEach(ex => {
      const sets = parseInt(ex.sets) || 0;
      const reps = parseInt(ex.reps) || 0;
      const weight = parseFloat(ex.weight) || 0;
      totalVolume += sets * reps * weight;
    });
    
    return totalVolume;
  };

  const getMonthlyVolume = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= monthStart && w.type === 'gym';
    });
    
    return monthWorkouts.reduce((sum, w) => sum + calculateTotalVolume(w), 0);
  };

  const updatePersonalRecords = (exercises) => {
    const newRecords = { ...personalRecords };
    let hasNewRecord = false;

    exercises.forEach(ex => {
      if (ex.name && ex.weight) {
        const weight = parseFloat(ex.weight);
        const exerciseName = ex.name.toLowerCase();
        
        if (!newRecords[exerciseName] || weight > newRecords[exerciseName]) {
          newRecords[exerciseName] = weight;
          hasNewRecord = true;
        }
      }
    });

    if (hasNewRecord) {
      savePersonalRecords(newRecords);
      Alert.alert('🎉 New Personal Record!', 'You crushed it today!');
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const updateExercise = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const removeExercise = (index) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const saveWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    const validExercises = exercises.filter(ex => ex.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const newWorkout = {
      id: Date.now(),
      type: 'gym',
      name: workoutName,
      exercises: validExercises,
      notes: workoutNotes,
      date: new Date().toISOString(),
    };

    updatePersonalRecords(validExercises);
    saveWorkouts([newWorkout, ...workouts]);
    
    setWorkoutName('');
    setWorkoutNotes('');
    setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
    setShowAddWorkout(false);
    Alert.alert('Success', 'Workout saved!');
  };

  const calculatePace = (distance, time) => {
    const parts = time.split(':').map(Number);
    let totalMinutes;
    
    if (parts.length === 2) {
      totalMinutes = parts[0] + parts[1] / 60;
    } else if (parts.length === 3) {
      totalMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
    } else {
      return null;
    }

    const paceMinutes = totalMinutes / parseFloat(distance);
    const mins = Math.floor(paceMinutes);
    const secs = Math.round((paceMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveRun = () => {
    if (!runDistance || !runTime) {
      Alert.alert('Error', 'Please enter distance and time');
      return;
    }

    const pace = calculatePace(runDistance, runTime);

    const newRun = {
      id: Date.now(),
      type: 'run',
      distance: parseFloat(runDistance),
      time: runTime,
      pace: pace,
      calories: runCalories ? parseFloat(runCalories) : null,
      date: new Date().toISOString(),
    };

    saveWorkouts([newRun, ...workouts]);
    setRunDistance('');
    setRunTime('');
    setRunCalories('');
    setShowAddRun(false);
    Alert.alert('Success', 'Run saved!');
  };

  const saveBodyWeight = () => {
    if (!currentWeight) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }

    const newWeightEntry = {
      id: Date.now(),
      weight: parseFloat(currentWeight),
      date: new Date().toISOString(),
    };

    saveBodyWeights([newWeightEntry, ...bodyWeights]);
    setCurrentWeight('');
    setShowAddWeight(false);
    Alert.alert('Success', 'Weight logged!');
  };

  const deleteWorkout = (id) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newWorkouts = workouts.filter(w => w.id !== id);
            saveWorkouts(newWorkouts);
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTimerDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (seconds) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(parseInt(customTimerInput) || 90);
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    const weekRuns = weekWorkouts.filter(w => w.type === 'run');
    const weekGym = weekWorkouts.filter(w => w.type === 'gym');
    
    const totalDistance = weekRuns.reduce((sum, r) => sum + r.distance, 0);
    const totalVolume = weekGym.reduce((sum, w) => sum + calculateTotalVolume(w), 0);
    
    return {
      totalWorkouts: weekWorkouts.length,
      gymSessions: weekGym.length,
      runs: weekRuns.length,
      totalDistance: totalDistance.toFixed(1),
      totalVolume: Math.round(totalVolume),
    };
  };

  const getWorkoutStreak = () => {
    if (workouts.length === 0) return 0;

    const sortedDates = workouts
      .map(w => new Date(w.date).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0;
    }

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
      if (sortedDates[i] === expectedDate) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Calendar functions
  const getCurrentMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    
    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getWorkoutsForDate = (date) => {
    if (!date) return [];
    const dateString = date.toDateString();
    return workouts.filter(w => new Date(w.date).toDateString() === dateString);
  };

  const hasWorkoutOnDate = (date) => {
    if (!date) return false;
    return getWorkoutsForDate(date).length > 0;
  };

  const renderHome = () => {
    const weeklyStats = getWeeklyStats();
    const streak = getWorkoutStreak();
    const latestWeight = bodyWeights.length > 0 ? bodyWeights[0].weight : null;
    const monthlyVolume = getMonthlyVolume();

    return (
      <View style={styles.container}>
        <Text style={styles.header}>Fitness Tracker Pro</Text>
        
        {streak > 0 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>🔥 {streak} Day Streak!</Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{workouts.length}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{weeklyStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{weeklyStats.totalVolume > 999 ? `${(weeklyStats.totalVolume/1000).toFixed(1)}k` : weeklyStats.totalVolume}</Text>
            <Text style={styles.statLabel}>lbs This Week</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{monthlyVolume > 999 ? `${(monthlyVolume/1000).toFixed(1)}k` : monthlyVolume}</Text>
            <Text style={styles.statLabel}>lbs This Month</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{latestWeight || '--'}</Text>
            <Text style={styles.statLabel}>Current Weight</Text>
          </View>
        </View>

        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setShowAddWorkout(true)}
          >
            <Text style={styles.buttonIcon}>💪</Text>
            <Text style={styles.buttonText}>Log Workout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => setShowTemplates(true)}
          >
            <Text style={styles.buttonIcon}>📋</Text>
            <Text style={styles.buttonText}>Templates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => setShowAddRun(true)}
          >
            <Text style={styles.buttonIcon}>🏃</Text>
            <Text style={styles.buttonText}>Log Run</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowTimer(true)}
          >
            <Text style={styles.buttonIcon}>⏱️</Text>
            <Text style={styles.buttonText}>Rest Timer</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <ScrollView style={styles.workoutList}>
          {workouts.length === 0 ? (
            <Text style={styles.emptyText}>No workouts yet. Start tracking!</Text>
          ) : (
            workouts.slice(0, 5).map(workout => {
              const volume = calculateTotalVolume(workout);
              return (
                <View key={workout.id} style={styles.workoutCard}>
                  {workout.type === 'gym' ? (
                    <>
                      <View style={styles.workoutCardHeader}>
                        <Text style={styles.workoutTitle}>{workout.name}</Text>
                        <Text style={styles.volumeBadge}>{volume.toLocaleString()} lbs</Text>
                      </View>
                      <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                      <Text style={styles.exerciseCount}>{workout.exercises.length} exercises</Text>
                      {workout.notes && (
                        <Text style={styles.workoutNotes}>📝 {workout.notes}</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.workoutTitle}>🏃 Treadmill Run</Text>
                      <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                      <Text style={styles.runStats}>
                        {workout.distance} miles • {workout.time}
                        {workout.pace && ` • ${workout.pace}/mi`}
                      </Text>
                    </>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderCalendar = () => {
    const days = getCurrentMonthDays();
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Calendar</Text>
        <Text style={styles.monthName}>{monthName}</Text>

        <View style={styles.calendarHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.calendarDay} />;
            }

            const hasWorkout = hasWorkoutOnDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  hasWorkout && styles.calendarDayWithWorkout,
                  isToday && styles.calendarDayToday,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.calendarDayText,
                  hasWorkout && styles.calendarDayTextWithWorkout,
                  isToday && styles.calendarDayTextToday,
                ]}>
                  {day.getDate()}
                </Text>
                {hasWorkout && <View style={styles.workoutDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && (
          <View style={styles.selectedDateWorkouts}>
            <Text style={styles.selectedDateTitle}>
              {formatDate(selectedDate.toISOString())}
            </Text>
            {dayWorkouts.length === 0 ? (
              <Text style={styles.emptyText}>No workouts on this day</Text>
            ) : (
              dayWorkouts.map(workout => (
                <View key={workout.id} style={styles.workoutCard}>
                  {workout.type === 'gym' ? (
                    <>
                      <Text style={styles.workoutTitle}>{workout.name}</Text>
                      <Text style={styles.volumeBadge}>
                        Volume: {calculateTotalVolume(workout).toLocaleString()} lbs
                      </Text>
                      {workout.exercises.map((ex, idx) => (
                        <Text key={idx} style={styles.exerciseDetail}>
                          • {ex.name}: {ex.sets}×{ex.reps} @ {ex.weight}lbs
                        </Text>
                      ))}
                    </>
                  ) : (
                    <>
                      <Text style={styles.workoutTitle}>🏃 Run</Text>
                      <Text style={styles.runStats}>
                        {workout.distance} miles • {workout.time} • {workout.pace}/mi
                      </Text>
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStats = () => {
    const weeklyStats = getWeeklyStats();
    const topRecords = Object.entries(personalRecords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const monthlyVolume = getMonthlyVolume();

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Stats & Progress</Text>

        {/* Volume Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>💪 Volume Lifted</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>This Week: {weeklyStats.totalVolume.toLocaleString()} lbs</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>This Month: {monthlyVolume.toLocaleString()} lbs</Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>📅 This Week</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Total Workouts: {weeklyStats.totalWorkouts}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Gym Sessions: {weeklyStats.gymSessions}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Runs: {weeklyStats.runs}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Total Distance: {weeklyStats.totalDistance} mi</Text>
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>🏆 Personal Records</Text>
          {topRecords.length === 0 ? (
            <Text style={styles.emptyText}>No records yet. Start lifting!</Text>
          ) : (
            topRecords.map(([exercise, weight], index) => (
              <View key={exercise} style={styles.recordRow}>
                <Text style={styles.recordExercise}>
                  {index + 1}. {exercise.charAt(0).toUpperCase() + exercise.slice(1)}
                </Text>
                <Text style={styles.recordWeight}>{weight} lbs</Text>
              </View>
            ))
          )}
        </View>

        {/* Body Weight Chart */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>⚖️ Body Weight Progress</Text>
          {bodyWeights.length === 0 ? (
            <Text style={styles.emptyText}>No weight entries yet</Text>
          ) : (
            <>
              <View style={styles.weightChart}>
                {bodyWeights.slice(0, 10).reverse().map((entry, index) => {
                  const maxWeight = Math.max(...bodyWeights.map(w => w.weight));
                  const minWeight = Math.min(...bodyWeights.map(w => w.weight));
                  const range = maxWeight - minWeight || 1;
                  const heightPercent = ((entry.weight - minWeight) / range) * 60 + 20;
                  
                  return (
                    <View key={entry.id} style={styles.barContainer}>
                      <View 
                        style={[
                          styles.weightBar, 
                          { height: `${heightPercent}%` }
                        ]} 
                      />
                      <Text style={styles.barLabel}>{entry.weight}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.chartFooter}>
                Latest: {bodyWeights[0].weight} lbs
                {bodyWeights.length > 1 && (
                  <Text style={bodyWeights[0].weight < bodyWeights[1].weight ? styles.weightDown : styles.weightUp}>
                    {' '}({bodyWeights[0].weight >= bodyWeights[1].weight ? '+' : ''}
                    {(bodyWeights[0].weight - bodyWeights[1].weight).toFixed(1)})
                  </Text>
                )}
              </Text>
            </>
          )}
          <TouchableOpacity
            style={styles.addWeightButton}
            onPress={() => setShowAddWeight(true)}
          >
            <Text style={styles.addWeightText}>+ Log Weight</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderHistory = () => (
    <View style={styles.container}>
      <Text style={styles.header}>Workout History</Text>
      <ScrollView style={styles.fullList}>
        {workouts.length === 0 ? (
          <Text style={styles.emptyText}>No workouts yet</Text>
        ) : (
          workouts.map(workout => {
            const volume = calculateTotalVolume(workout);
            return (
              <TouchableOpacity
                key={workout.id}
                style={styles.historyCard}
                onLongPress={() => deleteWorkout(workout.id)}
              >
                {workout.type === 'gym' ? (
                  <>
                    <View style={styles.historyHeader}>
                      <Text style={styles.workoutTitle}>{workout.name}</Text>
                      <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                    </View>
                    <Text style={styles.volumeBadge}>Volume: {volume.toLocaleString()} lbs</Text>
                    {workout.exercises.map((ex, idx) => {
                      const isRecord = personalRecords[ex.name?.toLowerCase()] === parseFloat(ex.weight);
                      return (
                        <Text key={idx} style={styles.exerciseDetail}>
                          • {ex.name}: {ex.sets} sets × {ex.reps} reps
                          {ex.weight ? ` @ ${ex.weight} lbs` : ''}
                          {isRecord && ' 🏆'}
                        </Text>
                      );
                    })}
                    {workout.notes && (
                      <Text style={styles.workoutNotes}>📝 {workout.notes}</Text>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.historyHeader}>
                      <Text style={styles.workoutTitle}>🏃 Treadmill Run</Text>
                      <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                    </View>
                    <Text style={styles.runStats}>Distance: {workout.distance} miles</Text>
                    <Text style={styles.runStats}>Time: {workout.time}</Text>
                    {workout.pace && (
                      <Text style={styles.runStats}>Pace: {workout.pace}/mi</Text>
                    )}
                  </>
                )}
                <Text style={styles.deleteHint}>Long press to delete</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {activeTab === 'home' && renderHome()}
      {activeTab === 'calendar' && renderCalendar()}
      {activeTab === 'stats' && renderStats()}
      {activeTab === 'history' && renderHistory()}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Templates Modal */}
      <Modal visible={showTemplates} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Workout Templates</Text>
            
            <ScrollView style={styles.templateList}>
              <Text style={styles.templateCategory}>Pre-loaded Templates</Text>
              {Object.keys(PRESET_TEMPLATES).map(name => (
                <TouchableOpacity
                  key={name}
                  style={styles.templateItem}
                  onPress={() => loadTemplate(name)}
                >
                  <Text style={styles.templateName}>{name}</Text>
                  <Text style={styles.templateInfo}>{PRESET_TEMPLATES[name].length} exercises</Text>
                </TouchableOpacity>
              ))}

              {Object.keys(customTemplates).length > 0 && (
                <>
                  <Text style={styles.templateCategory}>My Custom Templates</Text>
                  {Object.keys(customTemplates).map(name => (
                    <TouchableOpacity
                      key={name}
                      style={styles.templateItem}
                      onPress={() => loadTemplate(name)}
                      onLongPress={() => deleteTemplate(name)}
                    >
                      <Text style={styles.templateName}>{name}</Text>
                      <Text style={styles.templateInfo}>
                        {customTemplates[name].length} exercises • Long press to delete
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTemplates(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rest Timer Modal */}
      <Modal visible={showTimer} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.timerModal}>
            <Text style={styles.modalTitle}>Rest Timer</Text>
            
            <Text style={styles.timerDisplay}>{formatTimerDisplay(timerSeconds)}</Text>
            
            {!isTimerRunning && (
              <View style={styles.timerPresets}>
                <TouchableOpacity style={styles.presetButton} onPress={() => startTimer(60)}>
                  <Text style={styles.presetText}>1:00</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetButton} onPress={() => startTimer(90)}>
                  <Text style={styles.presetText}>1:30</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetButton} onPress={() => startTimer(120)}>
                  <Text style={styles.presetText}>2:00</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetButton} onPress={() => startTimer(180)}>
                  <Text style={styles.presetText}>3:00</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isTimerRunning && (
              <View style={styles.customTimerRow}>
                <TextInput
                  style={styles.timerInput}
                  placeholder="Seconds"
                  keyboardType="numeric"
                  value={customTimerInput}
                  onChangeText={setCustomTimerInput}
                />
                <TouchableOpacity 
                  style={styles.customTimerButton}
                  onPress={() => startTimer(parseInt(customTimerInput) || 90)}
                >
                  <Text style={styles.customTimerText}>Set</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.timerControls}>
              {isTimerRunning ? (
                <TouchableOpacity style={styles.timerButton} onPress={() => setIsTimerRunning(false)}>
                  <Text style={styles.timerButtonText}>⏸ Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.timerButton} onPress={() => setIsTimerRunning(true)}>
                  <Text style={styles.timerButtonText}>▶️ Start</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.timerButton, styles.resetButton]} onPress={resetTimer}>
                <Text style={styles.timerButtonText}>🔄 Reset</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeTimerButton}
              onPress={() => setShowTimer(false)}
            >
              <Text style={styles.closeTimerText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Workout Modal */}
      <Modal visible={showAddWorkout} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Workout Name (e.g., Chest Day)"
              value={workoutName}
              onChangeText={setWorkoutName}
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              multiline
            />

            <ScrollView style={styles.exerciseScroll}>
              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Exercise Name"
                    value={exercise.name}
                    onChangeText={(text) => updateExercise(index, 'name', text)}
                  />
                  <View style={styles.exerciseRow}>
                    <TextInput
                      style={[styles.input, styles.smallInput]}
                      placeholder="Sets"
                      keyboardType="numeric"
                      value={exercise.sets}
                      onChangeText={(text) => updateExercise(index, 'sets', text)}
                    />
                    <TextInput
                      style={[styles.input, styles.smallInput]}
                      placeholder="Reps"
                      keyboardType="numeric"
                      value={exercise.reps}
                      onChangeText={(text) => updateExercise(index, 'reps', text)}
                    />
                    <TextInput
                      style={[styles.input, styles.smallInput]}
                      placeholder="Weight"
                      keyboardType="numeric"
                      value={exercise.weight}
                      onChangeText={(text) => updateExercise(index, 'weight', text)}
                    />
                  </View>
                  {exercises.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeExercise(index)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
              <Text style={styles.addExerciseText}>+ Add Exercise</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveTemplateButton]}
                onPress={() => setShowSaveTemplate(true)}
              >
                <Text style={styles.saveTemplateButtonText}>Save as Template</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddWorkout(false);
                  setWorkoutName('');
                  setWorkoutNotes('');
                  setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveWorkout}
              >
                <Text style={styles.saveButtonText}>Save Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Template Modal */}
      <Modal visible={showSaveTemplate} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModal}>
            <Text style={styles.modalTitle}>Save as Template</Text>
            <TextInput
              style={styles.input}
              placeholder="Template Name"
              value={templateName}
              onChangeText={setTemplateName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSaveTemplate(false);
                  setTemplateName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveAsTemplate}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Run Modal */}
      <Modal visible={showAddRun} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Run</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Distance (miles)"
              keyboardType="decimal-pad"
              value={runDistance}
              onChangeText={setRunDistance}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Time (MM:SS or HH:MM:SS)"
              value={runTime}
              onChangeText={setRunTime}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Calories (optional)"
              keyboardType="numeric"
              value={runCalories}
              onChangeText={setRunCalories}
            />

            {runDistance && runTime && (
              <Text style={styles.pacePreview}>
                Pace: {calculatePace(runDistance, runTime) || 'Invalid format'} /mile
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddRun(false);
                  setRunDistance('');
                  setRunTime('');
                  setRunCalories('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveRun}
              >
                <Text style={styles.saveButtonText}>Save Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Body Weight Modal */}
      <Modal visible={showAddWeight} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Body Weight</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Weight (lbs)"
              keyboardType="decimal-pad"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddWeight(false);
                  setCurrentWeight('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveBodyWeight}
              >
                <Text style={styles.saveButtonText}>Save Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  streakBanner: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  streakText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  workoutList: {
    flex: 1,
  },
  fullList: {
    flex: 1,
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volumeBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  historyCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
  },
  exerciseCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  workoutNotes: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
    fontStyle: 'italic',
  },
  runStats: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  deleteHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
  // Calendar styles
  monthName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayLabel: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  calendarDayWithWorkout: {
    backgroundColor: '#e8f5e9',
  },
  calendarDayToday: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#4CAF50',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextWithWorkout: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  calendarDayTextToday: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  workoutDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    marginTop: 2,
  },
  selectedDateWorkouts: {
    marginTop: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  // Stats styles
  statsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsText: {
    fontSize: 16,
    color: '#555',
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordExercise: {
    fontSize: 16,
    color: '#333',
  },
  recordWeight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  weightChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    marginVertical: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  weightBar: {
    width: 20,
    backgroundColor: '#9C27B0',
    borderRadius: 5,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  chartFooter: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  weightDown: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  weightUp: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  addWeightButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    alignItems: 'center',
  },
  addWeightText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  smallModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  timerModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  // Template styles
  templateList: {
    maxHeight: 400,
  },
  templateCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  templateItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  templateInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  closeButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  // Timer styles
  timerDisplay: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FF9800',
    marginVertical: 30,
  },
  timerPresets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  presetButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  customTimerRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  timerInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 10,
  },
  customTimerButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  customTimerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  timerButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#666',
  },
  timerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeTimerButton: {
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  closeTimerText: {
    color: '#666',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  pacePreview: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  exerciseScroll: {
    maxHeight: 300,
  },
  exerciseForm: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallInput: {
    flex: 1,
    marginHorizontal: 2,
  },
  removeButton: {
    marginTop: 5,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#f44336',
    fontSize: 14,
  },
  addExerciseButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginVertical: 10,
  },
  addExerciseText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveTemplateButton: {
    backgroundColor: '#9C27B0',
  },
  saveTemplateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
