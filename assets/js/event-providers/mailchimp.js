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

( ( mc4wp ) => {
	if ( ! mc4wp ) {
		return;
	}

	mc4wp.forms.on( 'subscribed', () => {
		global._googlesitekit?.gtagEvent?.( 'submit_lead_form', {
			event_category: 'mailchimp',
		} );
	} );
} )( global.mc4wp );
