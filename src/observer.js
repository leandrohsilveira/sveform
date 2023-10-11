/**
 * @template T
 * @overload
 * @param {T} defaultValue the default value of the observable
 * @param {boolean} [notifyNewObserver=true]
 * @returns {Sveform.Observable<T>} the observable
 *//**
 * @template T
 * @overload
 * @returns {Sveform.Observable<T | undefined>} the observable
 *//**
 * @template T
 * @overload
 * @param {T} [defaultValue] the default value of the observable
 * @param {boolean} [notifyNewObserver=true]
 * @returns {Sveform.Observable<T | undefined> | Sveform.Observable<T>}
 *//**
 * @template T
 * @param {T} [defaultValue]
 * @param {boolean} [notifyNewObserver=true]
 * @returns {Sveform.Observable<T | undefined> | Sveform.Observable<T>}
 */
export function createObservable(defaultValue, notifyNewObserver = true) {
  let value = defaultValue

  /**
   * The observers
   * @type {Sveform.ObserverRef<T | undefined>[]}
   */
  let observers = []

  /**
   * Notify all observers informing the previous value
   * @param {T | undefined} previousValue the previous value
   */
  function notify(previousValue) {
    observers.forEach(ref => {
      ref.observer(value, previousValue)
    })
  }

  return {
    /**
     *
     * @returns true if this observable has observers
     */
    hasObservers() {
      return observers.length > 0
    },

    /**
     * Gets the latest set value
     * @returns {T | undefined}
     */
    get() {
      return value
    },

    /**
     * Sets a new value and notify observers
     * @param {T} newValue the new value
     */
    set(newValue) {
      const previous = value
      value = newValue
      notify(previous)
    },

    /**
     * Just notify all observers of current value, so the previous value will be equal to current value
     */
    notify() {
      notify(value)
    },

    /**
     *
     * @param {Sveform.Observer<T | undefined>} observer the observer function
     * @param {Sveform.UnsubscribeListener<T | undefined>} [unsubscribeListener] a listener that will be called when this observer gets unsubscribed
     * @returns {Sveform.Unsubscriber} the unsubscriber function
     */
    subscribe(observer, unsubscribeListener) {
      /**
       * @type {Sveform.ObserverRef<T | undefined>}
       */
      const ref = {
        observer,
        unsubscribe() {
          observers = observers.filter(item => item !== ref)
          unsubscribeListener?.(observer)
        },
      }

      observers = [...observers, ref]

      if (notifyNewObserver) ref.observer(value, undefined)

      return () => ref.unsubscribe()
    },

    /**
     * Remove all observers from notify list
     */
    close() {
      ;[...observers].forEach(ref => ref.unsubscribe())
    },
  }
}

/**
 * @template T
 * @param {Sveform.Observer<T>} changeObserver the observer that will be called only when the value is not equal the previous value
 * @return {Sveform.Observer<T>} the observer that filters notifications where there's no change
 */
export function onChange(changeObserver) {
  return (newValue, previousValue) => {
    if (newValue !== previousValue) changeObserver(newValue, previousValue)
  }
}
