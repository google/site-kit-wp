/**
 * Modules datastore fixtures.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import modules from '../fixtures.json'; // TODO: move into this directory.

// Only Search Console and Site Verification are always active.
const alwaysActive = [ 'search-console', 'site-verification' ];

/**
 * Makes a copy of the modules with the given module activation set.
 *
 * @param {...string} slugs Active module slugs.
 * @return {Object[]} Array of module objects.
 */
export const withActive = ( ...slugs ) => {
	const activeSlugs = alwaysActive.concat( slugs );
	return modules.map( ( module ) => {
		return { ...module, active: activeSlugs.includes( module.slug ) };
	} );
};

export default withActive();
