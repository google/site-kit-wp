/**
 * Provisioning utilities.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import md5 from 'md5';

/**
 * Sanitizes provisioning parameters for SiwG client ID creation.
 *
 * @since n.e.x.t
 *
 * @param {Object} params              The parameters object to sanitize.
 * @param {string} [params.appname]    The app name parameter.
 * @param {string} [params.sitename]   The site name parameter.
 * @param {string} [params.siteorigin] The site origin parameter.
 * @return {Object} The sanitized parameters object.
 */
export function sanitizeProvisioningParams( params ) {
	const { appname, sitename, siteorigin } = params;

	// If required parameters are missing or empty, return as-is.
	if ( ! appname || ! sitename || ! siteorigin ) {
		return params;
	}

	// Work on a copy to avoid mutating the original object.
	const sanitizedParams = { ...params };

	// Start by replacing all invalid characters with hyphens in appname.
	let sanitizedAppname = appname.replace( /[^a-zA-Z0-9\s-]/g, '-' );

	// Reduce segments with 2+ consecutive spaces or hyphens to a single character.
	sanitizedAppname = sanitizedAppname.replace( /[\s-]{2,}/g, ( match ) =>
		match.includes( ' ' ) ? ' ' : '-'
	);

	// If the resulting name is less than 4 characters, replace with fallback.
	if ( sanitizedAppname.length < 4 ) {
		try {
			const host = new URL( siteorigin ).hostname;
			const hash = md5( host ).substring( 0, 16 ); // Truncate MD5 to fit in 30 chars.
			sanitizedAppname = `site-kit-siwg-${ hash }`;
		} catch ( error ) {
			// If URL parsing fails, use the original siteorigin for MD5.
			const hash = md5( siteorigin ).substring( 0, 16 ); // Truncate MD5 to fit in 30 chars.
			sanitizedAppname = `site-kit-siwg-${ hash }`;
		}
	}

	// Truncate to a max of 30 characters.
	if ( sanitizedAppname.length > 30 ) {
		sanitizedAppname = sanitizedAppname.substring( 0, 30 );

		// If the final character is a hyphen after truncation, remove it.
		if ( sanitizedAppname.endsWith( '-' ) ) {
			sanitizedAppname = sanitizedAppname.slice( 0, -1 );
		}
	}

	sanitizedParams.appname = sanitizedAppname;

	return sanitizedParams;
}
