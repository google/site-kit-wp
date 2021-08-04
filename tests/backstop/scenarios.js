const storybookHost = require( './detect-storybook-host' );
const rootURL = `${ storybookHost }iframe.html?id=`;
const legacyStorybookScenarios = require( '../../.storybook/storybook-data' );
const filePaths = require( '../../.storybook/main' );
const glob = require( 'glob' );
const fs = require( 'fs' );
const parser = require( '@babel/parser' );
const traverse = require( '@babel/traverse' ).default;
const csf = require( '@componentdriven/csf' );
const kebabCase = require( 'lodash/kebabCase' );

const newBackstopTests = [];

const storyFiles =
	// remove relative parent ..
	glob.sync( filePaths.stories[ 1 ].slice( 1 ) );

storyFiles.forEach( ( storyFile ) => {
	const code = fs.readFileSync( storyFile ).toString();
	const ast = parser.parse( code, {
		sourceType: 'module',
		plugins: [ 'jsx' ],
	} );

	const stories = {};
	let defaultTitle = '';

	traverse( ast, {
		ExportDefaultDeclaration: ( { node } ) => {
			const properties = {};
			node.declaration.properties.forEach( ( property ) => {
				properties[ property.key.name ] =
					property.value.value || property.value.name;
			} );

			defaultTitle = ( properties && properties.title ) || '';
		},
		AssignmentExpression: ( { node } ) => {
			let nodeValue = '';
			if (
				node.right.type === 'StringLiteral' &&
				node.left.property.name === 'storyName'
			) {
				nodeValue = node.right.value;
			} else if ( node.right.type === 'ObjectExpression' ) {
				nodeValue = {};
				node.right.properties.forEach( ( property ) => {
					nodeValue[ property.key.name ] = property.value.value;
				} );
			}

			if ( ! stories[ node.left.object.name ] ) {
				stories[ node.left.object.name ] = {};
			}

			stories[ node.left.object.name ][
				node.left.property.name
			] = nodeValue;
		},
	} );

	for ( const [ key, value ] of Object.entries( stories ) ) {
		const storyID = csf.toId( defaultTitle, kebabCase( key ) ); // eslint-disable-line sitekit/acronym-case
		if (
			value &&
			value.scenario &&
			Object.keys( value.scenario ).length > 0 &&
			// TODO - also support bool here
			value.scenario.constructor === Object
		) {
			const newBackstopTest = {
				url: `${ rootURL }${ storyID }`,
				...value.scenario,
			};

			newBackstopTests.push( newBackstopTest );
		}
	}
} );

const backstopTests = storybookStories.map( ( story ) => {
	return {
		label: `${ story.kind }/${ story.name }`,
		url: `${ rootURL }${ story.id }`,
		readySelector: story.parameters.options.readySelector,
		hoverSelector: story.parameters.options.hoverSelector,
		clickSelector: story.parameters.options.clickSelector,
		clickSelectors: story.parameters.options.clickSelectors,
		postInteractionWait: story.parameters.options.postInteractionWait,
		delay: story.parameters.options.delay,
		onReadyScript: story.parameters.options.onReadyScript,
		misMatchThreshold: story.parameters.options.misMatchThreshold,
	};
} );

module.exports = [ ...backstopTests, ...newBackstopTests ];
