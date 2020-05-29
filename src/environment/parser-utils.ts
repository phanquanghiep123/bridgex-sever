import { isBoolean } from "util";

export class ParserUtils {
  /**
   * Parses boolean values from the lower element of ary. The lower index number has priority.
   * Return defaultValue if specified array does not contains "true" or "false".
   * @param defaultValue Return this value if any boolean value is not assigned
   * @param ary Parse the elements of this array as boolean.
   * @returns The assigned value
   */
  public static assignBoolean(defaultValue: boolean, ...ary: Array<string | boolean | undefined>): boolean {
    const rtn = ary.reduce((pre, val) => {
      if (pre !== undefined) {
        return pre;
      }

      return !/(^false$)|(^true$)/i.test(`${val}`) ? undefined : /^true$/i.test(`${val}`);
    }, undefined);

    return isBoolean(rtn) ? rtn : defaultValue;
  }
}
