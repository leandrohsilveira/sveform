/**
 * @template T
 * @overload
 * @param {true} required when true
 * @param {Sveform.Model<T | undefined>} model the model that will be wrapped by required model
 * @returns {Sveform.Model<T>} a new model wrapping the provided model with required validation
 *//**
 * @template T
 * @overload
 * @param {boolean | undefined} required when is false or undefined
 * @param {Sveform.Model<T | undefined>} model the model that will be returned, as is
 * @returns {Sveform.Model<T | undefined>} the model as is
 */
import { createFormatter } from './formatter'

/**
 * @template T
 * @param {boolean | undefined} required
 * @param {Sveform.Model<T | undefined>} model
 * @returns {Sveform.Model<T> | Sveform.Model<T | undefined>}
 */
function handleRequired(required, model) {
  if (required) {
    return {
      validate(value) {
        if (value !== undefined && value !== null && value.length > 0) {
          return model?.validate?.(value) ?? []
        }
        return ['required']
      },
      to: model.to,
      from: model.from,
      control: model.control,
    }
  }
  return model
}

/**
 * @typedef {{ minLength?: number, maxLength?: number }} TextModelOptions
 *//**
 * @overload
 * @param {Sveform.RequiredModelOptions & TextModelOptions} options
 * @return {Sveform.Model<string>}
 *//**
 * @overload
 * @param {Sveform.OptionalModelOptions & TextModelOptions} [options]
 * @return {Sveform.Model<string | undefined>}
 *//**
 * @param {Sveform.ModelOptions & TextModelOptions} [options]
 * @return {Sveform.Model<string> | Sveform.Model<string | undefined>}
 */
export function text(options) {
  return handleRequired(options?.required, {
    validate(value) {
      /** @type {string[]} */
      let errors = []
      if (
        typeof options?.minLength === 'number' &&
        (value?.length ?? 0) <= options.minLength
      )
        errors.push('text.minLength')
      if (
        typeof options?.maxLength === 'number' &&
        (value?.length ?? 0) > options.maxLength
      )
        errors.push('text.maxLength')
      return errors
    },
    to(value) {
      return value ?? ''
    },
    from(value) {
      if (value !== '') return value
      return undefined
    },
  })
}

/**
 * @typedef {{ min?: number, max?: number, digits?: number, locale?: string | string[], formatOpts?: Intl.NumberFormatOptions }} NumberModelOptions
 *//**
 * @overload
 * @param {Sveform.RequiredModelOptions & NumberModelOptions} options
 * @return {Sveform.Model<number>}
 *//**
 * @overload
 * @param {Sveform.OptionalModelOptions & NumberModelOptions} [options]
 * @return {Sveform.Model<number | undefined>}
 *//**
 * @param {Sveform.ModelOptions & NumberModelOptions} [options]
 * @return {Sveform.Model<number> | Sveform.Model<number | undefined>}
 */
export function num(options) {
  const formatter = createFormatter(options?.locale, options?.formatOpts)

  function unformat(value) {
    if (value !== '') {
      const negative = value.indexOf('-') >= 0 && value.indexOf('+') < 0
      const absolute = value.replace(/(\-|\+)/g, '')
      const unformatted = formatter.unformat(
        negative ? `-${absolute}` : absolute,
      )
      if (typeof options?.digits === 'number') {
        const raw = unformatted.replace(/[^0-9]/g, '')
        const formatted = (Number(raw) / Math.pow(10, options.digits)).toFixed(
          options.digits,
        )
        return negative ? `-${formatted}` : formatted
      }
      return unformatted
    }
    return ''
  }

  return handleRequired(options?.required, {
    validate(value) {
      let numValue = Number(unformat(value.toString()))

      /** @type {string[]} */
      let errors = []
      if (Number.isNaN(numValue)) errors.push('num.NAN')
      else {
        if (typeof options?.min === 'number' && numValue <= options.min)
          errors.push('num.min')
        if (typeof options?.max === 'number' && numValue > options.max)
          errors.push('num.max')
      }
      console.log('Model<number>.validate', value, numValue, errors)
      return errors
    },
    control(acessor) {
      const rawValue = acessor.get()
      const endsWithDecimal =
        formatter.decimal &&
        rawValue.indexOf(formatter.decimal) === rawValue.length - 1
      const unformatted = unformat(rawValue !== '-' ? rawValue : '')
      const formatted = formatter.format(unformatted)
      acessor.set(
        endsWithDecimal && formatted !== ''
          ? `${formatted}${formatter.decimal}`
          : formatted,
      )
    },
    to(value) {
      if (typeof options?.digits === 'number')
        return formatter.format(value?.toFixed(options.digits))
      return formatter.format(value?.toString())
    },
    from(value) {
      if (value !== '') {
        if (typeof options?.digits === 'number') {
          const unformatted = formatter.unformat(value)
          const negative =
            unformatted.indexOf('-') >= 0 && unformatted.indexOf('+') < 0
          const raw = String(unformatted).replace(/[^0-9]/g, '')
          const formatted = (
            Number(raw) / Math.pow(10, options.digits)
          ).toFixed(options.digits)
          const result = Number(negative ? `-${formatted}` : formatted)
          console.debug(
            'Model<number>.from',
            value,
            unformatted,
            negative,
            raw,
            formatted,
            result,
          )
          return result
        }
        return Number(formatter.unformat(value))
      }
      return undefined
    },
  })
}

/**
 * @overload
 * @param {Sveform.RequiredModelOptions} options
 * @return {Sveform.Model<boolean>}
 *//**
 * @overload
 * @param {Sveform.OptionalModelOptions} [options]
 * @return {Sveform.Model<boolean | undefined>}
 *//**
 * @param {Sveform.ModelOptions} [options]
 * @return {Sveform.Model<boolean> | Sveform.Model<boolean | undefined>}
 */
export function bool(options) {
  return handleRequired(options?.required, {
    to(data) {
      return data !== undefined ? String(data) : ''
    },
    from(input) {
      return input === '' ? undefined : input === 'true'
    },
  })
}
