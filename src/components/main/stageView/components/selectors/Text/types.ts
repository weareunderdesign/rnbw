export type TextProps = {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  color?: Record<'r' | 'g' | 'b' | 'a', string>;
  shadow?: number;
  margin?: [string, string, string, string];
};