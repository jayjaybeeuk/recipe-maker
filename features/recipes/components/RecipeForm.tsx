import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recipeFormSchema } from '../../../shared/types/schemas'
import type { RecipeFormValues } from '../../../shared/types/schemas'
import { Input } from '../../../shared/components/ui/input'
import { Button } from '../../../shared/components/ui/button'
import { Badge } from '../../../shared/components/ui/badge'
import { Separator } from '../../../shared/components/ui/separator'
import { Checkbox } from '../../../shared/components/ui/checkbox'
import { ImagePickerField } from '../../../shared/components/ImagePickerField'

export interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormValues>
  onSubmit: (values: RecipeFormValues) => Promise<void>
  isSubmitting: boolean
}

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const

export function RecipeForm({ defaultValues, onSubmit, isSubmitting }: RecipeFormProps) {
  const [tagInput, setTagInput] = useState('')

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema) as Resolver<RecipeFormValues>,
    defaultValues: {
      title: '',
      description: '',
      cuisine: '',
      mealType: '',
      difficulty: undefined,
      prepTimeMinutes: undefined,
      cookTimeMinutes: undefined,
      servings: undefined,
      rating: undefined,
      sourceUrl: '',
      notes: '',
      imageUri: undefined,
      ingredients: [{ name: '', quantity: null, unit: null, optional: false }],
      steps: [{ instruction: '', durationMinutes: null }],
      tags: [],
      ...defaultValues,
    },
  })

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    move: moveIngredient,
  } = useFieldArray({ control, name: 'ingredients' })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
  } = useFieldArray({ control, name: 'steps' })

  const tags = watch('tags')

  function addTag() {
    const raw = tagInput.trim()
    if (!raw) return
    const newTags = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && !tags.includes(t))
    if (newTags.length > 0) {
      setValue('tags', [...tags, ...newTags])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setValue('tags', tags.filter((t) => t !== tag))
  }

  type IngredientErrors = Array<{ name?: { message?: string } } | undefined> | undefined

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-6 pb-16">

        {/* Section 1 — Basic info */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-gray-900">Basic Info</Text>

          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input
                label="Title *"
                placeholder="Recipe title"
                autoFocus
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Input
                label="Description"
                placeholder="Short description"
                multiline
                numberOfLines={3}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                className="min-h-[72px]"
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="cuisine"
                render={({ field }) => (
                  <Input
                    label="Cuisine"
                    placeholder="e.g. Italian"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="mealType"
                render={({ field }) => (
                  <Input
                    label="Meal Type"
                    placeholder="e.g. Dinner"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </View>
          </View>

          {/* Difficulty selector */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Difficulty</Text>
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <View className="flex-row gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => field.onChange(field.value === opt ? undefined : opt)}
                      className={`flex-1 py-2 rounded-lg border items-center ${
                        field.value === opt
                          ? 'bg-brand-500 border-brand-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium capitalize ${
                          field.value === opt ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="prepTimeMinutes"
                render={({ field }) => (
                  <Input
                    label="Prep (min)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={field.value?.toString() ?? ''}
                    onChangeText={(t) => field.onChange(t ? parseInt(t, 10) : undefined)}
                    onBlur={field.onBlur}
                    error={errors.prepTimeMinutes?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="cookTimeMinutes"
                render={({ field }) => (
                  <Input
                    label="Cook (min)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={field.value?.toString() ?? ''}
                    onChangeText={(t) => field.onChange(t ? parseInt(t, 10) : undefined)}
                    onBlur={field.onBlur}
                    error={errors.cookTimeMinutes?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="servings"
                render={({ field }) => (
                  <Input
                    label="Servings"
                    placeholder="4"
                    keyboardType="numeric"
                    value={field.value?.toString() ?? ''}
                    onChangeText={(t) => field.onChange(t ? parseInt(t, 10) : undefined)}
                    onBlur={field.onBlur}
                    error={errors.servings?.message}
                  />
                )}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Rating</Text>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => field.onChange(field.value === star ? undefined : star)}
                      className="p-1 min-w-[44px] min-h-[44px] items-center justify-center"
                    >
                      <Text
                        className={`text-2xl ${(field.value ?? 0) >= star ? 'text-brand-500' : 'text-gray-300'}`}
                      >
                        ★
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
            {errors.rating && (
              <Text className="text-sm text-red-500 mt-1">{errors.rating.message}</Text>
            )}
          </View>

          <Controller
            control={control}
            name="sourceUrl"
            render={({ field }) => (
              <Input
                label="Source URL"
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.sourceUrl?.message}
              />
            )}
          />
        </View>

        <Separator />

        {/* Section 2 — Ingredients */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">Ingredients *</Text>
            <Pressable
              onPress={() =>
                appendIngredient({ name: '', quantity: null, unit: null, optional: false })
              }
              className="px-3 py-1.5 bg-brand-100 rounded-lg"
            >
              <Text className="text-brand-700 font-medium text-sm">+ Add</Text>
            </Pressable>
          </View>
          {errors.ingredients && !Array.isArray(errors.ingredients) && (
            <Text className="text-sm text-red-500">{(errors.ingredients as { message?: string }).message}</Text>
          )}

          {ingredientFields.map((field, index) => {
            const ingredientErrors = errors.ingredients as IngredientErrors
            return (
              <View key={field.id} className="gap-2 p-3 bg-gray-50 rounded-xl">
                <View className="flex-row items-start gap-2">
                  <Text className="text-gray-500 text-sm mt-3 w-5">{index + 1}.</Text>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name={`ingredients.${index}.name`}
                      render={({ field: f }) => (
                        <Input
                          placeholder="Ingredient name *"
                          value={f.value}
                          onChangeText={f.onChange}
                          onBlur={f.onBlur}
                          error={ingredientErrors?.[index]?.name?.message}
                        />
                      )}
                    />
                  </View>
                </View>
                <View className="flex-row gap-2 items-center pl-7">
                  <View className="w-20">
                    <Controller
                      control={control}
                      name={`ingredients.${index}.quantity`}
                      render={({ field: f }) => (
                        <Input
                          placeholder="Qty"
                          keyboardType="numeric"
                          value={f.value?.toString() ?? ''}
                          onChangeText={(t) => f.onChange(t ? parseFloat(t) : null)}
                          onBlur={f.onBlur}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name={`ingredients.${index}.unit`}
                      render={({ field: f }) => (
                        <Input
                          placeholder="Unit (g, cups…)"
                          value={f.value ?? ''}
                          onChangeText={(t) => f.onChange(t || null)}
                          onBlur={f.onBlur}
                        />
                      )}
                    />
                  </View>
                  <Controller
                    control={control}
                    name={`ingredients.${index}.optional`}
                    render={({ field: f }) => (
                      <Checkbox
                        checked={f.value}
                        onPress={() => f.onChange(!f.value)}
                        label="Opt"
                      />
                    )}
                  />
                </View>
                <View className="flex-row justify-end gap-2 pl-7">
                  {index > 0 && (
                    <Pressable
                      onPress={() => moveIngredient(index, index - 1)}
                      className="px-3 py-1.5 min-h-[44px] items-center justify-center"
                    >
                      <Text className="text-gray-500 text-sm">↑</Text>
                    </Pressable>
                  )}
                  {index < ingredientFields.length - 1 && (
                    <Pressable
                      onPress={() => moveIngredient(index, index + 1)}
                      className="px-3 py-1.5 min-h-[44px] items-center justify-center"
                    >
                      <Text className="text-gray-500 text-sm">↓</Text>
                    </Pressable>
                  )}
                  {ingredientFields.length > 1 && (
                    <Pressable
                      onPress={() => removeIngredient(index)}
                      className="px-3 py-1.5 min-h-[44px] items-center justify-center"
                    >
                      <Text className="text-red-500 text-sm">Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        <Separator />

        {/* Section 3 — Steps */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">Steps *</Text>
            <Pressable
              onPress={() => appendStep({ instruction: '', durationMinutes: null })}
              className="px-3 py-1.5 bg-brand-100 rounded-lg"
            >
              <Text className="text-brand-700 font-medium text-sm">+ Add</Text>
            </Pressable>
          </View>
          {errors.steps && !Array.isArray(errors.steps) && (
            <Text className="text-sm text-red-500">{(errors.steps as { message?: string }).message}</Text>
          )}

          {stepFields.map((field, index) => {
            type StepErrors = Array<{ instruction?: { message?: string } } | undefined> | undefined
            const stepErrors = errors.steps as StepErrors
            return (
              <View key={field.id} className="gap-2 p-3 bg-gray-50 rounded-xl">
                <View className="flex-row items-start gap-2">
                  <View className="w-6 h-6 bg-brand-500 rounded-full items-center justify-center mt-2.5">
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name={`steps.${index}.instruction`}
                      render={({ field: f }) => (
                        <Input
                          placeholder="Describe this step…"
                          multiline
                          numberOfLines={3}
                          value={f.value}
                          onChangeText={f.onChange}
                          onBlur={f.onBlur}
                          error={stepErrors?.[index]?.instruction?.message}
                          className="min-h-[72px]"
                        />
                      )}
                    />
                  </View>
                </View>
                <View className="flex-row items-center gap-2 pl-8">
                  <View className="w-36">
                    <Controller
                      control={control}
                      name={`steps.${index}.durationMinutes`}
                      render={({ field: f }) => (
                        <Input
                          placeholder="Duration (min)"
                          keyboardType="numeric"
                          value={f.value?.toString() ?? ''}
                          onChangeText={(t) => f.onChange(t ? parseInt(t, 10) : null)}
                          onBlur={f.onBlur}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1 flex-row justify-end gap-1">
                    {index > 0 && (
                      <Pressable
                        onPress={() => moveStep(index, index - 1)}
                        className="px-3 py-1.5 min-h-[44px] items-center justify-center"
                      >
                        <Text className="text-gray-500 text-sm">↑</Text>
                      </Pressable>
                    )}
                    {index < stepFields.length - 1 && (
                      <Pressable
                        onPress={() => moveStep(index, index + 1)}
                        className="px-3 py-1.5 min-h-[44px] items-center justify-center"
                      >
                        <Text className="text-gray-500 text-sm">↓</Text>
                      </Pressable>
                    )}
                    {stepFields.length > 1 && (
                      <Pressable
                        onPress={() => removeStep(index)}
                        className="px-3 py-1.5 min-h-[44px] items-center justify-center"
                      >
                        <Text className="text-red-500 text-sm">Remove</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        <Separator />

        {/* Section 4 — Tags */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-gray-900">Tags</Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="Add tags (comma-separated)"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
                autoCapitalize="none"
              />
            </View>
            <Pressable
              onPress={addTag}
              className="px-4 bg-brand-100 rounded-lg items-center justify-center"
            >
              <Text className="text-brand-700 font-medium">Add</Text>
            </Pressable>
          </View>
          {tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(tag)}
                  className="flex-row items-center gap-1 min-h-[44px]"
                >
                  <Badge variant="secondary">{tag}</Badge>
                  <Text className="text-gray-400 text-xs ml-0.5">✕</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Separator />

        {/* Section 5 — Notes */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-gray-900">Notes</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <Input
                placeholder="Any notes or tips…"
                multiline
                numberOfLines={4}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                className="min-h-[96px]"
              />
            )}
          />
        </View>

        <Separator />

        {/* Section 6 — Image */}
        <Controller
          control={control}
          name="imageUri"
          render={({ field }) => (
            <ImagePickerField value={field.value} onChange={field.onChange} />
          )}
        />

        {/* Submit */}
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          size="lg"
          className="w-full mt-2"
        >
          {isSubmitting ? 'Saving…' : 'Save Recipe'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
