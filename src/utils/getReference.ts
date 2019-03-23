export default (str: string): string => str.substring(str.lastIndexOf('<'), str.lastIndexOf('>') + 1);
