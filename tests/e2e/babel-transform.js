/**
 * External dependencies
 */
const babelJest = require( 'babel-jest' );

module.exports = babelJest.createTransformer( {
	presets: [ '@wordpress/default' ],
	plugins: [ [ 'polyfill-es-shims', { method: 'usage-global' } ] ],
} );
