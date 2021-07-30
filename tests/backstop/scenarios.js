const storybookHost = require( './detect-storybook-host' );
const rootURL = `${ storybookHost }iframe.html?id=`;
const storybookStories = require( '../../.storybook/storybook-data' );
// does not work as these paths are relative to this file
// const filePaths = require( '../../.storybook/main' );
const glob = require( 'glob' );
const fs = require( 'fs' );
const parser = require( '@babel/parser' );
const traverse = require( '@babel/traverse' ).default;

// TEMP FIX HARDCODE PATHS HERE
const storyFiles = glob.sync( './assets/js/**/*.stories.js' );
storyFiles.forEach( ( storyFile ) => {
	const code = fs.readFileSync( storyFile ).toString();
	const ast = parser.parse( code, { sourceType: 'module', plugins: [ 'jsx' ] } );

	const stories = {};
	let defaultTitle = '';
	let defaultComponent = '';

	traverse( ast, {
		ExportDefaultDeclaration: ( { node } ) => {
			const properties = {};
			node.declaration.properties.forEach( ( property ) => {
				properties[ property.key.name ] = property.value.value || property.value.name;
			} );

			defaultTitle = properties?.title || '';
			defaultComponent = properties?.component || '';
		},
		AssignmentExpression: ( { node } ) => {
			let nodeValue = '';
			if ( node.right.type === 'StringLiteral' && node.left.property.name === 'storyName' ) {
				nodeValue = node.right.value;
			} else if ( node.right.type === 'ObjectExpression' ) {
				nodeValue = {};
				node.right.properties.forEach( ( property ) => {
					nodeValue[ property.key.name ] = property.value.value;
				} );
			}

			// console.log( 'node.left.object.name ', node.left.object.name );
			// console.log( 'node.left.property.name ', node.left.property.name );

			if ( ! stories[ node.left.object.name ] ) {
				stories[ node.left.object.name ] = {};
			}

			stories[ node.left.object.name ][ node.left.property.name ] = nodeValue;
		},
	} );

	console.log( 'stories: ', stories );
} );

// have to run backstop to see this. not build it
// r6t79vy0ubino[]ugvyg8h9ij

// module.exports = storybookStories.map( ( story ) => {
// 	return {
// 		label: `${ story.kind }/${ story.name }`,
// 		url: `${ rootURL }${ story.id }`,
// 		readySelector: story.parameters.options.readySelector,
// 		hoverSelector: story.parameters.options.hoverSelector,
// 		clickSelector: story.parameters.options.clickSelector,
// 		clickSelectors: story.parameters.options.clickSelectors,
// 		postInteractionWait: story.parameters.options.postInteractionWait,
// 		delay: story.parameters.options.delay,
// 		onReadyScript: story.parameters.options.onReadyScript,
// 		misMatchThreshold: story.parameters.options.misMatchThreshold,
// 	};
// } );

// make building quicker for dev!
module.exports = [];
