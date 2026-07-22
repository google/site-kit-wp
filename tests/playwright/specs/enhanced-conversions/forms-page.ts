/**
 * Enhanced Conversions forms page object.
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

/**
 * External dependencies
 */
import { type Page, expect } from '@playwright/test';

/**
 * Internal dependencies
 */
import { getGTagEvent, waitForGTagEvent } from './utils';

type SampleFormField = {
	label: string;
	rawValue: string;
	normalizedValue: string;
};

const SAMPLE_FORM_DATA: Record< string, SampleFormField > = {
	email: {
		label: 'Email Address',
		normalizedValue: 'test.user@example.com',
		rawValue: 'Test.User@Example.COM',
	},
	firstName: {
		label: 'First',
		normalizedValue: 'jane',
		rawValue: 'Jane',
	},
	lastName: {
		label: 'Last',
		normalizedValue: 'doe-smith',
		rawValue: 'Doe-SMITH',
	},
	phone: {
		label: 'Phone Number',
		normalizedValue: '+15551234567',
		rawValue: '+1 (555) 123-4567',
	},
};

/**
 * Page object for completing and submitting frontend forms by their accessible
 * field labels. The model intentionally contains no plugin-specific selectors.
 */
export class FormsPage {
	private readonly page: Page;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param page The page.
	 */
	constructor( page: Page ) {
		this.page = page;
	}

	/**
	 * Fills a form field with its raw sample value.
	 *
	 * @since n.e.x.t
	 *
	 * @param field The sample field data.
	 * @return A promise that resolves when the field is filled.
	 */
	async fillField( field: SampleFormField ): Promise< void > {
		await this.page.getByLabel( field.label ).fill( field.rawValue );
	}

	/**
	 * Fills the supplied fields and submits the form.
	 *
	 * @since n.e.x.t
	 *
	 * @param fields The fields to fill before submitting.
	 * @return A promise that resolves when the submission request succeeds.
	 */
	private async fillAndSubmit( fields: SampleFormField[] ): Promise< void > {
		for ( const field of fields ) {
			await this.fillField( field );
		}

		const submissionResponse = this.page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' && response.ok()
		);

		await this.page
			.getByRole( 'button', { name: 'Submit', exact: true } )
			.click();
		await submissionResponse;
	}

	/**
	 * Verifies the Enhanced Conversions event for the email-only form.
	 *
	 * @since n.e.x.t
	 *
	 * @return A promise that resolves when the event is verified.
	 */
	async verifyEmailFormEvent(): Promise< void > {
		await this.fillAndSubmit( [ SAMPLE_FORM_DATA.email ] );

		const payload = await waitForGTagEvent( this.page, 'submit_lead_form' );

		expect( payload ).toMatchObject( {
			event_source: 'site-kit',
			googlesitekit_event_provider: 'wpforms',
			user_data: {
				email: SAMPLE_FORM_DATA.email.normalizedValue,
			},
		} );
		expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
	}

	/**
	 * Verifies the Enhanced Conversions event for the name-only form.
	 *
	 * @since n.e.x.t
	 *
	 * @return A promise that resolves when the event is verified.
	 */
	async verifyNameFormEvent(): Promise< void > {
		await this.fillAndSubmit( [
			SAMPLE_FORM_DATA.firstName,
			SAMPLE_FORM_DATA.lastName,
		] );

		const payload = await waitForGTagEvent( this.page, 'submit_lead_form' );

		expect( payload ).toMatchObject( {
			event_source: 'site-kit',
			googlesitekit_event_provider: 'wpforms',
			user_data: {
				address: {
					first_name: SAMPLE_FORM_DATA.firstName.normalizedValue,
					last_name: SAMPLE_FORM_DATA.lastName.normalizedValue,
				},
			},
		} );
		expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
	}

	/**
	 * Verifies the Enhanced Conversions event for the phone-only form.
	 *
	 * @since n.e.x.t
	 *
	 * @return A promise that resolves when the event is verified.
	 */
	async verifyPhoneFormEvent(): Promise< void > {
		await this.fillAndSubmit( [ SAMPLE_FORM_DATA.phone ] );

		const payload = await waitForGTagEvent( this.page, 'submit_lead_form' );

		expect( payload ).toMatchObject( {
			event_source: 'site-kit',
			googlesitekit_event_provider: 'wpforms',
			user_data: {
				phone_number: SAMPLE_FORM_DATA.phone.normalizedValue,
			},
		} );
		expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
	}

	/**
	 * Verifies the Enhanced Conversions event for the all-fields form.
	 *
	 * @since n.e.x.t
	 *
	 * @return A promise that resolves when the event is verified.
	 */
	async verifyAllFieldsFormEvent(): Promise< void > {
		await this.fillAndSubmit( [
			SAMPLE_FORM_DATA.email,
			SAMPLE_FORM_DATA.firstName,
			SAMPLE_FORM_DATA.lastName,
			SAMPLE_FORM_DATA.phone,
		] );

		const payload = await waitForGTagEvent( this.page, 'submit_lead_form' );

		expect( payload ).toMatchObject( {
			event_source: 'site-kit',
			googlesitekit_event_provider: 'wpforms',
			user_data: {
				address: {
					first_name: SAMPLE_FORM_DATA.firstName.normalizedValue,
					last_name: SAMPLE_FORM_DATA.lastName.normalizedValue,
				},
				email: SAMPLE_FORM_DATA.email.normalizedValue,
				phone_number: SAMPLE_FORM_DATA.phone.normalizedValue,
			},
		} );
		expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
	}

	/**
	 * Verifies the form event does not contain Enhanced Conversions user data.
	 *
	 * @since n.e.x.t
	 *
	 * @return A promise that resolves when the event is verified.
	 */
	async verifyFormEventWithoutUserData(): Promise< void > {
		await this.fillAndSubmit( [
			SAMPLE_FORM_DATA.email,
			SAMPLE_FORM_DATA.firstName,
			SAMPLE_FORM_DATA.lastName,
			SAMPLE_FORM_DATA.phone,
		] );

		const payload = await waitForGTagEvent( this.page, 'submit_lead_form' );

		expect( payload ).toMatchObject( {
			event_source: 'site-kit',
			googlesitekit_event_provider: 'wpforms',
		} );
		expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
		expect( payload ).not.toHaveProperty( 'user_data' );
	}

	/**
	 * Verifies no form event is sent after submitting the all-fields form.
	 *
	 * @since n.e.x.t
	 *
	 * @return A promise that resolves when the missing event is verified.
	 */
	async verifyNoFormEvent(): Promise< void > {
		await this.fillAndSubmit( [
			SAMPLE_FORM_DATA.email,
			SAMPLE_FORM_DATA.firstName,
			SAMPLE_FORM_DATA.lastName,
			SAMPLE_FORM_DATA.phone,
		] );

		expect(
			await getGTagEvent( this.page, 'submit_lead_form' )
		).toBeNull();
	}
}
