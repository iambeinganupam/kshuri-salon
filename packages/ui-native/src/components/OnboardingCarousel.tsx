// ─────────────────────────────────────────────────────────────────────────────
// OnboardingCarousel — generic 3-4 slide swipeable intro shown to first-time
// users. The route that hosts it is per-app (so slide content can speak the
// audience's language) but the swipe + indicators + footer come from here.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "./Button";
import { Text } from "./Text";

export interface OnboardingSlide {
  /** Stable key (e.g. "discover", "book", "review") */
  key: string;
  /** Lucide icon rendered above the title — keeps assets-free + theme-tinted. */
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface OnboardingCarouselProps {
  slides: OnboardingSlide[];
  /** Called when the user taps "Get started" on the last slide. */
  onFinish: () => void;
  /** Called when the user taps "Skip" on any slide. */
  onSkip?: () => void;
  /** Brand line shown at the top (e.g. "Kshuri · Salon"). */
  brandLabel?: string;
}

export function OnboardingCarousel({
  slides,
  onFinish,
  onSkip,
  brandLabel,
}: OnboardingCarouselProps): React.ReactElement {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const width = Dimensions.get("window").width;

  const goNext = (): void => {
    if (index === slides.length - 1) {
      onFinish();
    } else {
      const next = index + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        {brandLabel ? (
          <Text variant="caption" className="uppercase tracking-widest">
            {brandLabel}
          </Text>
        ) : (
          <View />
        )}
        {onSkip ? (
          <Pressable onPress={onSkip}>
            <Text variant="caption">Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View
              style={{ width }}
              className="items-center justify-center px-8"
            >
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-primary/15">
                <Icon size={48} color="hsl(var(--primary))" />
              </View>
              <Text variant="h2" className="text-center">
                {item.title}
              </Text>
              <Text variant="muted" className="mt-3 text-center">
                {item.body}
              </Text>
            </View>
          );
        }}
      />

      <View className="items-center gap-2 pb-6">
        <View className="flex-row items-center gap-2">
          {slides.map((s, i) => (
            <View
              key={s.key}
              className={`h-1.5 rounded-full ${
                i === index ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </View>
        <View className="w-full px-6 pt-3">
          <Button onPress={goNext} fullWidth>
            {index === slides.length - 1 ? "Get started" : "Next"}
          </Button>
        </View>
      </View>
    </View>
  );
}
