/**
 * @overload
 * @param {Node | string} element
 * @returns {string}
 */
/**
 * @overload
 * @param {Node | RadioNodeList | string | undefined} element
 * @returns {string | undefined}
 */
/**
 * @param {Node | RadioNodeList | string | undefined} element
 * @returns {string | undefined}
 */
export function getElementName(element) {
  if (typeof element !== 'string') {
    let name
    if (element instanceof RadioNodeList) {
      const elements = Array.from(element)
      name = elements
        .map(node => toInputElement(node))
        .map(el => el?.name)
        .find(n => n !== undefined)
    } else {
      name = toInputElement(element ?? null)?.name
    }
    return name
  }
  return undefined
}

/**
 * @overload
 * @param {Node | null} element
 * @returns {Sveform.HTMLFormInputElement | undefined}
 *//**
 * @overload
 * @param {Node | RadioNodeList | string | null} element
 * @returns {Sveform.HTMLFormInputElement | RadioNodeList | undefined}
 *//**
 * @param {Node | RadioNodeList | string | null} element
 * @returns {Sveform.HTMLFormInputElement | RadioNodeList | undefined}
 */
export function toInputElement(element) {
  if (element instanceof RadioNodeList) {
    return element
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element
  }
  return undefined
}

/**
 * @param {Sveform.HTMLFormInputElement | RadioNodeList} node
 * @returns {Sveform.ValueAcessor}
 */
export function getValueAcessor(node) {
  return {
    get() {
      if (node instanceof HTMLInputElement && node.type === 'checkbox') {
        return String(node.checked)
      } else {
        return node.value
      }
    },
    set(value) {
      if (node instanceof HTMLInputElement && node.type === 'checkbox') {
        node.checked = value === 'true'
      } else {
        node.value = value
      }
    },
  }
}
