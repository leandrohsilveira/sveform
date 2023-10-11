import { getElementName, getValueAcessor, toInputElement } from './element'
import { bool, num, text } from './model'
import { createObservable, onChange } from './observer'
import {
  findAttribute,
  flattenObjectPaths,
  getParentXPath,
  parseIndexesToString,
  splitXPath,
  updateObjectValueAtPath,
} from './xpath'

/**
 * @typedef
 */

/**
 * @param {string | null | undefined | number} text
 * @returns {number | undefined}
 */
function toNumber(text) {
  return text !== undefined && text !== null && text !== '' && text !== -1
    ? Number(text)
    : undefined
}

/**
 * @param {HTMLInputElement} input
 * @returns {Sveform.Model<any>}
 */
function getModelFromDataset(input) {
  switch (input.dataset.model ?? 'text') {
    case 'num':
      return num({
        required: input.required,
        min: toNumber(input.min),
        max: toNumber(input.max),
        digits: toNumber(input.dataset.digits),
      })
    case 'text':
    default:
      return text({
        required: input.required,
        minLength: toNumber(input.minLength),
        maxLength: toNumber(input.maxLength),
      })
  }
}

/**
 * @template T
 * @param {Sveform.ModelObject<T> | undefined} rootModel the root model object to find the model
 * @param {Node | RadioNodeList | string | undefined} node the input to look for model
 * @returns {Sveform.Model<any>}
 */
function findModel(rootModel, node) {
  /** @type {Sveform.Model<any> | undefined} */
  let model
  const name = getElementName(node)
  const input = toInputElement(node ?? null)

  if (name) {
    const modelPath = parseIndexesToString(
      splitXPath(name)
        .filter(index => typeof index === 'string')
        .map(index => `properties.${index}`),
    )

    model = findAttribute(rootModel, modelPath)
  }

  if (!model) {
    if (input instanceof RadioNodeList) {
      model = text()
    } else if (input instanceof HTMLInputElement) {
      switch (input.type) {
        case 'checkbox':
          model = bool({ required: input.required })
          break
        case 'number':
          model = num({
            required: input.required,
            min: toNumber(input.min),
            max: toNumber(input.max),
          })
          break

        case 'text':
        default:
          model = getModelFromDataset(input)
          break
      }
    } else {
      model = text({ required: input?.required ?? false })
    }
  }
  return model
}

/**
 * @template T
 * @overload
 * @param {Sveform.DirtyCtrl<T>} obj the dirty control object
 * @param {string} xpath the
 * @param {boolean} value the
 * @param {"dirty"} [field]
 * @returns {Sveform.DirtyCtrl<T>}
 *//**
 * @template T
 * @overload
 * @param {Sveform.Errors<T>} obj
 * @param {string} xpath the
 * @param {string[]} value
 * @param {"errors"} [field]
 * @returns {Sveform.Errors<T>}
 *//**
 * @template T
 * @param {Sveform.Errors<T> | Sveform.DirtyCtrl<T>} obj
 * @param {string} xpath the
 * @param {string[] | boolean} value
 * @param {"errors" | "dirty" | undefined} [field]
 * @returns {Sveform.Errors<T> | Sveform.DirtyCtrl<T>}
 */
function updateValueAt(obj, xpath, value, field) {
  let modelPath
  if (field) {
    modelPath = parseIndexesToString([
      ...splitXPath(getParentXPath(xpath)).map(index =>
        typeof index === 'string' ? `properties.${index}` : index,
      ),
      field,
    ])
  } else {
    modelPath = parseIndexesToString(
      splitXPath(xpath).map(index =>
        typeof index === 'string' ? `properties.${index}` : index,
      ),
    )
  }
  const newObj = { ...obj }
  updateObjectValueAtPath(newObj, modelPath, value)
  return newObj
}

/**
 * @param {HTMLFormElement | Sveform.HTMLFormInputElement | RadioNodeList | undefined} element
 * @param {[string, any][]} entries
 */
function findFieldsNames(element, entries) {
  /** @type {Set<string>} */
  const set = new Set()
  const names =
    element instanceof HTMLFormElement
      ? Array.from(element.elements).map(el => getElementName(el))
      : [getElementName(element)]

  names.forEach(name => {
    if (name) set.add(name)
  })
  entries.forEach(([name]) => set.add(name))
  return Array.from(set)
}

/**
 * @template {Record<string, unknown>} T
 * @param {Sveform.HTMLFormInputElement | HTMLFormElement} element the form input element to bind fields
 * @param {Sveform.ControlOpts<T>} options the control options
 */
export function createControl(element, options) {
  /** @type {T | undefined} */
  let currentValue = undefined
  const values$ = options.values
  const rootModel = options.model
  const errors$ =
    options.errors ??
    /** @type {Sveform.Observable<Sveform.Errors<T>>} */ (createObservable({}))
  const dirties$ =
    options.dirties ??
    /** @type {Sveform.Observable<Sveform.DirtyCtrl<T>>} */ (
      createObservable({})
    )

  element.addEventListener('input', handleInput)

  const unsubscribe = values$.subscribe(
    onChange(newValue => {
      if (newValue !== currentValue) {
        const entries = flattenObjectPaths(newValue)
        const names = findFieldsNames(element, entries)
        names.forEach(name => {
          const [, value] = entries.find(([n]) => n === name) ?? []
          let input
          if (element instanceof HTMLFormElement) {
            input = toInputElement(element.elements.namedItem(name))
          } else {
            input = toInputElement(element)
          }
          updateElement(input, name, value)
        })
      }
    }),
  )

  /** @type {MutationObserver | undefined} */
  let observer = undefined

  if (element instanceof HTMLFormElement) {
    let currentElements
    observer = new MutationObserver(() => {
      const elements = Array.from(element.elements)
        .map(el => toInputElement(el))
        .filter(
          el =>
            el?.name &&
            ['SELECT', 'INPUT', 'TEXTAREA'].indexOf(el?.tagName ?? '') >= 0,
        )
      const newElements = elements.filter(
        element =>
          !currentElements.some(currentElement => currentElement === element),
      )
      newElements.forEach(el => {
        if (el !== undefined) {
          const name = getElementName(el)
          const value = findAttribute(values$.get(), name)
          updateElement(el, name, value)
        }
      })
      currentElements = elements
    })
    observer.observe(element, { childList: true })
  }

  /**
   *
   * @param {Event} e
   */
  function handleInput(e) {
    const target = /** @type {Node | RadioNodeList} */ (e.target)
    const input = toInputElement(target)
    if (input) {
      let model = findModel(rootModel, input)
      const name = getElementName(input)
      const acessor = getValueAcessor(input)
      model?.control?.(acessor)
      const errors = model.validate?.(acessor.get()) ?? []
      const value = model.from(acessor.get())
      if (name) {
        if (errors.length === 0) {
          const newValue = /** @type {T} */ ({ ...currentValue } ?? {})

          updateObjectValueAtPath(newValue, name, value)

          currentValue = newValue
          values$.set(currentValue)
        }
        errors$.set(updateValueAt(errors$.get(), name, errors))
        dirties$.set(updateValueAt(dirties$.get(), name, true))
      }
    }
  }

  /**
   *
   * @param {Sveform.HTMLFormInputElement | RadioNodeList | undefined } input
   * @param {string} name
   * @param {*} value
   */
  function updateElement(input, name, value) {
    const model = findModel(rootModel, input ?? name)
    const inputValue = model.to(value)
    const errors = model.validate?.(inputValue) ?? []
    if (input !== undefined) {
      const acessor = getValueAcessor(input)
      acessor.set(inputValue)
    }
    errors$.set(updateValueAt(errors$.get(), name, errors))
  }

  return {
    errors: errors$,
    dirties: dirties$,

    /**
     * a function to be called when the form gets removed from DOM, it will automatically remove all subscribers.
     */
    destroy() {
      element.removeEventListener('input', handleInput)
      unsubscribe()
      observer?.disconnect()
    },
  }
}
