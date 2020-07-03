/**
 * External dependencies
 */
const { src, dest } = require( 'gulp' );
const svgstore = require( 'gulp-svgstore' );
const svgmin = require( 'gulp-svgmin' );
const pump = require( 'pump' );

const config = {
	input: './assets/svg/**/*.svg',
	output: './dist/assets/svg',
};

module.exports = function( cb ) {
	pump(
		[
			src( config.input ),
			svgmin( {
				plugins: [ {
					removeViewBox: false,
				} ],
			} ),
			svgstore( { inlineSvg: true } ),
			dest( config.output ),
		],
		cb
	);
};
