/**
 * Backstop scenarios.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
const parser = require( '@babel/parser' );
const traverse = require( '@babel/traverse' ).default;
const csf = require( '@componentdriven/csf' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const { flatten, kebabCase } = require( 'lodash' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const storybookConfig = require( '../../storybook/main' );
const viewports = require( './viewports' );

// Use HTTP server instead of file:// URLs to support ES modules in modern Storybook.
// See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#dropped-support-for-file-urls.
const rootURL =
	process.env.STORYBOOK_SERVER_URL || 'http://localhost:3000/iframe.html?id=';

const storybookDir = path.resolve( __dirname, '../../storybook' );
const storyFiles = flatten(
	storybookConfig.stories
		.map( ( storiesPattern ) =>
			path.resolve( storybookDir, storiesPattern )
		)
		.map( ( absGlob ) => glob.sync( absGlob ) )
);

/**
 * Reads the `features` list out of a `parameters` object in a story file.
 *
 * @since n.e.x.t
 *
 * @param {Object} parameters Babel node for the object assigned to `parameters`.
 * @return {string[]|undefined} Feature flag names, or `undefined` when the object sets none.
 */
function getFeatures( parameters ) {
	if ( parameters?.type !== 'ObjectExpression' ) {
		return undefined;
	}

	const features = parameters.properties.find(
		( property ) => property.key?.name === 'features'
	);

	if ( features?.value?.type !== 'ArrayExpression' ) {
		return undefined;
	}

	return features.value.elements
		.filter( ( element ) => element?.type === 'StringLiteral' )
		.map( ( element ) => element.value );
}

const csfScenarios = [];
storyFiles.forEach( ( storyFile ) => {
	const code = fs.readFileSync( storyFile ).toString();

	const ast = parser.parse( code, {
		sourceType: 'module',
		plugins: [ 'jsx', 'typescript' ],
	} );

	const stories = {};
	let defaultTitle = '';
	let defaultFeatures = [];

	traverse( ast, {
		ExportDefaultDeclaration: ( { node } ) => {
			const properties = {};
			node.declaration.properties.forEach( ( property ) => {
				properties[ property.key.name ] =
					property.value.value || property.value.name;
			} );

			defaultTitle = ( properties && properties.title ) || '';

			const parameters = node.declaration.properties.find(
				( property ) => property.key?.name === 'parameters'
			);

			defaultFeatures = getFeatures( parameters?.value ) || [];
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
					if ( property?.value && 'value' in property.value ) {
						nodeValue[ property.key.name ] = property.value.value;
					}
				} );

				// The loop keeps only a string or a number, so the `features`
				// array needs its own read.
				if ( node.left.property?.name === 'parameters' ) {
					const features = getFeatures( node.right );

					if ( features ) {
						nodeValue.features = features;
					}
				}
			}

			if ( ! stories[ node.left.object.name ] ) {
				stories[ node.left.object.name ] = {};
			}

			stories[ node.left.object.name ][ node.left.property.name ] =
				nodeValue;
		},
	} );

	for ( const [ key, value ] of Object.entries( stories ) ) {
		// Breaks out of non-CSF stories
		if ( ! key || ! value || ! defaultTitle ) {
			break;
		}
		const storyID = csf.toId( defaultTitle, kebabCase( key ) ); // eslint-disable-line sitekit/acronym-case
		if (
			value &&
			value.scenario &&
			value.scenario.constructor === Object
		) {
			// `storybook/preview-head.html` reads `features` from the URL, so
			// the page loads with the story's flags and never reloads.
			const features = value.parameters?.features || defaultFeatures;

			const scenario = {
				label: `${ defaultTitle }/${ value.storyName || key }`,
				...value.scenario,
				url: `${ rootURL }${ storyID }&features=${ features.join(
					','
				) }`,
			};

			csfScenarios.push( scenario );
		}
	}
} );

// Adding Support for array-based selectors from BackstopJS 6.3.25
function processSelectors( scenarioObj ) {
	const processedScenario = { ...scenarioObj };

	if (
		processedScenario.clickSelector &&
		! processedScenario.clickSelectors
	) {
		processedScenario.clickSelectors = [ processedScenario.clickSelector ];
		delete processedScenario.clickSelector;
	}

	if (
		processedScenario.hoverSelector &&
		! processedScenario.hoverSelectors
	) {
		processedScenario.hoverSelectors = [ processedScenario.hoverSelector ];
		delete processedScenario.hoverSelector;
	}

	if (
		( processedScenario.clickSelectors ||
			processedScenario.hoverSelectors ) &&
		! processedScenario.postInteractionWait
	) {
		processedScenario.postInteractionWait = 1000;
	}

	return processedScenario;
}

/**
 * Limits a scenario a single viewport size.
 *
 * @since 1.188.0
 *
 * @param {Object} scenario The scenario.
 * @return {Object} The scenario, modified with limits on which viewport
 *                  to render, if specified.
 */
function applyViewportLabel( scenario ) {
	const { viewport, ...rest } = scenario;

	if ( ! viewport ) {
		return rest;
	}

	const namedViewports = viewports.filter(
		( { label } ) => label === viewport
	);

	if ( ! namedViewports.length ) {
		throw new Error(
			`Scenario "${ scenario.label }" used viewport "${ viewport }", but viewports.js does not support that size.`
		);
	}

	return { ...rest, viewports: namedViewports };
}

module.exports = csfScenarios.map( ( scenario ) => {
	const backstopReadySelector = 'body.backstopjs-ready';

	const readySelector = scenario.readySelector
		? `${ backstopReadySelector } ${ scenario.readySelector }`
		: backstopReadySelector;

	return {
		...processSelectors( applyViewportLabel( scenario ) ),
		readySelector,
	};
} );
