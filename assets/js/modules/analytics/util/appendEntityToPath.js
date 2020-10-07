/**
 * appendEntityToPath util.
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
 * Parses an entity URL and appends to the given path.
 *
 * @since n.e.x.t
 *
 * @param {string} entity  The entity to append to the path
 * @param {string} path    The path
 * @return {string} The final url if entity is defined, otherwise the original path.
 */
export default function appendEntityToPath( entity, path ) {
	// If there is no entity, return the original path.
	if ( ! entity ) {
		return path;
	}

	const parsedURL = new URL( entity );
	const pageSegment = `_r.drilldown=analytics.pagePath:${ parsedURL.pathname.replace( /\//g, '~2F' ) }`;
	return `${ path }${ pageSegment }`;
}
