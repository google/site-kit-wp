/**
 * Reader Revenue Manager newsletter signup form step tests.
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
import { Registry } from '@/js/googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { EXPRESS_SETUP_STEP_UI_KEY } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { NEWSLETTER_SIGNUP_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTA_FORMS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	render,
	screen,
	waitFor,
} from '@tests/js/test-utils';
import StepSignupForm from './index';

const validSettings = {
	publicationID: 'ABCDEFGH',
	organizationID: 'ABCD1234',
	publicationOnboardingState: 'ONBOARDING_ACTION_REQUIRED',
	publicationOnboardingStateChanged: false,
	contentPolicyState: '',
	policyInfoLink: '',
	snippetMode: 'per_post',
	postTypes: [ 'post' ],
	productID: 'valid-id',
	productIDs: [ 'valid' ],
	paymentOption: 'valid-option',
};

const settingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
);

const createCTAEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-cta'
);

function renderStepSignupForm(
	formValues: Record< string, string | boolean > = {},
	registry: Registry = createTestRegistry() as Registry
) {
	provideSiteInfo( registry );

	const moduleData = [
		{
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			active: true,
			connected: true,
		},
	];

	provideModules( registry, moduleData );
	provideModuleRegistrations( registry, moduleData );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetSettings( validSettings );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.finishResolution( 'getSettings', [] );

	registry
		.dispatch( CORE_FORMS )
		.setValues( EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP, formValues );

	return render( <StepSignupForm />, { registry } );
}

describe( 'StepSignupForm', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		global.location.href = 'http://example.com/';
	} );

	it( 'should disable publish when the display name is empty', () => {
		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: '',
			},
			registry
		);

		expect(
			screen.getByRole( 'button', { name: 'Publish to your site' } )
		).toBeDisabled();
	} );

	it( 'should disable publish when consent is enabled without consent text', () => {
		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
				[ NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED ]: true,
				[ NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT ]: '',
			},
			registry
		);

		expect(
			screen.getByRole( 'button', { name: 'Publish to your site' } )
		).toBeDisabled();
	} );

	it( 'should disable publish while submission is in progress', async () => {
		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
			},
			registry
		);

		freezeFetch( createCTAEndpoint );

		const publishButton = screen.getByRole( 'button', {
			name: 'Publish to your site',
		} );

		fireEvent.click( publishButton );

		await waitFor( () => {
			expect( publishButton ).toBeDisabled();
		} );
	} );

	it( 'should display an error notice when submitChanges fails', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( validSettings );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setSnippetMode( 'post_types' );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPostTypes( [ 'post', 'page' ] );

		fetchMock.postOnce( settingsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Settings save failed',
				data: { status: 500 },
			},
			status: 500,
		} );

		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
			},
			registry
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Publish to your site' } )
		);

		await waitFor( () => {
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				/Settings save failed/
			);
		} );

		expect( fetchMock ).not.toHaveFetched( createCTAEndpoint );
		expect( console ).toHaveErrored();
	} );

	it( 'should display an error notice when createCTA fails', async () => {
		fetchMock.postOnce( createCTAEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'CTA creation failed',
				data: { status: 500 },
			},
			status: 500,
		} );

		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
			},
			registry
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Publish to your site' } )
		);

		await waitFor( () => {
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				/CTA creation failed/
			);
		} );

		expect(
			registry.select( CORE_UI ).getValue( EXPRESS_SETUP_STEP_UI_KEY )
		).not.toBe( EXPRESS_SETUP_STEPS.SETUP_COMPLETE );

		expect( console ).toHaveErrored();
	} );

	it( 'should call submitChanges and createCTA on successful publish', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( validSettings );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setSnippetMode( 'post_types' );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPostTypes( [ 'post', 'page' ] );

		fetchMock.postOnce( settingsEndpoint, {
			body: {
				...validSettings,
				snippetMode: 'post_types',
				postTypes: [ 'post', 'page' ],
			},
			status: 200,
		} );

		fetchMock.postOnce( createCTAEndpoint, {
			body: {
				name: 'organizations/ABCD1234/publications/ABCDEFGH/ctas/1',
				type: CTA_TYPES.NEWSLETTER_SIGNUP,
			},
			status: 200,
		} );

		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: '  My newsletter  ',
				[ NEWSLETTER_SIGNUP_FORM.CTA_TITLE ]: '  Subscribe  ',
				[ NEWSLETTER_SIGNUP_FORM.CTA_BODY ]: '  Join us  ',
				[ NEWSLETTER_SIGNUP_FORM.NAME_REQUIRED ]: true,
				[ NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED ]: true,
				[ NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT ]: '  I agree  ',
			},
			registry
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Publish to your site' } )
		);

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( settingsEndpoint );
			expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
				body: {
					data: {
						data: {
							displayName: 'My newsletter',
							type: CTA_TYPES.NEWSLETTER_SIGNUP,
							config: {
								title: 'Subscribe',
								customMessage: 'Join us',
								nameRequired: true,
								customConsentText: 'I agree',
							},
						},
					},
				},
			} );
		} );
	} );

	it( 'should navigate to setup complete on successful publish', async () => {
		fetchMock.postOnce( createCTAEndpoint, {
			body: {
				name: 'organizations/ABCD1234/publications/ABCDEFGH/ctas/1',
				type: CTA_TYPES.NEWSLETTER_SIGNUP,
			},
			status: 200,
		} );

		renderStepSignupForm(
			{
				[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
			},
			registry
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Publish to your site' } )
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( EXPRESS_SETUP_STEP_UI_KEY )
			).toBe( EXPRESS_SETUP_STEPS.SETUP_COMPLETE );
		} );
	} );
} );
