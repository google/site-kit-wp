/**
 * Helper functions for mocking accountChooserURL URL's.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Returns a function used for mocking account chooser URL's.
 *
 * @since n.e.x.t
 *
 * @param {string} baseURL The base URL to mock.
 * @param {string} email   The user's email.
 * @return {Function} A util function for mocking account chooser URL's.
 */
export const createAccountChooserMock = ( baseURL, email ) => {
	const accountChooserBaseURL = `https://accounts.google.com/accountchooser?continue=${ encodeURIComponent(
		baseURL
	) }`;

	/**
	 * Mocks an account chooser URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} path The path to append to the base URL.
	 * @return {string} The account chooser with an appended path.
	 */
	const mockAccountChooserURL = ( path = '' ) =>
		`${ accountChooserBaseURL }${
			path &&
			`${ encodeURIComponent( '#/' ) }${ encodeURIComponent(
				path.replace( /^\//, '' )
			) }`
		}&Email=${ encodeURIComponent( email ) }`;

	return mockAccountChooserURL;
};

/**
 * Decodes an account chooser URLs `continue` argument.
 *
 * @since n.e.x.t
 *
 * @param {string} receivedURL The URL to decode.
 * @return {string} The decoded URL.
 */
export const decodeServiceURL = ( receivedURL ) => {
	const url = new URL( receivedURL );

	const received = Array.from( url.searchParams ).reduce(
		( object, [ key, value ] ) => {
			object[ key ] = value;

			return object;
		},
		{}
	);

	if ( ! received.continue ) {
		return;
	}

	const serviceURL = decodeURIComponent( received.continue );

	return serviceURL;
};
