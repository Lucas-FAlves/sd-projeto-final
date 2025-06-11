export function marshal<T>(data: T): Buffer {
  try {
    return Buffer.from(JSON.stringify(data));
  } catch (error) {
    throw new Error(`Failed to marshal data: ${(error as Error).message}`);
  }
}
