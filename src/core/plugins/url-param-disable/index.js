// workaround for https://github.com/swagger-api/swagger-ui/security/advisories/GHSA-qrmm-w75w-3wpx

function UrlParamDisablePlugin() {
  return {
    statePlugins: {
      spec: {
        wrapActions: {
          // Remove the ?url parameter from loading an external OpenAPI definition.
          updateUrl: (oriAction) => (payload) => {
            const url = new URL(window.location.href)
            if (url.searchParams.has('url')) {
              url.searchParams.delete('url')
              window.location.replace(url.toString())
            }
            return oriAction(payload)
          }
        }
      }
    }
  }
}

export default UrlParamDisablePlugin
