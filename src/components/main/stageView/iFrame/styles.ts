export const styles = `
[data-theme=light],
html {
  --color-rnbwdev-rainbow-component-background: #ddd;
  --color-rnbwdev-rainbow-component-foreground: #333;
}

[data-theme=dark] {
  --color-rnbwdev-rainbow-component-background: #333;
  --color-rnbwdev-rainbow-component-foreground: #ddd;
}

[rnbwdev-rnbw-component-hover] {
  outline: 1px dotted var(--color-rnbwdev-rainbow-component-background);
  outline-offset: -1px;
}
[rnbwdev-rnbw-component-focus] {
  outline: 1px solid var(--color-rnbwdev-rainbow-component-foreground);
  outline-offset: -1px;
}
`