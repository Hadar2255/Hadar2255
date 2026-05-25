import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import LessonRunner from '../../../src/components/LessonRunner';
import { LESSON_BY_ID } from '../../../src/data/lessons';

export default function LessonPlay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = id ? LESSON_BY_ID[id] : undefined;
  if (!lesson) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Lesson not found</Text>
      </View>
    );
  }
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <LessonRunner lesson={lesson} />
    </SafeAreaView>
  );
}
