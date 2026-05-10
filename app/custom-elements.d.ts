declare namespace JSX {
  interface IntrinsicElements {
    "svg-icon": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      class?: string;
      src?: string;
    };
  }
}
