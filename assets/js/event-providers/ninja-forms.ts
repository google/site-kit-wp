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
import { classifyPII, ClassifiedField, getUserData } from './utils';

interface NinjaFormField {
	label?: string;
	type?: string;
	value?: unknown;
	key?: string;
}

interface NinjaSubmitEvent {
	data: { fields: Record< string, NinjaFormField > };
}

( (
	jQuery: typeof global.jQuery,
	Marionette: typeof global.Marionette,
	Backbone: typeof global.Backbone
) => {
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

		actionSubmit( event: NinjaSubmitEvent ) {
			const gtagUserDataEnabled = global._googlesitekit?.gtagUserData;

			const userData = gtagUserDataEnabled
				? getUserDataFromNinjaFormFields( event.data.fields )
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

const NINJA_FORMS_TYPES: Record< string, string > = {
	phone: 'tel',
	textbox: 'text',
};

/**
 * Extracts and classifies user data from a Ninja Forms form submission.
 *
 * @since 1.162.0 Renamed to `getUserDataFromNinjaFormFields` because `getUserData` was extracted into a generic utility function.
 *
 * @param {Object<string, Object>} fields The submitted Ninja Form fields.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
function getUserDataFromNinjaFormFields(
	fields: Record< string, NinjaFormField >
) {
	const detectedFields = Object.values( fields )
		.map( ( field ) => {
			const { label, type: nfType, value, key: name } = field;

			// Ninja Forms types are not standard HTML input types, so we map them before calling classifyPII, which relies on standard HTML types.
			const type = ( nfType && NINJA_FORMS_TYPES[ nfType ] ) || nfType;

			return classifyPII( {
				label,
				type,
				value,
				name,
			} );
		} )
		.filter( ( field ): field is ClassifiedField => Boolean( field ) );

	return getUserData( detectedFields );
}
