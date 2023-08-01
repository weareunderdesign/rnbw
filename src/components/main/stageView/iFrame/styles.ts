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
[rnbwdev-rnbw-element-select] {
  outline: 1px solid var(--color-rnbwdev-rainbow-element-foreground);
  outline-offset: -1px;
}
[data-rnbwdev-rnbw-node]:empty:not(svg-icon):not(.icon-xs):not(.icon-s):not(.icon-m):not(.icon-l):not(.icon-xl):not([style*="width"]):not([style*="height"]):not(.direction-column):not(.direction-row):not(hr, label, span, br) {
  min-width: 80px;
  min-height: 80px;
}

body {
  min-height: 100vh;
  margin:0px;
}

body > * {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
`;
