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
import { isFeatureEnabled } from '../features';
import { classifyPII, normalizeValue, PII_TYPE } from './utils';

( ( jQuery ) => {
	if ( ! jQuery ) {
		return;
	}

	jQuery( global.document.body ).on(
		'wpformsAjaxSubmitSuccess',
		( event ) => {
			if ( isFeatureEnabled( 'gtagUserData' ) ) {
				const form = event.target;
				const userData = getUserData( form );

				global._googlesitekit?.gtagEvent?.(
					'submit_lead_form',
					userData ? { user_data: userData } : undefined
				);

				return;
			}

			global._googlesitekit?.gtagEvent?.( 'submit_lead_form' );
		}
	);
} )( global.jQuery );

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

	const [ firstName, lastName ] =
		names.length === 1 ? names[ 0 ].split( ' ', 2 ) : names;

	return {
		first_name: normalizeValue( firstName ),
		...( lastName ? { last_name: normalizeValue( lastName ) } : {} ),
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

/**
 * Extracts and classifies user data from a WPForms form submission.
 *
 * @since n.e.x.t
 *
 * @param {HTMLFormElement} form The submitted form element.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserData( form ) {
	const formData = new FormData( form );
	const detectedFields = Array.from( formData.entries() )
		.map( ( [ name, value ] ) => {
			const input = form.querySelector( `[name='${ name }']` );

			const type = input?.type;

			// WPForms adds a lot of hidden fields that can end up causing false positives, so we're filtering them out
			if ( type === 'hidden' ) {
				return null;
			}

			const label = input?.id
				? form.querySelector( `label[for='${ input?.id }']` )
						?.textContent
				: undefined;

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
