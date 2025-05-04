/**
 * Validation utilities.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Checks if the given publication ID appears to be a valid.
 *
 * @since 1.131.0
 *
 * @param {string} publicationID Publication ID to test.
 * @return {boolean} `true` if the given publication ID is valid, `false` otherwise.
 */
export function isValidPublicationID( publicationID ) {
	return (
		typeof publicationID === 'string' &&
		/^[a-zA-Z0-9_-]+$/.test( publicationID )
	);
}

/**
 * Checks if the given publication onboarding state is valid.
 *
 * @since 1.132.0
 *
 * @param {string} onboardingState Publication onboarding state.
 * @return {boolean} `true` if the given publication ID is valid, `false` otherwise.
 */
export function isValidOnboardingState( onboardingState ) {
	if ( typeof onboardingState !== 'string' ) {
		return false;
	}

	// List of valid onboarding states.
	const validStates = [
		'ONBOARDING_STATE_UNSPECIFIED',
		'ONBOARDING_ACTION_REQUIRED',
		'PENDING_VERIFICATION',
		'ONBOARDING_COMPLETE',
	];

	return validStates.includes( onboardingState );
}

/**
 * Checks if a given URL uses HTTPS.
 *
 * @since 1.131.0
 *
 * @param {string} url The URL to check.
 * @return {boolean} True if the URL uses HTTPS, false otherwise.
 */
export const isURLUsingHTTPS = ( url ) => {
	try {
		if ( typeof url !== 'string' || ! url ) {
			throw new TypeError( `Invalid URL: ${ url }` );
		}

		const parsedURL = new URL( url );
		return parsedURL.protocol === 'https:';
	} catch ( error ) {
		global.console.warn( 'Invalid URL:', error );
		return false;
	}
};

/**
 * Validates if a value is one of the allowed snippet modes.
 *
 * @since 1.145.0
 *
 * @param {string} mode Snippet mode to validate.
 * @return {boolean} Whether the mode is valid.
 */
export function isValidSnippetMode( mode ) {
	const validModes = [ 'post_types', 'per_post', 'sitewide' ];
	return validModes.includes( mode );
}
