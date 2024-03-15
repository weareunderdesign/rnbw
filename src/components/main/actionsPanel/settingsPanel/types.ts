export type SettingsFormProps = {
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  setAttributes: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
};
export type SettingsViewProps = {
  attributes: Record<string, string>;
  setAttributes: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
};
