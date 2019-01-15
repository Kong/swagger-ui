import React from "react"
import PropTypes from "prop-types"
import Im from "immutable"
import YAML from "yaml-js"
import swagger2har from "swagger2har"

const SWAGGER2_OPERATION_METHODS = [
  "get", "put", "post", "delete", "options", "head", "patch"
]

const OAS3_OPERATION_METHODS = SWAGGER2_OPERATION_METHODS.concat(["trace"])


export default class Operations extends React.Component {

  static propTypes = {
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
    authSelectors: PropTypes.object.isRequired,
    getConfigs: PropTypes.func.isRequired,
    fn: PropTypes.func.isRequired
  };

  render() {
    let {
      specSelectors,
      oas3Selectors,
      getComponent,
      layoutSelectors,
      layoutActions,
      getConfigs,
      fn
    } = this.props

    let taggedOps = specSelectors.taggedOperations()

    const OperationContainer = getComponent("OperationContainer", true)
    const OperationTag = getComponent("OperationTag")
    const specStr = specSelectors.specStr()

    // TODO: update this to handle schemes as well as servers
    const selectedServer = oas3Selectors.selectedServer()

    let parsedSpec
    let hars
    let harsKeyed = {}

    try {
      parsedSpec = YAML.load(specStr)
    } catch (yamlError) {
      try {
        parsedSpec = JSON.parse(specStr)
      } catch (jsonError) {
        parsedSpec = null
      }
    }

    if(parsedSpec) {
      try {
        hars = swagger2har(parsedSpec, selectedServer)
      } catch (error) {
        console.trace(error)
      }
    }

    if (hars != undefined) {
      hars.forEach(har => {
        harsKeyed[`${har.path}-${har.method.toLowerCase()}`] = har
      })
    } else {
      harsKeyed = null
    }

    let {
      maxDisplayedTags,
    } = getConfigs()

    let filter = layoutSelectors.currentFilter()

    if (filter) {
      if (filter !== true) {
        taggedOps = fn.opsFilter(taggedOps, filter)
      }
    }

    if (maxDisplayedTags && !isNaN(maxDisplayedTags) && maxDisplayedTags >= 0) {
      taggedOps = taggedOps.slice(0, maxDisplayedTags)
    }

    return (
      <div className="operations-container">
        {
          taggedOps.map( (tagObj, tag) => {
            const operations = tagObj.get("operations")
            return (
              <OperationTag
                key={"operation-" + tag}
                tagObj={tagObj}
                tag={tag}
                layoutSelectors={layoutSelectors}
                layoutActions={layoutActions}
                getConfigs={getConfigs}
                getComponent={getComponent}>
                {
                  operations.map( op => {
                    const path = op.get("path")
                    const method = op.get("method")
                    const specPath = Im.List(["paths", path, method])


                    // FIXME: (someday) this logic should probably be in a selector,
                    // but doing so would require further opening up
                    // selectors to the plugin system, to allow for dynamic
                    // overriding of low-level selectors that other selectors
                    // rely on. --KS, 12/17
                    const validMethods = specSelectors.isOAS3() ?
                          OAS3_OPERATION_METHODS : SWAGGER2_OPERATION_METHODS

                    if(validMethods.indexOf(method) === -1) {
                      return null
                    }

                    return <OperationContainer
                               har={harsKeyed[`${path}-${method}`].har || null}
                               key={`${path}-${method}`}
                               specPath={specPath}
                               op={op}
                               path={path}
                               method={method}
                               tag={tag}
                               />
                  }).toArray()
                }


              </OperationTag>
            )
          }).toArray()
        }

        { taggedOps.size < 1 ? <h3> No operations defined in spec! </h3> : null }
      </div>
    )
  }

}

Operations.propTypes = {
  layoutActions: PropTypes.object.isRequired,
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  fn: PropTypes.object.isRequired
}
