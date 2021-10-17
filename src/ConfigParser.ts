const ENUM_SPLIT_REGEX = /[,\s]\s*/;

export class ConfigParser {
  static parseEnum(input: string) {
    return input
      .split(ENUM_SPLIT_REGEX)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  static parseBoolean(input: string) {
    return JSON.parse(input.trim());
  }

  static parseString(input: string) {
    return input;
  }
}
