/**
 * Webpack config.
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
 * Internal dependencies
 */
const { createRules } = require( './webpack/common' );
const adminCssConfig = require( './webpack/adminCss.config' );
const basicModulesConfig = require( './webpack/basicModules.config' );
// const conversionEventProviders = require( './webpack/conversionEventProviders.config' );
const modulesConfig = require( './webpack/modules.config' );
const testBundleConfig = require( './webpack/testBundle.config' );

function* webpackConfig( env, argv ) {
	const { mode } = argv;
	const { ANALYZE } = env || {};

	const rules = createRules( mode );

	// Build the settings js..
	yield modulesConfig( mode, rules, ANALYZE );

	if ( ANALYZE ) {
		return;
	}

	// Build basic modules that don't require advanced optimizations, splitting chunks, and so on...
	yield basicModulesConfig( mode );

	// Build conversion event provider files.
	// yield conversionEventProviders( mode );

	// Build the main plugin admin css.
	yield adminCssConfig( mode );
}

module.exports.default = ( env, argv ) => {
	const configs = [];

	const configGenerator = webpackConfig( env, argv );
	for ( const config of configGenerator ) {
		configs.push( {
			...config,
			stats: 'errors-warnings',
		} );
	}

	const { includeTests, mode } = argv;

	if ( mode !== 'production' || includeTests ) {
		// Build the test files if we aren't doing a production build.
		configs.push( {
			...testBundleConfig(),
			stats: 'errors-warnings',
		} );
	}

	return configs;
};
