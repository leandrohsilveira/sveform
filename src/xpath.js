/**
 * @template [T=any]
 * @typedef {[string, T][]} Entries
 */

/**
 * Function to split a JSON Object XPath string by "." and by bracket index access, returning an array of fields.
 *
 * @param {string} path the JSON Object XPath
 * @returns {(string | number)[]} an array of fields
 */
export function splitXPath(path) {
  return path
    .split('.')
    .reduce(
      (acc, field) => [...acc, getFieldName(field), ...getFieldIndexes(field)],
      /** @type {(string | number)[]} */ ([]),
    )
}

/**
 * Gets an field name from a path index expression
 *
 * @param {string} index the path index expression such `roles[0]` and `profile["nickname"]`
 * @returns {string} the field name, removing bracket index expressions such `[0]` and `["nickname"]` returning `roles` and `profile`.
 */
function getFieldName(index) {
  return index.replace(/\[.+\]$/, '').trim()
}

/**
 * Gets the bracket indexs expressions from a path index expression
 *
 * @param {string} index the path index expression such `roles[0]["id"]` and `profile["emails"][0]`
 * @returns {(string | number)[]} an array containing all bracket index expressions, removing the field name, returning `[0, "id"]` and `["emails", 0]`
 */
function getFieldIndexes(index) {
  const result = /\[.+\]/.exec(index)
  if (result != null) {
    return result[0]
      .replace(/(\[|\]$)/g, '')
      .split(']')
      .map(val =>
        Number.isNaN(Number(val)) ? val.replace(/(\"|\')/g, '') : +val,
      )
  }
  return []
}

/**
 * Function to transform entries by prefixing its keys with name parameter, preserving it's values.
 *
 * @param {Entries} entries the entries to be transformed
 * @param {string} name the prefix
 * @returns {Entries} the transformed entries
 */
function transformInnerNames(entries, name) {
  return entries.map(([innedName, innerValue]) => [
    concatNames(name, innedName),
    innerValue,
  ])
}

/**
 * Safely concatenate index names by preventing invalid expressions such `prop[name].[innerName]` safely resulting in `prop[name][innerName]`
 *
 * @param {string} name the property name
 * @param {string} innerName the name to be concatenated
 * @returns {string} the concatenated result
 */
function concatNames(name, innerName) {
  return `${name}.${innerName}`.replace(/\.\[/, '[')
}

/**
 * Check if the provied value is not null and is an object or an array
 * @param {unknown} value the value to check
 * @returns {value is ({} | [])} true if is an object or an array
 */
function isObjectOrArray(value) {
  return value !== null && typeof value === 'object'
}

/**
 * Creates a new object for a given string index
 *
 * @overload
 * @param {string} index a string index (of a object)
 * @returns {{}} returns a new object, empty
 *//**
 * Creates a new array for a given number index
 * @overload
 * @param {number} index a number index (of a array)
 * @returns {[]} returns a new array, empty
 *//**
 * @overload
 * @param {string | number} index
 * @returns {{} | []}
 *//**
 * @param {string | number} index
 * @returns {{} | []}
 */
function createObjectOnIndex(index) {
  return typeof index === 'string' ? {} : []
}

/**
 * @param {(string | number)[]} indexes an array of indexes of XPath
 * @returns {string} the XPath string for given array of indexes
 */
export function parseIndexesToString(indexes) {
  return indexes
    .map(index => (typeof index === 'number' ? `[${index}]` : index))
    .join('.')
    .replace(/\.\[/, '[')
}

/**
 * Returns the parent path of given xpath
 * @param {string} xpath the path
 * @returns {string} the parent path of given xpath
 */
export function getParentXPath(xpath) {
  const paths = splitXPath(xpath)
  paths.pop()
  return parseIndexesToString(paths)
}

/**
 * Find the value of a attribute of a object, finding it by a xpath expression.
 *
 * @param {object} object the object to search for the attribute value from given xpath param
 * @param {string} xpath the JSON Object XPath to find the attribute value from given object param
 * @returns the attribute value on given xpath on given object
 */
export function findAttribute(object, xpath) {
  const fields = splitXPath(xpath)
  return fields.reduce((curr, index) => {
    if (curr !== null && curr !== undefined) {
      return curr[index]
    }
    return curr
  }, object)
}

/**
 * Flatten non objects/arrays will cause to return undefined
 * @overload
 * @param {string | number | boolean | URL | Date | undefined} value when it is not an object
 * @returns {undefined} returns undefined
 */

/**
 * Flatten objects return an array of entries which its key is the attribute xpath and the value is the value at xpath
 *
 * @overload
 * @param {object} value the object value
 * @returns {Entries} an array of entries which its key is the attribute xpath and the value is the value at xpath
 */

/**
 * @param {object | string | number | boolean | URL | Date | undefined} value
 * @return {Entries | undefined}
 */
export function flattenObjectPaths(value) {
  if (isObjectOrArray(value)) {
    if (Array.isArray(value)) {
      return value.reduce((entries, item, index) => {
        if (isObjectOrArray(item)) {
          const nestedEntries = flattenObjectPaths(item)
          return [
            ...entries,
            ...transformInnerNames(nestedEntries, `[${index}]`),
          ]
        }
        return [...entries, [`[${index}]`, item]]
      }, [])
    } else {
      return Object.entries(value).reduce((entries, [name, value]) => {
        if (isObjectOrArray(value)) {
          const nestedEntries = flattenObjectPaths(value)
          return [...entries, ...transformInnerNames(nestedEntries, name)]
        }
        return [...entries, [name, value]]
      }, /** @type {Entries} */ ([]))
    }
  }
  return undefined
}

/**
 * Updates the value of an object's or array's attribute at a given xpath
 *
 * @param {any} obj the object to be modified
 * @param {string} xpath the xpath to assign the new value
 * @param {any} value the new value
 */
export function updateObjectValueAtPath(obj, xpath, value) {
  const indexes = splitXPath(xpath)
  if (indexes.length > 0) {
    let context =
      obj !== null && obj !== undefined ? obj : createObjectOnIndex(indexes[0])
    for (let i = 0; i < indexes.length - 1; i++) {
      if (!(indexes[i] in context))
        context[indexes[i]] = createObjectOnIndex(indexes[i + 1])
      context = context[indexes[i]]
    }
    const lastIndex = indexes.pop()
    if (lastIndex !== undefined) context[lastIndex] = value
  }
}
