/**
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
 * Internal dependencies
 */
import { PII_TYPE, normalizeValue, classifyPII } from './utils';

( ( jQuery, PUM ) => {
	if ( ! jQuery || ! PUM ) {
		return;
	}

	PUM.hooks.addAction( 'pum.integration.form.success', ( form, args ) => {
		const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

		const userData =
			gtagUserDataEnabled && shouldHandleProvider( args.formProvider )
				? getUserData( form, args )
				: undefined;

		global._googlesitekit?.gtagEvent?.(
			'submit_lead_form',
			userData ? { user_data: userData } : undefined
		);
	} );
} )( global.jQuery, global.PUM );

const HANDLED_PROVIDERS = [ 'wpforms', 'contactform7', 'ninjaforms', 'mc4wp' ];

/**
 * Determines if the form provider is already handled in another script.
 *
 * @since n.e.x.t
 *
 * @param {string} provider The form provider (plugin) slug.
 * @return {boolean} Whether this provider's submission should be handled here or not.
 */
function shouldHandleProvider( provider ) {
	return ! HANDLED_PROVIDERS.includes( provider );
}

/**
 * Extracts and classifies user data from a form submission inside a Popup Maker popup.
 *
 * @since n.e.x.t
 *
 * @param {Object} form A jQuery object or an HTMLFormElement instance.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserData( form ) {
	// eslint-disable-next-line sitekit/acronym-case
	form = form instanceof HTMLFormElement ? form : form[ 0 ];

	if ( ! form ) {
		return undefined;
	}

	const formData = new FormData( form );
	const detectedFields = Array.from( formData.entries() )
		.map( ( [ name, value ] ) => {
			const input = form.querySelector( `[name='${ name }']` );

			const type = input?.type;

			// Filter out hidden fields.
			if ( type === 'hidden' ) {
				return null;
			}

			const label =
				( input?.id
					? form.querySelector( `label[for='${ input?.id }']` )
							?.textContent
					: null ) || input?.closest( 'label' )?.textContent;

			return classifyPII( {
				type,
				label,
				name,
				value,
			} );
		} )
		.filter( Boolean );

	const userDataFields = [
		[ 'address', getAddress( detectedFields ) ],
		[ 'email', getEmail( detectedFields ) ],
		[ 'phone_number', getPhoneNumber( detectedFields ) ],
	].filter( ( [ , value ] ) => value );

	if ( userDataFields.length === 0 ) {
		return undefined;
	}

	return Object.fromEntries( userDataFields );
}

/**
 * Extracts and formats name fields for Google Tag's user_data address object.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {Object|undefined} An object containing normalized first_name and optionally last_name, or undefined if no names found.
 */
function getAddress( fields ) {
	const names = fields
		.filter( ( { type } ) => type === PII_TYPE.NAME )
		.map( ( { value } ) => value );

	if ( ! names.length ) {
		return undefined;
	}

	const [ firstName, ...lastNames ] =
		names.length === 1 ? names[ 0 ].split( ' ' ) : names;

	return {
		first_name: normalizeValue( firstName ),
		...( lastNames?.length > 0
			? { last_name: normalizeValue( lastNames.join( ' ' ) ) }
			: {} ),
	};
}

/**
 * Extracts the email address from detected PII fields.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {string|undefined} The email address if found, undefined otherwise.
 */
function getEmail( fields ) {
	return fields.find( ( { type } ) => type === PII_TYPE.EMAIL )?.value;
}

/**
 * Extracts the phone number from detected PII fields.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {string|undefined} The phone number if found, undefined otherwise.
 */
function getPhoneNumber( fields ) {
	return fields.find( ( { type } ) => type === PII_TYPE.PHONE )?.value;
}
