import React from "react"
import { fromJS, Iterable } from "immutable"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import { defaultStatusCode, getAcceptControllingResponse } from "core/utils"
import { CodeSnippetWidget } from 'react-apiembed'

export default class Responses extends React.Component {
  static propTypes = {
    har: PropTypes.object,
    tryItOutResponse: PropTypes.instanceOf(Iterable),
    responses: PropTypes.instanceOf(Iterable).isRequired,
    produces: PropTypes.instanceOf(Iterable),
    producesValue: PropTypes.any,
    displayRequestDuration: PropTypes.bool.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    specPath: ImPropTypes.list.isRequired,
    fn: PropTypes.object.isRequired
  }

  static defaultProps = {
    tryItOutResponse: null,
    produces: fromJS(["application/json"]),
    displayRequestDuration: false
  }

  shouldComponentUpdate(nextProps) {
    // BUG: props.tryItOutResponse is always coming back as a new Immutable instance
    let render = this.props.tryItOutResponse !== nextProps.tryItOutResponse
      || this.props.responses !== nextProps.responses
      || this.props.produces !== nextProps.produces
      || this.props.producesValue !== nextProps.producesValue
      || this.props.displayRequestDuration !== nextProps.displayRequestDuration
      || this.props.path !== nextProps.path
      || this.props.method !== nextProps.method
      || this.props.har !== nextProps.har
    return render
  }

	onChangeProducesWrapper = ( val ) => this.props.specActions.changeProducesValue([this.props.path, this.props.method], val)

  onResponseContentTypeChange = ({ controlsAcceptHeader, value }) => {
    const { oas3Actions, path, method } = this.props
    if(controlsAcceptHeader) {
      oas3Actions.setResponseContentType({
        value,
        path,
        method
      })
    }
  }

  render() {
    let {
      har,
      responses,
      tryItOutResponse,
      getComponent,
      getConfigs,
      specSelectors,
      fn,
      producesValue,
      displayRequestDuration,
      specPath,
    } = this.props
    let defaultCode = defaultStatusCode( responses )

    const ContentType = getComponent( "contentType" )
    const KongLiveResponse = getComponent( "KongLiveResponse" )
    const KongResponse = getComponent( "KongResponse" )

    let produces = this.props.produces && this.props.produces.size ? this.props.produces : Responses.defaultProps.produces

    const isSpecOAS3 = specSelectors.isOAS3()

    const acceptControllingResponse = isSpecOAS3 ?
      getAcceptControllingResponse(responses) : null

    const snippets = getConfigs().kong.languages

      return (
      <div className="responses-wrapper">
          {
            !tryItOutResponse ? null
              : <div>
                  <KongLiveResponse response={ tryItOutResponse }
                    getComponent={ getComponent }
                    getConfigs={ getConfigs }
                    specSelectors={ specSelectors }
                    path={ this.props.path }
                    method={ this.props.method }
                    displayRequestDuration={ displayRequestDuration } />
                  <h4>Responses</h4>
                </div>
          }
        {
            <div className="opblock-section-header light">
            <h4>Example Request</h4>
          </div>
        }
        {
          <CodeSnippetWidget har={har} snippets={snippets} />
        }
        <div className="opblock-section-header light">
          <h4>Responses</h4>
          {isSpecOAS3 ? null :
            <ContentType value={producesValue}
              onChange={this.onChangeProducesWrapper}
              contentTypes={produces}
              className="execute-content-type" />
          }
        </div>
        <div className="responses-inner">
          <div className="responses-table">
            {
              responses.entrySeq().map( ([code, response]) => {

                let className = tryItOutResponse && tryItOutResponse.get("status") == code ? "response_current" : ""
                return (
                  <KongResponse key={ code }
                    specPath={specPath.push(code)}
                    isDefault={defaultCode === code}
                    fn={fn}
                    className={ className }
                    code={ code }
                    response={ response }
                    specSelectors={ specSelectors }
                    controlsAcceptHeader={response === acceptControllingResponse}
                    onContentTypeChange={this.onResponseContentTypeChange}
                    contentType={ producesValue }
                    getConfigs={ getConfigs }
                    getComponent={ getComponent }/>
                )
              }).toArray()
            }
          </div>
        </div>
      </div>
    )
  }
}
