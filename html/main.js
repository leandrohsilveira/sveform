import './style.css'
import { createControl, createObservable, num } from 'sveform'

/** @typedef {{ name?: string, age?: number, }} User */

const form = document.forms.namedItem('user_form')

if (form) {
  /** @type {Sveform.Observable<User>} */
  const data$ = createObservable({})

  const control = createControl(form, {
    values: data$,
  })

  control.errors.subscribe(errors => {
    setError(form, errors?.properties?.name ?? [], 'name')
    setError(form, errors?.properties?.age ?? [], 'age')
  })

  data$.subscribe(console.log)
}
/**
 *
 * @param {HTMLFormElement} form
 * @param {string[]} errors
 * @param {string} name
 */
function setError(form, errors, name) {
  const input = /** @type {Element} */ (form.elements.namedItem(name))
  const parent = input.parentElement
  if (parent) {
    parent.querySelectorAll('.message').forEach(el => el.remove())
    if (errors.length > 0) {
      parent.classList.add('error')
      errors.forEach(error => {
        const div = document.createElement('div')
        div.classList.add('message')
        const message = document.createTextNode(error)
        div.appendChild(message)
        parent.appendChild(div)
      })
    } else {
      parent.classList.remove('error')
    }
  }
}
