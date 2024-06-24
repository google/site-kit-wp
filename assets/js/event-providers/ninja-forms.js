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

( ( jQuery ) => {
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

		actionSubmit( response ) {
			global._googlesitekit?.gtagEvent?.( 'submit_lead_form', {
				event_category: response.data.form_id,
			} );
		},
	} );

	jQuery( document ).ready( function () {
		new ninjaFormEventController();
	} );
} )( global.jQuery );
