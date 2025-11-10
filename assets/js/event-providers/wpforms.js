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

( ( jQuery ) => {
	if ( ! jQuery ) {
		return;
	}

	jQuery( global.document.body ).on(
		'wpformsAjaxSubmitSuccess',
		( event ) => {
			const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

			const userData = gtagUserDataEnabled
				? getUserDataFromForm( event.target )
				: null;

			global._googlesitekit?.gtagEvent?.(
				'submit_lead_form',
				userData ? { user_data: userData } : undefined
			);
		}
	);
} )( global.jQuery );

/**
 * Extracts and classifies user data from a WPForms form submission.
 *
 * @since 1.162.0 Renamed to `getUserDataFromForm` because `getUserData` was extracted into a generic utility function.
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
			let input = form.querySelector( `[name='${ name }']` );

			// WPForms creates dual inputs for special fields (e.g., phone numbers):
			// - A visible input for UI/display purposes
			// - A hidden input containing the actual raw value (positioned immediately after)
			// When FormData gives us the hidden input, we switch to the visible input
			// for better field type detection and label association.
			if (
				input?.type === 'hidden' &&
				input?.previousSibling?.type !== 'hidden'
			) {
				input = input.previousSibling;
			}

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
