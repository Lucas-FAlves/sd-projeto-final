export function unmarshal<T>(data: Buffer): T {
  try {
    return JSON.parse(data.toString()) as T;
  } catch (error) {
    throw new Error(`Failed to unmarshal data: ${(error as Error).message}`);
  }
}
