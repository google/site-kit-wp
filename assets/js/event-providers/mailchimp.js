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
import { classifyPII, getUserData } from './utils';

( ( mc4wp ) => {
	if ( ! mc4wp ) {
		return;
	}

	mc4wp.forms.on( 'subscribed', ( mc4wpForm, data ) => {
		const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

		const userData = gtagUserDataEnabled
			? getUserDataFromForm( mc4wpForm.element, data )
			: null;

		global._googlesitekit?.gtagEvent?.( 'submit_lead_form', {
			event_category: 'mailchimp',
			...( userData ? { user_data: userData } : {} ),
		} );
	} );
} )( global.mc4wp );

/**
 * Extracts and classifies user data from a Mailchimp form submission.
 *
 * @since n.e.x.t
 *
 * @param {HTMLFormElement} form The submitted form element.
 * @param {Object}          data The submitted form's data.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserDataFromForm( form, data ) {
	// eslint-disable-next-line sitekit/acronym-case
	if ( ! form || ! ( form instanceof HTMLFormElement ) ) {
		return undefined;
	}

	const detectedFields = Object.entries( data )
		.map( ( [ name, value ] ) => {
			// Mailchimp joins the individual name fields into a single field "NAME",
			// but still provides the individual values in the data object.
			// We only rely on "NAME" when neither "FNAME" nor "LNAME" are available.
			if ( name === 'NAME' && ( 'FNAME' in data || 'LNAME' in data ) ) {
				return null;
			}

			const input = form.querySelector( `[name='${ name }']` );

			const type = input?.type;

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

	return getUserData( detectedFields );
}
