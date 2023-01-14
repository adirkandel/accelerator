export enum DataKeys {
  KEYWORD = 'keyword',
  DIFFICULTY = 'difficulty',
  VOLUME = 'volume',
  PHRASE = 'phrase'
}

export type DataType = {
  id: number
  [DataKeys.KEYWORD]: string,
  [DataKeys.DIFFICULTY]: number,
  [DataKeys.VOLUME]: number,
  [DataKeys.PHRASE]: string
}