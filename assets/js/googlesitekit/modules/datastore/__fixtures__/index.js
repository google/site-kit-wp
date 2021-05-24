/**
 * Modules datastore fixtures.
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
import modules from './list.json';

/**
 * Makes a copy of the modules with the given module activation set.
 *
 * @since 1.18.0
 *
 * @param {...string} slugs Active module slugs.
 * @return {Object[]} Array of module objects.
 */
export function withActive( ...slugs ) {
	return modules.map( ( module ) => ( {
		...module,
		active: module.forceActive || slugs.includes( module.slug ),
	} ) );
}

/**
 * Makes a copy of the modules with the given module connection set.
 *
 * @since 1.28.0
 *
 * @param {...string} slugs Active module slugs.
 * @return {Object[]} Array of module objects.
 */
export function withConnected( ...slugs ) {
	return withActive( ...slugs ).map( ( module ) => ( {
		...module,
		connected: slugs.includes( module.slug ),
	} ) );
}

export default withActive();
