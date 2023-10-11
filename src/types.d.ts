declare namespace Sveform {
  export type HTMLFormInputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  export type ParsingTypes = URL | Date | string | number | boolean | undefined
  export type ValueAcessor = {
    get(): string
    set(value: string): void
  }
  
  export type ParseToModel<T> = (val: T) => string
  export type ParseToArrayModel<T> = (
    val: T,
    index: number,
  ) => string
  
  export type ParseModelFrom<T> = (val: string) => T
  export type ParseArrayModelFrom<T> = (
    val: string,
    index: number,
  ) => T
  
  export type Model<T> = {
    control?: (acessor: ValueAcessor) => void
    validate?: ValidatorFunction
    to: ParseToModel<T>
    from: ParseModelFrom<T>
  }
  
  export type ArrayModel<T extends Array<ParsingTypes>> = {
    control?: (control: HTMLInputElement | RadioNodeList) => void
    validate?: ArrayValidatorFunction
    to: ParseToArrayModel<T[number]>
    from: ParseArrayModelFrom<T[number]>
  }
  
  export type ToModel<T> = {
    [K in keyof T]?: T[K] extends ParsingTypes
      ? (val: T[K]) => string
      : T[K] extends Array<ParsingTypes>
      ? (val: T[K][number], index: number) => string
      : T[K] extends Array<unknown>
      ? ToArrayModel<T[K][number]>
      : ToModel<T[K]>
  }
  
  export type ToArrayModel<T> = {
    [K in keyof T]?: T[K] extends ParsingTypes
      ? (val: T[K], index: number) => string
      : T[K] extends Array<ParsingTypes>
      ? (val: T[K][number], index: number) => string
      : T[K] extends Array<unknown>
      ? ToArrayModel<T[K][number]>
      : ToModel<T[K]>
  }
  
  export type ModelFrom<T> = {
    [K in keyof T]?: T[K] extends ParsingTypes
      ? (val: string) => T[K]
      : T[K] extends Array<ParsingTypes>
      ? (val: string, index: number) => T[K][number]
      : T[K] extends Array<unknown>
      ? ArrayModelFrom<T[K][number]>
      : ModelFrom<T[K]>
  }
  
  export type ArrayModelFrom<T> = {
    [K in keyof T]?: T[K] extends ParsingTypes
      ? (val: string, index: number) => T[K]
      : T[K] extends Array<ParsingTypes>
      ? (val: string, index: number) => T[K][number]
      : T[K] extends Array<unknown>
      ? ArrayModelFrom<T[K][number]>
      : ModelFrom<T[K]>
  }
  
  export type ModelObjectArray<T extends Array<unknown>> = {
    validate?: GlobalValidatorFunction<T>,
    properties?: ModelProperties<T[number]>
  }
  
  export type ModelObject<T> = {
    validate?: GlobalValidatorFunction<T>,
    properties?: ModelProperties<T>
  }
  
  export type ModelProperties<T> = {
    [K in keyof T]?: T[K] extends ParsingTypes
      ? Model<T[K]>
      : T[K] extends Array<ParsingTypes>
      ? ArrayModel<T[K]>
      : T[K] extends Array<unknown>
      ? ModelObjectArray<T[K]>
      : ModelObject<T[K]>
  }
  
  export type ArrayValidatorFunction = (value: string | string[], index: number) => string[]
  export type ValidatorFunction = (value: string | string[]) => string[]
  export type GlobalValidatorFunction<T> = (value: T) => string[]
  export type Unsubscriber = () => void
  export type UnsubscribeListener<T> = (observer: Observer<T>) => void
  export type Observer<T> = (newValue: T, previousValue: T) => void
  export type ObserverRef<T> = {
    observer: Observer<T>
    unsubscribe: Unsubscriber
  }
  export type Observable<T> = {
    /**
     *
     * @returns true if this observable has observers
     */
    hasObservers(): boolean
  
    /**
     * Gets the latest set value
     */
    get(): T
  
    /**
     * Sets a new value and notify observers
     * @param newValue the new value
     */
    set(newValue: T): void
  
    /**
     * Just notify all observers of current value, so the previous value will be equal to current value
     */
    notify(): void
  
    /**
     *
     * @param {Observer<T>} observer the observer function
     * @param [unsubscribeListener] a listener that will be called when this observer gets unsubscribed
     * @returns the unsubscriber function
     */
    subscribe(
      observer: Observer<T>,
      unsubscribeListener?: UnsubscribeListener,
    ): Unsubscriber
  
    /**
     * Remove all observers from notify list
     */
    close(): void
  }
  
  export type ArrayObjectErrors<T extends Array<unknown>> = {
    errors: string[]
    items: Errors<T[K][number]>[]
  }
  
  export type Errors<T> = {
    errors: string[]
    properties: {
      [K in keyof T]?: T[K] extends ParsingTypes 
        ? string[]
        : T[K] extends Array<ParsingTypes> 
        ? string[][]
        : T[K] extends Array<unknown>
        ? ArrayObjectErrors<T[K]>
        : Errors<T[K]>
    }
  }
  
  export type ArrayDirtyCtrl<T extends Array<unknown>> = {
    dirty?: boolean
    items: DirtyCtrl<T[K][number]>[]
  }
  
  export type DirtyCtrl<T> = {
    dirty?: boolean
    properties: {
      [K in keyof T]?: T[K] extends ParsingTypes 
        ? boolean
        : T[K] extends Array<ParsingTypes> 
        ? boolean[]
        : T[K] extends Array<unknown>
        ? ArrayDirtyCtrl<T[K]>
        : DirtyCtrl<T[K]>
    }
  }
  
  export type ControlOpts<T> = {
    values: Observable<T>
    model?: ModelObject<T>
    errors?: Observable<Errors<T>>
    dirties?: Observable<DirtyCtrl<T>>
  }
  
  
  export type RequiredModelOptions = { required: true }
  export type OptionalModelOptions = { required?: boolean }
  export type ModelOptions = RequiredModelOptions | OptionalModelOptions
}

