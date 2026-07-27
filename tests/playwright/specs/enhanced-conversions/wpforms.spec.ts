/**
 * WPForms Enhanced Conversions Playwright tests.
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
 * Internal dependencies
 */
import { expect, test } from '../../playwright';
import {
	asUser,
	withConnectedModules,
	withConversionTracking,
	withFeatureFlags,
	withPlugins,
} from '../../wordpress';
import { FormsPage, type GTagEventPayload } from './forms-page';

const SAMPLE_FORM_DATA = {
	email: {
		label: 'Email Address',
		normalizedValue: 'test.user@example.com',
		value: 'Test.User@Example.COM',
	},
	firstName: {
		label: 'First',
		normalizedValue: 'jane',
		value: 'Jane',
	},
	lastName: {
		label: 'Last',
		normalizedValue: 'doe-smith',
		value: 'Doe-SMITH',
	},
	phone: {
		label: 'Phone Number',
		normalizedValue: '+15551234567',
		value: '+1 (555) 123-4567',
	},
};

const plugins = withPlugins(
	'proxy-auth.php',
	'enhanced-conversions.php',
	'wpforms-lite/wpforms.php'
);
const anonymousUser = asUser( 'does-not-exist' );
const withUserDataFlag = withFeatureFlags( 'gtagUserData' );
const conversionTracking = withConversionTracking();
const adsConnected = withConnectedModules( {
	slug: 'ads',
	settings: {
		accountOverviewURL: '',
		conversionID: 'AW-123456789',
		customerID: '',
		extCustomerID: '',
		formattedExtCustomerID: '',
		paxConversionID: '',
		userID: '',
	},
} );

async function waitForGTagEvent(
	page: FormsPage,
	eventName: string
): Promise< GTagEventPayload > {
	await expect.poll( () => page.getGTagEvent( eventName ) ).not.toBeNull();

	return ( await page.getGTagEvent( eventName ) ) as GTagEventPayload;
}

test.describe(
	'WPForms Enhanced Conversions',
	{ annotation: [ plugins, anonymousUser ] },
	() => {
		test.beforeEach( async ( { wp } ) => {
			await wp.visitFrontend();
		} );

		test(
			'should send normalized user data for the email-only form',
			{
				annotation: [
					withUserDataFlag,
					conversionTracking,
					adsConnected,
				],
			},
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-email/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [ SAMPLE_FORM_DATA.email ] );

				const payload = await waitForGTagEvent(
					page,
					'submit_lead_form'
				);

				expect( payload ).toMatchObject( {
					event_source: 'site-kit',
					googlesitekit_event_provider: 'wpforms',
					user_data: {
						email: SAMPLE_FORM_DATA.email.normalizedValue,
					},
				} );
				expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
			}
		);

		test(
			'should send normalized user data for the name-only form',
			{
				annotation: [
					withUserDataFlag,
					conversionTracking,
					adsConnected,
				],
			},
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-name/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [
					SAMPLE_FORM_DATA.firstName,
					SAMPLE_FORM_DATA.lastName,
				] );

				const payload = await waitForGTagEvent(
					page,
					'submit_lead_form'
				);

				expect( payload ).toMatchObject( {
					event_source: 'site-kit',
					googlesitekit_event_provider: 'wpforms',
					user_data: {
						address: {
							first_name:
								SAMPLE_FORM_DATA.firstName.normalizedValue,
							last_name:
								SAMPLE_FORM_DATA.lastName.normalizedValue,
						},
					},
				} );
				expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
			}
		);

		test(
			'should send normalized user data for the phone-only form',
			{
				annotation: [
					withUserDataFlag,
					conversionTracking,
					adsConnected,
				],
			},
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-phone/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [ SAMPLE_FORM_DATA.phone ] );

				const payload = await waitForGTagEvent(
					page,
					'submit_lead_form'
				);

				expect( payload ).toMatchObject( {
					event_source: 'site-kit',
					googlesitekit_event_provider: 'wpforms',
					user_data: {
						phone_number: SAMPLE_FORM_DATA.phone.normalizedValue,
					},
				} );
				expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
			}
		);

		test(
			'should send normalized user data for the all-fields form',
			{
				annotation: [
					withUserDataFlag,
					conversionTracking,
					adsConnected,
				],
			},
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [
					SAMPLE_FORM_DATA.email,
					SAMPLE_FORM_DATA.firstName,
					SAMPLE_FORM_DATA.lastName,
					SAMPLE_FORM_DATA.phone,
				] );

				const payload = await waitForGTagEvent(
					page,
					'submit_lead_form'
				);

				expect( payload ).toMatchObject( {
					event_source: 'site-kit',
					googlesitekit_event_provider: 'wpforms',
					user_data: {
						address: {
							first_name:
								SAMPLE_FORM_DATA.firstName.normalizedValue,
							last_name:
								SAMPLE_FORM_DATA.lastName.normalizedValue,
						},
						email: SAMPLE_FORM_DATA.email.normalizedValue,
						phone_number: SAMPLE_FORM_DATA.phone.normalizedValue,
					},
				} );
				expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
			}
		);

		test(
			'should send the form event without user data when the feature flag is disabled',
			{ annotation: [ conversionTracking, adsConnected ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [
					SAMPLE_FORM_DATA.email,
					SAMPLE_FORM_DATA.firstName,
					SAMPLE_FORM_DATA.lastName,
					SAMPLE_FORM_DATA.phone,
				] );

				const payload = await waitForGTagEvent(
					page,
					'submit_lead_form'
				);

				expect( payload ).toMatchObject( {
					event_source: 'site-kit',
					googlesitekit_event_provider: 'wpforms',
				} );
				expect( payload.googlesitekit_form_id ).toMatch( /^\d+$/ );
				expect( payload ).not.toHaveProperty( 'user_data' );
			}
		);

		test(
			'should not send a form event when conversion tracking is disabled',
			{ annotation: [ withUserDataFlag, adsConnected ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [
					SAMPLE_FORM_DATA.email,
					SAMPLE_FORM_DATA.firstName,
					SAMPLE_FORM_DATA.lastName,
					SAMPLE_FORM_DATA.phone,
				] );

				expect(
					await page.getGTagEvent( 'submit_lead_form' )
				).toBeNull();
			}
		);

		test(
			'should not send a form event when no GTag-using module is connected',
			{ annotation: [ withUserDataFlag, conversionTracking ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const page = new FormsPage( wp.page );
				await page.fillAndSubmit( [
					SAMPLE_FORM_DATA.email,
					SAMPLE_FORM_DATA.firstName,
					SAMPLE_FORM_DATA.lastName,
					SAMPLE_FORM_DATA.phone,
				] );

				expect(
					await page.getGTagEvent( 'submit_lead_form' )
				).toBeNull();
			}
		);
	}
);
