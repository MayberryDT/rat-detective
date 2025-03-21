/** @type {import('@babel/core').TransformOptions} */
const config = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current'
            }
        }]
    ],
    plugins: [
        '@babel/plugin-syntax-import-meta'
    ]
};

module.exports = config; 