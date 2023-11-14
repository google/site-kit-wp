/**
 * Converts params into a multidimensional object in E2E tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { set } from 'lodash';

/**
 * Converts a flat object with nested key strings into a multidimensional object.
 *
 * This function iterates over each key-value pair in the provided object.
 * If a key represents a path to a nested structure (e.g., 'metrics[0][name]'),
 * it converts this path into a nested object hierarchy.
 *
 * @since n.e.x.t
 *
 * @param {Object} params The flat object with keys indicating nested paths.
 * @return {Object} A new object with the same data represented in a nested structure.
 */
export default function getMultiDimensionalObjectFromParams( params ) {
	return Object.entries( params ).reduce( ( acc, [ key, value ] ) => {
		set( acc, key, value );
		return acc;
	}, {} );
}
