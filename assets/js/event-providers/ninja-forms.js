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
import { classifyPII, normalizeValue, PII_TYPE } from './utils';

( ( jQuery, Marionette, Backbone ) => {
	// eslint-disable-next-line no-undef
	if ( ! jQuery || ! Marionette || ! Backbone ) {
		return;
	}

	// eslint-disable-next-line no-undef
	const ninjaFormEventController = Marionette.Object.extend( {
		initialize() {
			this.listenTo(
				// eslint-disable-next-line no-undef
				Backbone.Radio.channel( 'forms' ),
				'submit:response',
				this.actionSubmit
			);
		},

		actionSubmit( event ) {
			const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

			const userData = gtagUserDataEnabled
				? getUserData( event.data.fields )
				: undefined;

			global._googlesitekit?.gtagEvent?.(
				'submit_lead_form',
				userData ? { user_data: userData } : undefined
			);
		},
	} );

	jQuery( document ).ready( () => {
		new ninjaFormEventController();
	} );
} )( global.jQuery, global.Marionette, global.Backbone );

const NINJA_FORMS_TYPES = {
	phone: 'tel',
	textbox: 'text',
};

/**
 * Extracts and classifies user data from a Ninja Forms form submission.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields The submitted NF form' fields.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserData( fields ) {
	const detectedFields = Object.values( fields )
		.map( ( field ) => {
			const { label, type: nfType, value, key: name } = field;

			// Ninja Forms types are not standard HTML input types, so we map them before giving calling classifyPII which relies on standard HTML types
			const type = NINJA_FORMS_TYPES[ nfType ] ?? nfType;

			return classifyPII( {
				label,
				type,
				value,
				name,
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
