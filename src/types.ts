export type BingoJSON = Array<{
  key: string;
  value: string;
  color: string;
  results: Array<{
    key: string;
    value: string;
    index: number;
  }>;
}>;
