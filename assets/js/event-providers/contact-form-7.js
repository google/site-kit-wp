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

global.document.addEventListener( 'wpcf7mailsent', ( event ) => {
	const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

	const userData = gtagUserDataEnabled
		? getUserDataFromForm( event.target )
		: null;

	global._googlesitekit?.gtagEvent?.( 'contact', {
		// eslint-disable-next-line sitekit/acronym-case
		event_category: event.detail.contactFormId,
		event_label: event.detail.unitTag,
		...( userData ? { user_data: userData } : {} ),
	} );
} );

/**
 * Extracts and classifies user data from a Contact Form 7 form submission.
 *
 * @since n.e.x.t
 * @since n.e.x.t Renamed to `getUserDataFromForm` because `getUserData` was extracted into a generic utility function.
 *
 * @param {HTMLFormElement} form The submitted form element.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserDataFromForm( form ) {
	// eslint-disable-next-line sitekit/acronym-case
	if ( ! form || ! ( form instanceof HTMLFormElement ) ) {
		return undefined;
	}

	const formData = new FormData( form );
	const detectedFields = Array.from( formData.entries() )
		.map( ( [ name, value ] ) => {
			const input = form.querySelector( `[name='${ name }']` );

			const type = input?.type;

			// Skip hidden fields and submit buttons that don't contain user data.
			if ( type === 'hidden' || type === 'submit' ) {
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

	return getUserData( detectedFields );
}
