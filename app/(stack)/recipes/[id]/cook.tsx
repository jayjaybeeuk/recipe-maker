import React, { useEffect, useRef } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import * as Haptics from 'expo-haptics'
import { useCookingStore } from '@features/cooking/store'
import { useRecipeStore } from '@features/recipes/store'
import { scaleQuantity, formatDuration } from '@shared/utils/servings'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Separator } from '@shared/components/ui/separator'
import { Text } from '@shared/components/ui/text'
import type { TimerState } from '@shared/types'

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const navigation = useNavigation()

  useKeepAwake()

  const {
    session,
    recipe,
    ingredients,
    steps,
    currentStepIndex,
    scaleFactor,
    timers,
    isLoading,
    startSession,
    toggleIngredient,
    toggleStep,
    setServingsOverride,
    setCurrentStep,
    startTimer,
    cancelTimer,
    tickTimers,
    completeSession,
  } = useCookingStore()

  const { selectedRecipe, ingredients: recipeIngredients, steps: recipeSteps, loadRecipeById } =
    useRecipeStore()

  // Hide native header — we use a custom bar
  useEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

  // Load recipe data then start cooking session
  useEffect(() => {
    if (!id) return

    async function init() {
      if (selectedRecipe?.id !== id) {
        await loadRecipeById(id)
      }
      const r = useRecipeStore.getState().selectedRecipe
      const ings = useRecipeStore.getState().ingredients
      const stps = useRecipeStore.getState().steps
      if (r) {
        await startSession(id, r, ings, stps)
      }
    }

    init()
  }, [id])

  // Tick timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      useCookingStore.getState().tickTimers()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Detect timer completions and fire haptics + alert
  const prevTimersRef = useRef<Record<string, TimerState>>({})
  useEffect(() => {
    const prev = prevTimersRef.current
    for (const [stepId, timer] of Object.entries(timers)) {
      const prevTimer = prev[stepId]
      if (prevTimer?.running && !timer.running && timer.remainingSeconds === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        const step = steps.find((s) => s.id === stepId)
        Alert.alert('Timer done', step ? `${step.instruction} is ready!` : 'Your timer is done!')
      }
    }
    prevTimersRef.current = timers
  }, [timers, steps])

  if (isLoading || !session || !recipe) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Loading cooking mode…</Text>
      </View>
    )
  }

  const displayServings = session.servingsOverride ?? recipe.servings ?? 1

  function handleDecrement() {
    const next = Math.max(1, displayServings - 1)
    setServingsOverride(next)
  }

  function handleIncrement() {
    setServingsOverride(displayServings + 1)
  }

  function handleMarkCooked() {
    Alert.alert('Mark as cooked?', 'Mark this recipe as cooked?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark as Cooked',
        onPress: async () => {
          await completeSession()
          router.back()
        },
      },
    ])
  }

  const totalSteps = steps.length

  return (
    <View className="flex-1 bg-white">
      {/* Custom top bar */}
      <View className="flex-row items-center px-4 pt-12 pb-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="min-w-[44px] min-h-[44px] items-center justify-center"
          hitSlop={8}
        >
          <Text className="text-2xl text-brand-500">‹</Text>
        </Pressable>
        <Text variant="h2" numberOfLines={1} className="flex-1 text-center mx-2">
          {recipe.title}
        </Text>
        {totalSteps > 0 && (
          <Text className="text-sm text-gray-500 min-w-[60px] text-right">
            Step {currentStepIndex + 1} of {totalSteps}
          </Text>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        {/* Section 1 — Servings adjuster */}
        <View className="flex-row items-center justify-center gap-4 px-4 py-4 border-b border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onPress={handleDecrement}
            className="min-w-[44px] min-h-[44px]"
          >
            −
          </Button>
          <Text className="text-lg font-semibold text-gray-800">
            {displayServings} {displayServings === 1 ? 'serving' : 'servings'}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onPress={handleIncrement}
            className="min-w-[44px] min-h-[44px]"
          >
            +
          </Button>
        </View>

        {/* Section 2 — Ingredients checklist */}
        <View className="px-4 pt-5 pb-2">
          <Text variant="h2" className="mb-2">
            Ingredients
          </Text>
          <Separator className="mb-3" />
          {ingredients.map((ingredient) => {
            const isChecked = session.checkedIngredientIds.includes(ingredient.id)
            const quantityStr = scaleQuantity(ingredient.quantity, scaleFactor)
            const unitStr = ingredient.unit ?? ''
            const amountLabel = [quantityStr, unitStr].filter(Boolean).join(' ')
            const label = [amountLabel, ingredient.name, ingredient.optional ? '(optional)' : '']
              .filter(Boolean)
              .join(' ')

            return (
              <Pressable
                key={ingredient.id}
                onPress={() => toggleIngredient(ingredient.id)}
                className="flex-row items-center gap-3 min-h-[44px] py-2"
              >
                <Checkbox
                  checked={isChecked}
                  onPress={() => toggleIngredient(ingredient.id)}
                />
                <Text
                  className={`flex-1 text-lg ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Section 3 — Steps */}
        <View className="px-4 pt-5 pb-2">
          <Text variant="h2" className="mb-2">
            Method
          </Text>
          <Separator className="mb-3" />
          {steps.map((step, index) => {
            const isChecked = session.checkedStepIds.includes(step.id)
            const isCurrent = index === currentStepIndex
            const timer = timers[step.id]

            return (
              <Pressable
                key={step.id}
                onPress={() => {
                  setCurrentStep(index)
                  toggleStep(step.id)
                }}
                className={`rounded-xl mb-3 p-3 ${isCurrent ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50'}`}
              >
                <View className="flex-row items-start gap-3">
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Badge variant={isCurrent ? 'default' : 'secondary'}>
                      {index + 1}
                    </Badge>
                    <Checkbox
                      checked={isChecked}
                      onPress={() => toggleStep(step.id)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-2xl leading-8 ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}
                    >
                      {step.instruction}
                    </Text>

                    {/* Timer row */}
                    {step.durationMinutes != null && step.durationMinutes > 0 && (
                      <View className="mt-3">
                        {!timer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => startTimer(step.id, step.durationMinutes!)}
                            className="self-start"
                          >
                            Start timer ({step.durationMinutes}min)
                          </Button>
                        )}
                        {timer?.running && (
                          <View className="flex-row items-center gap-3">
                            <Text className="text-2xl font-mono font-bold text-brand-600">
                              {formatDuration(timer.remainingSeconds)}
                            </Text>
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => cancelTimer(step.id)}
                            >
                              Cancel
                            </Button>
                          </View>
                        )}
                        {timer && !timer.running && (
                          <Text className="text-lg text-green-600 font-semibold">Done ✓</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Section 4 — Navigation and completion */}
        {totalSteps > 1 && (
          <View className="flex-row items-center justify-between px-4 py-3 gap-3">
            <Button
              variant="ghost"
              size="default"
              disabled={currentStepIndex === 0}
              onPress={() => setCurrentStep(Math.max(0, currentStepIndex - 1))}
              className="flex-1"
            >
              ← Previous
            </Button>
            <Button
              variant="ghost"
              size="default"
              disabled={currentStepIndex === totalSteps - 1}
              onPress={() => setCurrentStep(Math.min(totalSteps - 1, currentStepIndex + 1))}
              className="flex-1"
            >
              Next →
            </Button>
          </View>
        )}

        <View className="px-4 pt-4">
          <Button
            variant="default"
            size="lg"
            onPress={handleMarkCooked}
            className="w-full"
          >
            Mark as Cooked
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
