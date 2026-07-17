const ID_PREFIX_PATTERN = /^[a-z][a-z0-9-]*$/;

export type RandomIdFactory = () => string;

export const createEntityId = (prefix: string, randomId: RandomIdFactory): string => {
  if (!ID_PREFIX_PATTERN.test(prefix)) {
    throw new Error(`Invalid id prefix: ${prefix}`);
  }

  const compactRandomId = randomId().replaceAll("-", "").toLowerCase();

  if (compactRandomId.length === 0) {
    throw new Error("Random id factory returned an empty value.");
  }

  return `${prefix}_${compactRandomId}`;
};
