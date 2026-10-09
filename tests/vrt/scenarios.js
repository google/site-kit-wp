/**
 * Visual regression test scenarios.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
const storyGlobs = require( '../../storybook/stories' );
const { DIST_DIR, ROOT_DIR } = require( './constants' );
const viewports = require( './viewports' );

const STORYBOOK_DIR = path.resolve( ROOT_DIR, 'storybook' );

const VIEWPORT_LABELS = viewports.map( ( { label } ) => label );

// The options a story's `.scenario` object can set, and their types. Anything
// else fails, rather than being silently ignored.
const SCENARIO_OPTIONS = {
	// Wait at least this many milliseconds after the story renders.
	delay: [ 'number' ],
	// Wait for an element matching this selector before the screenshot.
	readySelector: [ 'string' ],
	// Hover over, then click, the first element matching these selectors.
	hoverSelector: [ 'string' ],
	clickSelector: [ 'string' ],
	// Wait this many milliseconds after hovering or clicking.
	postInteractionWait: [ 'number' ],
	// Capture only this viewport (a label from `viewports.js`).
	viewport: [ 'string' ],
	// `DataBlockGroup` font fitting, see `interactions.js`.
	resetDataBlockGroup: [ 'boolean' ],
	waitForFontSizeToMatch: [ 'string' ],
	fontSizeSmall: [ 'number', 'boolean' ],
	fontSizeMedium: [ 'number', 'boolean' ],
	fontSizeLarge: [ 'number', 'boolean' ],
};

/**
 * Formats a location in a story file for error messages.
 *
 * @since n.e.x.t
 *
 * @param {string} file The story file.
 * @param {Object} node The Babel node.
 * @return {string} The relative file path and line.
 */
function location( file, node ) {
	return `${ path.relative( ROOT_DIR, file ) }:${ node?.loc?.start.line }`;
}

/**
 * Gets the value of a literal Babel node.
 *
 * @since n.e.x.t
 *
 * @param {Object} node The Babel node.
 * @return {Object|undefined} `{ value }`, or `undefined` if the node isn't a literal.
 */
function getLiteral( node ) {
	switch ( node?.type ) {
		case 'StringLiteral':
		case 'NumericLiteral':
		case 'BooleanLiteral':
			return { value: node.value };
		case 'TemplateLiteral':
			if ( ! node.expressions.length ) {
				return { value: node.quasis[ 0 ].value.cooked };
			}
			return undefined;
		default:
			return undefined;
	}
}

/**
 * Gets the name of an object property, if it can be read statically.
 *
 * @since n.e.x.t
 *
 * @param {Object} property The Babel `ObjectProperty` node.
 * @return {string|undefined} The property name.
 */
function getPropertyName( property ) {
	if ( property.type !== 'ObjectProperty' || property.computed ) {
		return undefined;
	}

	if ( property.key.type === 'Identifier' ) {
		return property.key.name;
	}

	return getLiteral( property.key )?.value;
}

/**
 * Removes TypeScript wrappers such as `{ … } as Meta` or `satisfies Meta`.
 *
 * @since n.e.x.t
 *
 * @param {Object} node The Babel node.
 * @return {Object} The wrapped node.
 */
function unwrapTypeScript( node ) {
	while (
		node &&
		[ 'TSAsExpression', 'TSSatisfiesExpression' ].includes( node.type )
	) {
		node = node.expression;
	}

	return node;
}

/**
 * Reads the `features` array from a story's `parameters` object.
 *
 * @since n.e.x.t
 *
 * @param {Object} parameters The Babel node assigned to `parameters`.
 * @param {string} file       The story file.
 * @return {Object} `{ features }` (an array, or `undefined` if not set), or
 *                  `{ error }` when the features can't be read statically.
 */
function getFeatures( parameters, file ) {
	parameters = unwrapTypeScript( parameters );

	if ( parameters?.type !== 'ObjectExpression' ) {
		return {
			error: `${ location(
				file,
				parameters
			) }: \`parameters\` must be an object literal.`,
		};
	}

	if (
		parameters.properties.some( ( { type } ) => type !== 'ObjectProperty' )
	) {
		return {
			error: `${ location(
				file,
				parameters
			) }: \`parameters\` with spreads or methods can't be read.`,
		};
	}

	const property = parameters.properties.find(
		( prop ) => getPropertyName( prop ) === 'features'
	);

	if ( ! property ) {
		return { features: undefined };
	}

	const values = property.value.elements?.map( getLiteral );

	if (
		property.value.type !== 'ArrayExpression' ||
		values.some( ( literal ) => typeof literal?.value !== 'string' )
	) {
		return {
			error: `${ location(
				file,
				property
			) }: \`features\` must be an array of string literals.`,
		};
	}

	return { features: values.map( ( { value } ) => value ) };
}

/**
 * Reads and checks a story's `.scenario` object.
 *
 * @since n.e.x.t
 *
 * @param {Object} node The Babel node assigned to `.scenario`.
 * @param {string} file The story file.
 * @return {Object} The scenario options.
 */
function getScenarioOptions( node, file ) {
	if ( node.type !== 'ObjectExpression' ) {
		throw new Error(
			`${ location(
				file,
				node
			) }: \`.scenario\` must be an object literal.`
		);
	}

	const options = {};

	for ( const property of node.properties ) {
		const name = getPropertyName( property );
		const types = SCENARIO_OPTIONS[ name ];

		if ( ! types ) {
			throw new Error(
				`${ location(
					file,
					property
				) }: unknown scenario option "${ name }". ` +
					`Supported options: ${ Object.keys( SCENARIO_OPTIONS ).join(
						', '
					) }.`
			);
		}

		const literal = getLiteral( property.value );

		if ( ! literal || ! types.includes( typeof literal.value ) ) {
			throw new Error(
				`${ location(
					file,
					property
				) }: scenario option "${ name }" must be a ${ types.join(
					' or '
				) } literal.`
			);
		}

		options[ name ] = literal.value;
	}

	if (
		options.viewport !== undefined &&
		! VIEWPORT_LABELS.includes( options.viewport )
	) {
		throw new Error(
			`${ location( file, node ) }: unknown viewport "${
				options.viewport
			}". ` + `Supported viewports: ${ VIEWPORT_LABELS.join( ', ' ) }.`
		);
	}

	return options;
}

/**
 * Reads the visual regression scenarios from one story file.
 *
 * @since n.e.x.t
 *
 * @param {string} file The story file.
 * @return {Object[]} The scenarios.
 */
function getFileScenarios( file ) {
	const ast = parser.parse( fs.readFileSync( file, 'utf8' ), {
		sourceType: 'module',
		plugins: [ 'jsx', 'typescript' ],
	} );

	let meta;
	const stories = {};

	function getStory( name ) {
		stories[ name ] = stories[ name ] || {};
		return stories[ name ];
	}

	traverse( ast, {
		ExportDefaultDeclaration( { node, scope } ) {
			let declaration = unwrapTypeScript( node.declaration );

			// `const meta = { … }; export default meta;`
			if ( declaration.type === 'Identifier' ) {
				declaration = unwrapTypeScript(
					scope.getBinding( declaration.name )?.path.node.init
				);
			}

			meta = { node: declaration };

			if ( declaration?.type !== 'ObjectExpression' ) {
				return;
			}

			for ( const property of declaration.properties ) {
				const name = getPropertyName( property );

				if ( name === 'title' ) {
					meta.title = getLiteral( property.value )?.value;
				} else if ( name === 'parameters' ) {
					meta.features = getFeatures( property.value, file );
				}
			}
		},
		ExportNamedDeclaration( { node } ) {
			// CSF3 object stories aren't supported yet.
			for ( const declarator of node.declaration?.declarations || [] ) {
				const init = unwrapTypeScript( declarator.init );

				if (
					init?.type === 'ObjectExpression' &&
					init.properties.some(
						( prop ) => getPropertyName( prop ) === 'scenario'
					)
				) {
					throw new Error(
						`${ location(
							file,
							declarator
						) }: set \`scenario\` with ` +
							'`Story.scenario = { … }`; CSF3 object stories are not supported yet.'
					);
				}
			}
		},
		AssignmentExpression( { node } ) {
			const { left, right } = node;

			if (
				left.type !== 'MemberExpression' ||
				left.object.type !== 'Identifier' ||
				left.property.type !== 'Identifier'
			) {
				return;
			}

			const exportName = left.object.name;
			const key = left.property.name;

			if ( key === 'storyName' ) {
				getStory( exportName ).storyName = getLiteral( right )?.value;
			} else if ( key === 'scenario' ) {
				getStory( exportName ).scenario = getScenarioOptions(
					right,
					file
				);
				getStory( exportName ).node = node;
			} else if ( key === 'parameters' ) {
				getStory( exportName ).features = getFeatures( right, file );
			}
		},
	} );

	const scenarioStories = Object.entries( stories ).filter(
		( [ , story ] ) => story.scenario
	);

	if ( ! scenarioStories.length ) {
		return [];
	}

	if ( typeof meta?.title !== 'string' || ! meta.title ) {
		throw new Error(
			`${ location(
				file,
				meta?.node
			) }: the default export needs a literal \`title\` for its scenarios.`
		);
	}

	return scenarioStories.map( ( [ exportName, story ] ) => {
		// Story-level `parameters` replace the default export's `features`.
		const features =
			story.features?.features !== undefined || story.features?.error
				? story.features
				: meta.features || { features: [] };

		if ( features.error ) {
			throw new Error( features.error );
		}

		const name = story.storyName || exportName;
		const id = csf.toId( meta.title, kebabCase( exportName ) ); // eslint-disable-line sitekit/acronym-case
		const { viewport, ...options } = story.scenario;
		const featureList = features.features || [];

		return {
			id,
			title: meta.title,
			label: `${ meta.title }/${ name }`,
			file,
			line: story.node.loc.start.line,
			// The reference image's directory: the story's title and name, each in
			// kebab case, mirroring Storybook's sidebar.
			slug: [ ...meta.title.split( '/' ), name ]
				.map( ( segment ) => kebabCase( segment ) )
				.filter( Boolean ),
			// Always set `features`, even when empty: `storybook/preview-head.html`
			// then never falls back to flags left in session storage.
			url: `/iframe.html?id=${ encodeURIComponent(
				id
			) }&viewMode=story&features=${ featureList.join( ',' ) }`,
			features: featureList,
			viewports: viewport ? [ viewport ] : VIEWPORT_LABELS,
			hasInteractions: !! (
				options.hoverSelector || options.clickSelector
			),
			...options,
		};
	} );
}

let cachedScenarios;

/**
 * Gets every visual regression scenario, from the `.scenario` of each story.
 *
 * @since n.e.x.t
 *
 * @return {Object[]} The scenarios, sorted by label.
 */
function getScenarios() {
	if ( cachedScenarios ) {
		return cachedScenarios;
	}

	const files = flatten(
		storyGlobs.map( ( storyGlob ) => glob.sync( storyGlob ) )
	).sort();

	const scenarios = flatten( files.map( getFileScenarios ) ).sort( ( a, b ) =>
		a.label.localeCompare( b.label )
	);

	const seen = new Map();

	for ( const scenario of scenarios ) {
		for ( const key of [ scenario.id, scenario.slug.join( '/' ) ] ) {
			if ( seen.has( key ) ) {
				throw new Error(
					`Scenarios "${ seen.get( key ) }" and "${
						scenario.label
					}" ` + `both map to "${ key }". Rename one of the stories.`
				);
			}

			seen.set( key, scenario.label );
		}
	}

	cachedScenarios = scenarios;

	return scenarios;
}

/**
 * Checks that every scenario's story exists in the Storybook build.
 *
 * Without this check, a typo in a story ID would capture Storybook's error
 * page as the reference image.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} scenarios The scenarios.
 * @return {string[]} Problems found, as messages.
 */
function validateAgainstBuild( scenarios ) {
	const indexFile = path.join( DIST_DIR, 'index.json' );
	const iframeFile = path.join( DIST_DIR, 'iframe.html' );

	if ( ! fs.existsSync( indexFile ) || ! fs.existsSync( iframeFile ) ) {
		return [
			`No Storybook build in ${ path.relative(
				ROOT_DIR,
				DIST_DIR
			) }/. Run \`VRT=1 npm run build:storybook\` first.`,
		];
	}

	if ( ! fs.readFileSync( iframeFile, 'utf8' ).includes( 'dataset.vrt' ) ) {
		return [
			`The Storybook build in ${ path.relative(
				ROOT_DIR,
				DIST_DIR
			) }/ wasn't made for visual regression tests. ` +
				'Rebuild it with `VRT=1 npm run build:storybook`.',
		];
	}

	const { entries } = JSON.parse( fs.readFileSync( indexFile, 'utf8' ) );

	return scenarios
		.filter( ( scenario ) => {
			const entry = entries[ scenario.id ];

			return (
				! entry ||
				entry.title !== scenario.title ||
				path.resolve( STORYBOOK_DIR, entry.importPath ) !==
					scenario.file
			);
		} )
		.map(
			( scenario ) =>
				`${ path.relative( ROOT_DIR, scenario.file ) }:${
					scenario.line
				}: story "${ scenario.id }" isn't in the Storybook build. ` +
				'Is the build out of date (`VRT=1 npm run build:storybook`), or the story renamed?'
		);
}

module.exports = {
	SCENARIO_OPTIONS,
	getScenarios,
	validateAgainstBuild,
};
