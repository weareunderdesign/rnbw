export type SettingsFormProps = {
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  setAttributes: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
};
export type SettingsViewProps = {
  attributes: Attribute;
  setAttributes: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
};
export type Attribute = Record<string, string>;
