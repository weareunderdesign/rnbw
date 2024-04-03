export type SettingsFormProps = {
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  setAttributes: React.Dispatch<
    React.SetStateAction<{
      [key: string]: Record<string, string>;
    }>
  >;
};
export type SettingsViewProps = {
  attributes: Attribute;
  setAttributes: React.Dispatch<
    React.SetStateAction<{
      [key: string]: Record<string, string>;
    }>
  >;
};
export type Attribute = Record<string, Record<string, string>>;
