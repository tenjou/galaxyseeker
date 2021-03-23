const createStyledComponentsTransformer = require("typescript-plugin-styled-components")
    .default

const styledComponentsTransformer = createStyledComponentsTransformer({
    getDisplayName(filename, bindingName) {
        return bindingName || filename
    },
})
const getCustomTransformers = () => ({ before: [styledComponentsTransformer] })

module.exports = getCustomTransformers
