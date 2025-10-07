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

global.document.addEventListener( 'om.Analytics.track', ( { detail } ) => {
	if ( 'conversion' === detail.Analytics.type ) {
		const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

		const userData =
			gtagUserDataEnabled && detail.Campaign?.Form
				? getUserDataFromOptinMonsterForm( detail.Campaign.Form )
				: null;

		const eventData = {
			campaignID: detail.Campaign.id,
			campaignType: detail.Campaign.type,
		};

		if ( userData ) {
			eventData.user_data = userData;
		}

		global._googlesitekit?.gtagEvent?.( 'submit_lead_form', eventData );
	}
} );

/**
 * Extracts and classifies user data from an OptinMonster form submission.
 *
 * @since n.e.x.t
 *
 * @param {Object} form OptinMonster form object.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserDataFromOptinMonsterForm( form ) {
	if ( ! form || ! form.inputs ) {
		return undefined;
	}

	// Extract form fields - OptinMonster stores inputs as array or object of HTML input elements.
	const formFields = Array.isArray( form.inputs )
		? form.inputs
		: Object.values( form.inputs );

	if ( ! formFields.length ) {
		return undefined;
	}

	// Process each HTML input element to classify PII.
	const detectedFields = formFields
		.map( ( input ) => {
			// Skip hidden fields to avoid false positives.
			if ( input.type === 'hidden' ) {
				return null;
			}

			// Get label text from associated label element.
			const label = input.id
				? document.querySelector( `label[for='${ input.id }']` )
						?.textContent
				: input.placeholder || '';

			return classifyPII( {
				type: input.type,
				name: input.name,
				value: input.value,
				label,
			} );
		} )
		.filter( Boolean );

	// Use shared utility function to extract user data.
	return getUserData( detectedFields );
}
