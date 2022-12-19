export const capitalize = (text: string) =>
  text[0].toUpperCase() + text.substr(1, text.length);
export const weightDescription = (weight: number) =>
  weight === 400 ? 'Regular' : weight === 500 ? 'Medium' : 'Bold';
  /*
const style_name = css_name.replace(/[A-Z]/g, c => '-' + c.substr(0).toLowerCase())
*/