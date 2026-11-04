/** API が HTTP ステータス付きで返すべきエラー。それ以外の例外は 500 として扱う。 */
export class AppError extends Error {
  constructor(
    public readonly status: 401 | 404 | 422 | 500,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}
