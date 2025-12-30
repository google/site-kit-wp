/**
 * Provisioning utilities for Sign in with Google app creation.
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
 * Sanitizes provisioning parameters for Sign in with Google
 * client ID creation.
 *
 * @since 1.159.0
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

	// Strip leading numbers from sitename.
	let sanitizedSitename = sitename.replace( /^\d+/, '' );
	// Replace all non-alphanumeric characters (except hyphens) with spaces in sitename.
	sanitizedSitename = sanitizedSitename.replace( /[^a-zA-Z0-9\s-]/g, ' ' );
	// Normalize all whitespace characters (tabs, newlines, etc.) to spaces.
	sanitizedSitename = sanitizedSitename.replace( /\s+/g, ' ' );
	// Trim whitespaces from beginning and end.
	sanitizedSitename = sanitizedSitename.trim();

	// If the resulting name is less than 4 characters, replace with fallback.
	if ( sanitizedSitename.split( ' ' ).join( '' ).length < 4 ) {
		try {
			const host = new URL( siteorigin ).hostname;
			sanitizedSitename = `site-kit-siwg-${ md5( host ) }`;
		} catch ( error ) {
			// If URL parsing fails, use the original siteorigin for MD5.
			sanitizedSitename = `site-kit-siwg-${ md5( siteorigin ) }`;
		}
	}

	// Truncate sitename to a max of 30 characters.
	if ( sanitizedSitename.length > 30 ) {
		sanitizedSitename = sanitizedSitename.substring( 0, 30 );
		// Trim any trailing spaces created by truncation.
		sanitizedSitename = sanitizedSitename.trimEnd();
	}

	sanitizedParams.sitename = sanitizedSitename;

	return sanitizedParams;
}
