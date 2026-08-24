/**
 * Popup Maker event provider script tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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

// This file only imports the script under test dynamically, so this marks it as
// a module. Without it the helpers below would sit in the global scope and clash
// with the identically named ones in `woocommerce.test.js`.
export {};

type FormSuccessHandler = (
	form: unknown,
	// eslint-disable-next-line sitekit/acronym-case
	args: { formProvider?: string; popupId?: string | number }
) => void;

/**
 * Creates a form holding a single email field.
 *
 * @since n.e.x.t
 *
 * @return {HTMLFormElement} A form for the success handler to read.
 */
function createFormWithEmail() {
	const form = document.createElement( 'form' );
	const input = document.createElement( 'input' );

	input.type = 'email';
	input.name = 'email';
	input.value = 'admin@example.com';
	form.appendChild( input );

	return form;
}

/**
 * Runs the event provider script and hands back what it bound to Popup Maker.
 *
 * The script reads the globals as it loads, and only then, so each case has to
 * import the module again.
 *
 * @since n.e.x.t
 *
 * @return {Object} The `gtagEvent` mock and the form success handler the script registered.
 */
async function loadEventScript() {
	const gtagEvent = jest.fn();
	let formSuccessHandler: FormSuccessHandler | undefined;

	// The script returns early when either global is missing, so both fakes
	// have to exist before the import below.
	global.jQuery = () => ( {} );
	global.PUM = {
		hooks: {
			addAction: ( name: string, handler: FormSuccessHandler ) => {
				if ( name === 'pum.integration.form.success' ) {
					formSuccessHandler = handler;
				}
			},
		},
	};
	global._googlesitekit = { gtagUserData: true, gtagEvent };

	await import( './popup-maker' );

	return { gtagEvent, formSuccessHandler: formSuccessHandler! };
}

describe( 'Popup Maker event provider', () => {
	afterEach( () => {
		global.jQuery = undefined;
		global.PUM = undefined;
		global._googlesitekit = undefined;
		jest.resetModules();
	} );

	it( 'should send user data when the form provider is not set', async () => {
		const { gtagEvent, formSuccessHandler } = await loadEventScript();

		formSuccessHandler( createFormWithEmail(), {} );

		expect( gtagEvent ).toHaveBeenCalledWith(
			'submit_lead_form',
			expect.objectContaining( {
				user_data: { email: 'admin@example.com' },
			} )
		);
	} );

	it( 'should send user data for a provider handled by no other script', async () => {
		const { gtagEvent, formSuccessHandler } = await loadEventScript();

		formSuccessHandler( createFormWithEmail(), {
			formProvider: 'gravityforms',
		} );

		expect( gtagEvent ).toHaveBeenCalledWith(
			'submit_lead_form',
			expect.objectContaining( {
				user_data: { email: 'admin@example.com' },
			} )
		);
	} );

	it( 'should not send user data for a provider that has its own script', async () => {
		const { gtagEvent, formSuccessHandler } = await loadEventScript();

		formSuccessHandler( createFormWithEmail(), {
			formProvider: 'wpforms',
		} );

		expect( gtagEvent ).toHaveBeenCalledWith( 'submit_lead_form', {
			googlesitekit_event_provider: 'popup-maker',
		} );
	} );
} );
