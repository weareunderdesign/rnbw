export const styles = `
[data-theme=light],
html {
  --color-rnbwdev-rainbow-element-background: #ddd;
  --color-rnbwdev-rainbow-element-foreground: #333;
}
[data-theme=dark] {
  --color-rnbwdev-rainbow-element-background: #333;
  --color-rnbwdev-rainbow-element-foreground: #ddd;
}
[rnbwdev-rnbw-element-hover] {
  outline: 1px solid var(--color-rnbwdev-rainbow-element-background);
  outline-offset: -1px;
}
[rnbwdev-rnbw-element-focus] {
  outline: 1px solid var(--color-rnbwdev-rainbow-element-foreground);
  outline-offset: -1px;
}
`