import { Text, type TextProps } from 'react-native';

/** Respects system font size (UX-10). */
export function AppText({ maxFontSizeMultiplier = 2, ...props }: TextProps) {
  return (
    <Text allowFontScaling maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />
  );
}
