export type TemplateState = {
  pending: boolean,
  response?: TemplateFetchResponsePayload
}

export type TemplateFetchRequestPayload = {
  param1: any,
  param2?: any,
}

export type TemplateFetchResponsePayload = {
  success: boolean,
  data?: object,
  error?: string,
}