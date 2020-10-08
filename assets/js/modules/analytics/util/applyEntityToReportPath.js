/**
 * Utility function applyEntityToReportPath.
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
 * @param {string} currentEntityURL The entity URL to append to the path.
 * @param {string} reportPath       The report path.
 * @return {string} The final url if entity is defined, otherwise the original path.
 */
export default function applyEntityToReportPath( currentEntityURL, reportPath ) {
	// If there is no currentEntityURL, return the original path.
	if ( ! currentEntityURL ) {
		return reportPath;
	}
	try {
		const parsedURL = new URL( currentEntityURL );
		const pageSegment = `_r.drilldown=analytics.pagePath:${ parsedURL.pathname.replace( /\//g, '~2F' ) }`;
		// Ensure there is always a trailing slash after the reportPath.
		return `${ reportPath.replace( /\/$/, '' ) }/${ pageSegment }`;
	} catch ( error ) {
		throw new Error( 'currentEntityURL must be a valid URL.' );
	}
}
