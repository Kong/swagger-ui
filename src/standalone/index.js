import StandaloneLayout from "./layout"
import ConfigsPlugin from "corePlugins/configs"

// the Standalone preset

let preset = [
  ConfigsPlugin,
  () => {
    return {
      components: { StandaloneLayout }
    }
  }
]

module.exports = preset
