/**
 * `getInsufficientPermissionsErrorDescription` function.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Gets a description for an insufficient permissions error.
 *
 * @since 1.16.0
 *
 * @param {string} error              Original error message.
 * @param {Object} module             Module data.
 * @param {string} module.name        The name of the module.
 * @param {string} module.slug        The slug of the module.
 * @param {Object} module.owner       The owner of the module.
 * @param {string} module.owner.login The The login of the current owner.
 * @return {string}                   Error description.
 */
export function getInsufficientPermissionsErrorDescription(
	error = '',
	module = {}
) {
	const { slug = '', name = '', owner = {} } = module || {};

	// If no module data provided, it is impossible to provide a more clear message.
	if ( ! slug || ! name ) {
		return error;
	}

	let messages;
	switch ( slug ) {
		case 'analytics':
			messages = analyticsError( error );
			break;
		case 'search-console':
			messages = searchConsoleErrors();
			break;
		default:
			messages = [];
			break;
	}

	if ( messages.length === 0 ) {
		messages = emptyError( name );
	}

	messages = [ ...messages, ...userLoginErrors( owner ) ];

	//  Create a full sentence separated by full stops "." and a space to separate 2 messages, if more than one message
	const sentence = messages.join( '. ' );

	/**
	 * If the message contains less than 2 sentences return the sentence as it is, otherwise add a full stop at the
	 * end of the sentence, in order to follow the UX guidelines.
	 *
	 * "text with 1 or 2 sentences should not end in a full stop".
	 *
	 * @since n.e.x.t
	 * @see https://github.com/google/site-kit-wp/issues/4160
	 */
	return messages.length <= 2 ? sentence : `${ sentence }.`;
}

/**
 * Gets a list of error messages for the Analytics module.
 *
 * @since n.e.x.t
 *
 * @param {string} error The error message provided.
 * @return {string[]} An array of string with a list of errors messages.
 */
function analyticsError( error ) {
	if ( error.match( /account/i ) ) {
		return [
			__(
				'Your Google account does not have sufficient permissions for this Analytics account, so you won’t be able to see stats from it on the Site Kit dashboard',
				'google-site-kit'
			),
		];
	}

	if ( error.match( /property/i ) ) {
		return [
			__(
				'Your Google account does not have sufficient permissions for this Analytics property, so you won’t be able to see stats from it on the Site Kit dashboard',
				'google-site-kit'
			),
		];
	}

	if ( error.match( /view/i ) ) {
		return [
			__(
				'Your Google account does not have sufficient permissions for this Analytics view, so you won’t be able to see stats from it on the Site Kit dashboard',
				'google-site-kit'
			),
		];
	}

	return [];
}

/**
 * Gets a list of errors for the search console module.
 *
 * @since n.e.x.t
 *
 * @return {string[]} An array of string with a list of errors messages.
 */
function searchConsoleErrors() {
	return [
		__(
			'Your Google account does not have sufficient permissions for this Search Console property, so you won’t be able to see stats from it on the Site Kit dashboard',
			'google-site-kit'
		),
	];
}

/**
 * Gets the errors the error messages are empty.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleName The name of the module.
 * @return {string[]} An array of string with a list of errors messages.
 */
function emptyError( moduleName ) {
	return [
		sprintf(
			/* translators: %s: module name */
			__(
				'Your Google account does not have sufficient permissions to access %s data, so you won’t be able to see stats from it on the Site Kit dashboard',
				'google-site-kit'
			),
			moduleName
		),
	];
}

/**
 * Gets the errors from a logged in user or a guest user.
 *
 * @since n.e.x.t
 *
 * @param {Object} owner       An object that represents the current owner.
 * @param {string} owner.login The The login of the current owner.
 * @return {string[]} An array of strings with the errors associated with action.
 */
function userLoginErrors( owner = {} ) {
	const { login = '' } = owner || {};

	if ( login ) {
		return [
			sprintf(
				/* translators: %s: owner name */
				__(
					'This service was originally connected by the administrator "%s" — you can contact them for more information',
					'google-site-kit'
				),
				login
			),
		];
	}

	return [
		__(
			'This service was originally connected by an administrator — you can contact them for more information',
			'google-site-kit'
		),
	];
}
