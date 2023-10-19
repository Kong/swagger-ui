import React from "react"
import PropTypes from "prop-types"

export const Property = ({ propKey, propVal, propStyle, propClass }) => {
    return (
        <span style={ propStyle } className={ propClass }>
          <br />{ propKey }: { String(propVal) }</span>
    )
}
Property.propTypes = {
  propKey: PropTypes.string,
  propVal: PropTypes.any,
  propStyle: PropTypes.object,
  propClass: PropTypes.string,
}

export default Property
