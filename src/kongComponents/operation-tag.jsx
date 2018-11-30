import React from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import Im from "immutable"
import { createDeepLinkPath, sanitizeUrl } from "core/utils"

export default class OperationTag extends React.Component {

  static defaultProps = {
    tagObj: Im.fromJS({}),
    tag: "",
  }

  static propTypes = {
    tagObj: ImPropTypes.map.isRequired,
    tag: PropTypes.string.isRequired,

    layoutSelectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,

    getConfigs: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,

    children: PropTypes.element,
  }

  render() {
    const {
      tagObj,
      tag,
      children,

      layoutSelectors,
      getConfigs,
      getComponent,
    } = this.props

    let {
      docExpansion,
      deepLinking,
    } = getConfigs()

    const isDeepLinkingEnabled = deepLinking && deepLinking !== "false"
    const Markdown = getComponent("Markdown")
    const DeepLink = getComponent("DeepLink")
    const Link = getComponent("Link")

    let tagDescription = tagObj.getIn(["tagDetails", "description"], null)
    let tagExternalDocsDescription = tagObj.getIn(["tagDetails", "externalDocs", "description"])
    let tagExternalDocsUrl = tagObj.getIn(["tagDetails", "externalDocs", "url"])

    let isShownKey = ["operations-tag", createDeepLinkPath(tag)]
    let showTag = layoutSelectors.isShown(isShownKey, docExpansion === "full" || docExpansion === "list")

    return (
      <div className={showTag ? "opblock-tag-section is-open" : "opblock-tag-section"} >
        <div className="opblock-details col">
          <h2
            className={!tagDescription ? "opblock-tag no-desc" : "opblock-tag" }
            id={isShownKey.join("-")}>
            <DeepLink
              enabled={isDeepLinkingEnabled}
              isShown={showTag}
              path={tag}
              text={tag} />
          </h2>

          {!tagDescription ? null :
            <Markdown source={tagDescription} />
          }

          { !tagExternalDocsDescription ? null :
           <p className="opblock-ex-description">
              { tagExternalDocsDescription }
              { tagExternalDocsUrl ? ": " : null }
              { tagExternalDocsUrl ?
                <Link
                  href={sanitizeUrl(tagExternalDocsUrl)}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank">
                  {tagExternalDocsUrl}
                </Link> : null
              }
            </p>
          }
        </div>

        {children}

      </div>
    )
  }
}
