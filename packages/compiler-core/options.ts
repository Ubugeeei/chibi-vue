export interface ParserOptions {
  /**
   * @default ['{{', '}}']
   */
  delimiters?: [string, string];

  decodeEntities?: (rawText: string, asAttr: boolean) => string;
}
