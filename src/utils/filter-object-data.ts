interface IObject {
  [key: string]: any
}

/**
 * Filters an object by allowing only the specified fields.
 * @param object - The source object to filter.
 * @param allowedFields - The fields to allow in the resulting object.
 * @returns A new object containing only the allowed fields.
 */
export const filterObjectData = <T extends IObject>(
  object: T,
  ...allowedFields: (keyof T)[]
): Partial<T> => {
  const newObject: Partial<T> = {}

  Object.keys(object).forEach((key) => {
    if (allowedFields.includes(key as keyof T)) {
      newObject[key as keyof T] = object[key]
    }
  })

  return newObject
}
