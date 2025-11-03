export class HttpValidationError extends Error {
  public constructor(public readonly details: string[]) {
    super('入力値が不正です。');
  }
}

export default HttpValidationError;
