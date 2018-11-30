import React from "react"
import PropTypes from "prop-types"

export default class KongLayout extends React.Component {

  static propTypes = {
    errSelectors: PropTypes.object.isRequired,
    errActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired
  }

  render() {
    let {specSelectors, getComponent} = this.props

    let SvgAssets = getComponent("SvgAssets")
    let InfoContainer = getComponent("InfoContainer", true)
    let VersionPragmaFilter = getComponent("VersionPragmaFilter")
    let KongOperations = getComponent("KongOperations", true)

    let Errors = getComponent("errors", true)

    const ServersContainer = getComponent("ServersContainer", true)
    const SchemesContainer = getComponent("SchemesContainer", true)
    const AuthorizeBtnContainer = getComponent("AuthorizeBtnContainer", true)
    const FilterContainer = getComponent("FilterContainer", true)
    let isSwagger2 = specSelectors.isSwagger2()
    let isOAS3 = specSelectors.isOAS3()

    const isSpecEmpty = !specSelectors.specStr()

    if(isSpecEmpty) {
      let loadingMessage
      let isLoading = specSelectors.loadingStatus() === "loading"
      if(isLoading) {
        loadingMessage = <div className="loading"></div>
      } else {
        loadingMessage = <h4>No API definition provided.</h4>
      }

      return <div className="swagger-ui">
        <div className="loading-container">
          {loadingMessage}
        </div>
      </div>
    }

    const servers = specSelectors.servers()
    const schemes = specSelectors.schemes()

    const hasServers = servers && servers.size
    const hasSchemes = schemes && schemes.size
    const hasSecurityDefinitions = !!specSelectors.securityDefinitions()

    return (
      <div>
        <div className="side-panel"></div>
        <div className="wrapper">
          <SvgAssets />
          <VersionPragmaFilter isSwagger2={isSwagger2} isOAS3={isOAS3} alsoShow={<Errors/>}>
            <div className="col">
              <Errors/>

              <div className="information-container">
                {hasSecurityDefinitions ? (<div><AuthorizeBtnContainer /></div>) : null}

                <InfoContainer/>

                {hasServers || hasSchemes || hasSecurityDefinitions ? (
                  <div className="scheme-container">
                    <div className="col">
                      {hasServers ? (<ServersContainer />) : null}
                      {hasSchemes ? (<SchemesContainer />) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <FilterContainer/>

            </div>
            <KongOperations/>
          </VersionPragmaFilter>
        </div>
      </div>
      )
  }
}