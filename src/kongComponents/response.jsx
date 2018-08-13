import React from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import cx from "classnames"
import { fromJS, Seq, Iterable, List, Map } from "immutable"
import { getSampleSchema, fromJSOrdered, stringify } from "core/utils"

import ModelExample from "./model-example"

const getExampleComponent = ( sampleResponse, examples, HighlightCode ) => {
  if ( examples && examples.size ) {
    return examples.entrySeq().map( ([ key, example ]) => {
      let exampleValue = stringify(example)

      return (<div key={ key }>
        <h5>{ key }</h5>
        <HighlightCode className="example code-block" value={ exampleValue } />
      </div>)
    }).toArray()
  }

  if ( sampleResponse ) { return <div>
      <HighlightCode className="example code-block" value={ sampleResponse } />
    </div>
  }
  return null
}


export default class Response extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      responseContentType: ""
    }
  }

  static propTypes = {
    code: PropTypes.string.isRequired,
    response: PropTypes.instanceOf(Iterable),
    className: PropTypes.string,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    fn: PropTypes.object.isRequired,
    contentType: PropTypes.string,
    controlsAcceptHeader: PropTypes.bool,
    onContentTypeChange: PropTypes.func
  }

  static defaultProps = {
    response: fromJS({}),
    onContentTypeChange: () => { }
  };

  _onContentTypeChange = (value) => {
    const { onContentTypeChange, controlsAcceptHeader } = this.props
    this.setState({ responseContentType: value })
    onContentTypeChange({
      value: value,
      controlsAcceptHeader
    })
  }

  render() {
    let {
      code,
      response,
      className,
      fn,
      getComponent,
      getConfigs,
      specSelectors,
      contentType,
      controlsAcceptHeader
    } = this.props

    let { inferSchema } = fn
    let { isOAS3 } = specSelectors

    let headers = response.get("headers")
    let examples = response.get("examples")
    let links = response.get("links")
    const Headers = getComponent("headers")
    const HighlightCode = getComponent("highlightCode")
    // const ModelExample = getComponent("modelExample")
    const Markdown = getComponent("Markdown")
    const OperationLink = getComponent("operationLink")
    const ContentType = getComponent("contentType")

    var sampleResponse
    var sampleSchema
    var schema, specPathWithPossibleSchema

     const activeContentType = this.state.responseContentType || contentType

    if(isOAS3()) {
      const mediaType = response.getIn(["content", activeContentType], Map({}))
      const oas3SchemaForContentType = mediaType.get("schema", Map({}))

      if(mediaType.get("example") !== undefined) {
        sampleSchema = stringify(mediaType.get("example"))
      } else {
        sampleSchema = getSampleSchema(oas3SchemaForContentType.toJS(), this.state.responseContentType, {
          includeReadOnly: true
        })
      }
      sampleResponse = oas3SchemaForContentType ? sampleSchema : null
      schema = oas3SchemaForContentType ? inferSchema(oas3SchemaForContentType.toJS()) : null
      specPathWithPossibleSchema = oas3SchemaForContentType ? List(["content", this.state.responseContentType, "schema"]) : specPath
    } else {
      schema = inferSchema(response.toJS()) // TODO: don't convert back and forth. Lets just stick with immutable for inferSchema
      specPathWithPossibleSchema = response.has("schema") ? specPath.push("schema") : specPath
      sampleResponse = schema ? getSampleSchema(schema, activeContentType, {
        includeReadOnly: true,
        includeWriteOnly: true // writeOnly has no filtering effect in swagger 2.0
       }) : null
    }

    if(examples) {
      examples = examples.map(example => {
        // Remove unwanted properties from examples
        return example.set ? example.set("$$ref", undefined) : example
      })
    }

    let example = getExampleComponent( sampleResponse, examples, HighlightCode )

    return (
      <div className={"response " + (className || "")}>
        <div className="response-col_description">
          <div className="response-item response-code">
            {code} &nbsp;&ndash;&nbsp; <Markdown source={response.get("description")} />
          </div>

          {example ? (
            <div className="response-item">
              <ModelExample
                getComponent={getComponent}
                getConfigs={getConfigs}
                specSelectors={specSelectors}
                schema={fromJSOrdered(schema)}
                example={example} />
            </div>
          ) : null}

          {headers ? (
            <div className="response-item">
              <Headers
                headers={headers}
                getComponent={getComponent}
              />
            </div>
          ) : null}

        </div>
      </div>
    )
  }
}
