import React, { PureComponent, Component } from "react"
import PropTypes from "prop-types"
import { List, fromJS } from "immutable"
import cx from "classnames"
import ImPropTypes from "react-immutable-proptypes"
import DebounceInput from "react-debounce-input"
import { stringify } from "core/utils"
//import "less/json-schema-form"

const noop = ()=> {}
const JsonSchemaPropShape = {
  getComponent: PropTypes.func.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onTextInputBlur: PropTypes.func,
  keyName: PropTypes.any,
  fn: PropTypes.object.isRequired,
  schema: PropTypes.object,
  errors: ImPropTypes.list,
  errorsDescribedById: PropTypes.string,
  required: PropTypes.bool,
  dispatchInitialValue: PropTypes.bool,
  description: PropTypes.any,
  disabled: PropTypes.bool,
}

const JsonSchemaDefaultProps = {
  value: "",
  onChange: noop,
  onTextInputBlur: noop,
  schema: {},
  keyName: "",
  required: false,
  errors: List()
}

export class JsonSchemaForm extends Component {

  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps

  componentDidMount() {
    const { dispatchInitialValue, value, onChange } = this.props
    if(dispatchInitialValue) {
      onChange(value)
    }
  }

  render() {
    let { schema, errors, errorsDescribedById, value, onChange, getComponent, fn, disabled } = this.props
    const format = schema && schema.get ? schema.get("format") : null
    const type = schema && schema.get ? schema.get("type") : null

    let getComponentSilently = (name) => getComponent(name, false, { failSilently: true })
    let Comp = type ? format ?
      getComponentSilently(`JsonSchema_${type}_${format}`) :
      getComponentSilently(`JsonSchema_${type}`) :
      getComponent("JsonSchema_string")
    if (!Comp) {
      Comp = getComponent("JsonSchema_string")
    }
    return <Comp { ...this.props } errors={errors} errorsDescribedById={errorsDescribedById} fn={fn} getComponent={getComponent} value={value} onChange={onChange} schema={schema} disabled={disabled}/>
  }
}

export class JsonSchema_string extends Component {
  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps
  onChange = (e) => {
    const value = this.props.schema && this.props.schema.get("type") === "file" ? e.target.files[0] : e.target.value
    this.props.onChange(value, this.props.keyName)
  }
  onEnumChange = (val) => this.props.onChange(val)
  render() {
    let { getComponent, value, schema, errors, errorsDescribedById, required, description, disabled } = this.props
    const enumValue = schema && schema.get ? schema.get("enum") : null
    const format = schema && schema.get ? schema.get("format") : null
    const type = schema && schema.get ? schema.get("type") : null
    const schemaIn = schema && schema.get ? schema.get("in") : null
    if (!value) {
      value = "" // value should not be null; this fixes a Debounce error
    }
    errors = errors.toJS ? errors.toJS() : []

    const ariaProps = errors.length
      ? { "aria-invalid": "true", "aria-describedby": errorsDescribedById }
      : { "aria-invalid": "false" }

    if ( enumValue ) {
      const Select = getComponent("Select")
      return (<Select className={ errors.length ? "invalid" : ""}
                      title={ errors.length ? errors : ""}
                      allowedValues={ enumValue }
                      value={ value }
                      description={ description }
                      allowEmptyValue={ !required }
                      disabled={disabled}
                      onChange={ this.onEnumChange }
                      { ...ariaProps } />)
    }

    const isDisabled = disabled || (schemaIn && schemaIn === "formData" && !("FormData" in window))
    const Input = getComponent("Input")
    if (type && type === "file") {
      return (
        <Input type="file"
          {...ariaProps}
          className={errors.length ? "invalid" : ""}
          title={errors.length ? errors : ""}
          onChange={this.onChange}
          disabled={isDisabled} />
      )
    }
    else {
      return (
        <DebounceInput
          type={format && format === "password" ? "password" : "text"}
          className={errors.length ? "invalid" : ""}
          title={errors.length ? errors : ""}
          aria-label={description}
          {...ariaProps}
          value={value}
          minLength={0}
          debounceTimeout={350}
          placeholder={description}
          onBlur={this.props.onTextInputBlur}
          onChange={this.onChange}
          disabled={isDisabled} />
      )
    }
  }
}

export class JsonSchema_array extends PureComponent {

  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps

  constructor(props, context) {
    super(props, context)
    this.state = { value: valueOrEmptyList(props.value) }
  }

  componentWillReceiveProps(props) {
    if(props.value !== this.state.value)
      this.setState({ value: props.value })
  }

  onChange = () => {
    this.props.onChange(this.state.value)
  }

  onItemChange = (itemVal, i) => {
    this.setState(({ value }) => ({
      value: value.set(i, itemVal)
    }), this.onChange)
  }

  removeItem = (i) => {
    this.setState(({ value }) => ({
      value: value.delete(i)
    }), this.onChange)
  }

  addItem = () => {
    let newValue = valueOrEmptyList(this.state.value)
    this.setState(() => ({
      value: newValue.push("")
    }), this.onChange)
  }

  onEnumChange = (value) => {
    this.setState(() => ({
      value: value
    }), this.onChange)
  }

  render() {
    let { getComponent, required, schema, errors, errorsDescribedById, fn, disabled, description } = this.props

    errors = errors.toJS ? errors.toJS() : Array.isArray(errors) ? errors : []

    const value = this.state.value // expect Im List
    const shouldRenderValue =
      value && value.count && value.count() > 0 ? true : false
    const schemaItemsEnum = schema.getIn(["items", "enum"])
    const schemaItemsType = schema.getIn(["items", "type"])
    const schemaItemsFormat = schema.getIn(["items", "format"])
    const schemaItemsSchema = schema.getIn(["items", "schema"])
    let ArrayItemsComponent
    let isArrayItemText = false
    let isArrayItemFile = (schemaItemsType === "file" || (schemaItemsType === "string" && schemaItemsFormat === "binary")) ? true : false
    if (schemaItemsType && schemaItemsFormat) {
      ArrayItemsComponent = getComponent(`JsonSchema_${schemaItemsType}_${schemaItemsFormat}`)
    } else if (schemaItemsType === "boolean" || schemaItemsType === "array" || schemaItemsType === "object") {
      ArrayItemsComponent = getComponent(`JsonSchema_${schemaItemsType}`)
    }
    // if ArrayItemsComponent not assigned or does not exist,
    // use default schemaItemsType === "string" & JsonSchemaArrayItemText component
    if (!ArrayItemsComponent && !isArrayItemFile) {
      isArrayItemText = true
    }

    if ( schemaItemsEnum ) {
      const Select = getComponent("Select")
      const ariaProps = errors.length
        ? { "aria-invalid": "true", "aria-describedby": errorsDescribedById }
        : { "aria-invalid": "false" }
      return (<Select className={ errors.length ? "invalid" : ""}
                      title={ errors.length ? errors : ""}
                      multiple={ true }
                      value={ value }
                      description={ description }
                      disabled={disabled}
                      allowedValues={ schemaItemsEnum }
                      allowEmptyValue={ !required }
                      onChange={ this.onEnumChange }
                      { ...ariaProps } />)
    }

    const Button = getComponent("Button")
    return (
      <div className="json-schema-array">
        {shouldRenderValue ?
          (value.map((item, i) => {
            const itemErrors = fromJS([
              ...errors.filter((err) => err.index === i)
              .map(e => String(e.error))
            ])
            return (
              <div key={i} className="json-schema-form-item">
                {
                  isArrayItemFile ?
                    <JsonSchemaArrayItemFile
                    value={item}
                    onChange={(val)=> this.onItemChange(val, i)}
                    disabled={disabled}
                    errors={itemErrors}
                    errorsDescribedById={ errorsDescribedById }
                    description={`${description} #${i}`}
                    getComponent={getComponent}
                    />
                    : isArrayItemText ?
                      <JsonSchemaArrayItemText
                        value={item}
                        onChange={(val) => this.onItemChange(val, i)}
                        onTextInputBlur={this.props.onTextInputBlur}
                        description={`${description} #${i}`}
                        disabled={disabled}
                        errors={itemErrors}
                        errorsDescribedById={ errorsDescribedById }
                      />
                      : <ArrayItemsComponent {...this.props}
                        value={item}
                        onChange={(val) => this.onItemChange(val, i)}
                        disabled={disabled}
                        errors={itemErrors}
                        errorsDescribedById={ errorsDescribedById }
                        schema={schemaItemsSchema}
                        getComponent={getComponent}
                        fn={fn}
                      />
                }
                {!disabled ? (
                  <Button
                    className="btn btn-sm json-schema-form-item-remove"
                    onClick={() => this.removeItem(i)}
                  > - </Button>
                ) : null}
              </div>
            )
          })
          ) : null
        }
        {!disabled ? (
          <Button
            className={`btn btn-sm json-schema-form-item-add ${errors.length ? "invalid" : null}`}
            onClick={this.addItem}
          >
            Add item
          </Button>
        ) : null}
      </div>
    )
  }
}

export class JsonSchemaArrayItemText extends Component {
  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps

  onChange = (e) => {
    const value = e.target.value
    this.props.onChange(value, this.props.keyName)
  }

  render() {
    let { value, errors, errorsDescribedById, description, disabled } = this.props
    if (!value) {
      value = "" // value should not be null
    }
    errors = errors.toJS ? errors.toJS() : []
    const ariaProps = errors.length
      ? { "aria-invalid": "true", "aria-describedby": errorsDescribedById }
      : { "aria-invalid": "false" }

    return (<DebounceInput
      type={"text"}
      className={errors.length ? "invalid" : ""}
      title={errors.length ? errors : ""}
      value={value}
      minLength={0}
      debounceTimeout={350}
      aria-label={description}
      placeholder={description}
      onBlur={this.props.onTextInputBlur}
      onChange={this.onChange}
      disabled={disabled}
      { ...ariaProps } />)
  }
}

export class JsonSchemaArrayItemFile extends Component {
  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps

  onFileChange = (e) => {
    const value = e.target.files[0]
    this.props.onChange(value, this.props.keyName)
  }

  render() {
    let { getComponent, errors, errorsDescribedById, disabled, description } = this.props
    const ariaProps = errors.length
      ? { "aria-invalid": "true", "aria-describedby": errorsDescribedById }
      : { "aria-invalid": "false" }

    const Input = getComponent("Input")
    const isDisabled = disabled || !("FormData" in window)

    return (<Input type="file"
      className={errors.length ? "invalid" : ""}
      title={errors.length ? errors : ""}
      aria-label={description}
      onChange={this.onFileChange}
      disabled={isDisabled}
      { ...ariaProps } />)
  }
}

export class JsonSchema_boolean extends Component {
  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps

  onEnumChange = (val) => this.props.onChange(val)
  render() {
    let { getComponent, value, errors, errorsDescribedById, schema, required, disabled, description } = this.props
    errors = errors.toJS ? errors.toJS() : []
    const ariaProps = errors.length
      ? { "aria-invalid": "true", "aria-describedby": errorsDescribedById }
      : { "aria-invalid": "false" }
    let enumValue = schema && schema.get ? schema.get("enum") : null
    if (!enumValue) {
      // in case schema.get() also returns undefined/null
      enumValue = fromJS(["true", "false"])
    }
    const Select = getComponent("Select")

    return (<Select className={ errors.length ? "invalid" : ""}
                    title={ errors.length ? errors : ""}
                    value={ String(value) }
                    description={ description }
                    disabled={ disabled }
                    allowedValues={ enumValue }
                    allowEmptyValue={ !required }
                    onChange={ this.onEnumChange }
                    { ...ariaProps } />)
  }
}

export class JsonSchema_object extends PureComponent {
  constructor() {
    super()
  }

  static propTypes = JsonSchemaPropShape
  static defaultProps = JsonSchemaDefaultProps

  onChange = (value) => {
    this.props.onChange(value)
  }

  handleOnChange = e => {
    const inputValue = e.target.value

    this.onChange(inputValue)
  }

  render() {
    let {
      getComponent,
      value,
      errors,
      errorsDescribedById,
      disabled
    } = this.props

    const TextArea = getComponent("TextArea")
    const ariaProps = errors.size
      ? { "aria-invalid": "true", "aria-describedby": errorsDescribedById }
      : { "aria-invalid": "false" }

    return (
      <div>
        <TextArea
          { ...ariaProps }
          className={cx({ invalid: errors.size })}
          title={ errors.size ? errors.join(", ") : ""}
          value={stringify(value)}
          disabled={disabled}
          onChange={ this.handleOnChange }/>
      </div>
    )

  }
}

function valueOrEmptyList(value) {
  return List.isList(value) ? value : List()
}
