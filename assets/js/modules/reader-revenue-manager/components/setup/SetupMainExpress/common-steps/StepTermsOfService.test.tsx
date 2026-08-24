/**
 * Reader Revenue Manager express setup terms of service step tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import StepTermsOfService from './StepTermsOfService';

/* eslint-disable sitekit/acronym-case -- Publication API fixtures use normalized API field names. */

const organizationID = 'organization-1';
const publicationID = 'publication-1';
const tosURL = 'https://example.com/terms';
const termsOfService = '<h1>RRM Terms</h1><p>These are the terms.</p>';

const termsOfServiceEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/terms-of-service'
);
const publicationEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication(?:\\?|$)'
);

function setupRegistry( { withTermsOfService = true } = {} ) {
	const registry = createTestRegistry();

	provideSiteInfo( registry );

	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		organizationID,
		publicationID,
	} );
	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetPublication(
		{
			publicationId: publicationID,
			organizationId: organizationID,
			onboardingState: 'ONBOARDING_ACTION_REQUIRED',
			rrmProduct: {
				productTosUrl: tosURL,
			},
		},
		{ organizationID, publicationID }
	);

	if ( withTermsOfService ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetTermsOfService( termsOfService, { tosURL } );
	}

	return registry;
}

describe( 'StepTermsOfService', () => {
	mockLocation();

	it( 'renders the Terms of Service step content', () => {
		const registry = setupRegistry();

		render( <StepTermsOfService />, { registry } );

		expect(
			screen.getByRole( 'heading', { name: 'Terms of service' } )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.'
			)
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Learn more' ).closest( 'a' )
		).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=rrm-publication-tos'
		);
		expect( screen.getByText( 'RRM Terms' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'These are the terms.' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'radio', { name: 'For profit' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'Non-profit' } )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
			} )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'button', { name: 'I agree' } )
		).toBeInTheDocument();
	} );

	it( 'renders the progress bar while Terms of Service content is loading', () => {
		const registry = setupRegistry( { withTermsOfService: false } );

		fetchMock.getOnce( termsOfServiceEndpoint, new Promise( () => {} ) );

		render( <StepTermsOfService />, { registry } );

		expect( screen.getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'renders an error when Terms of Service content fails to load', async () => {
		const registry = setupRegistry( { withTermsOfService: false } );

		fetchMock.getOnce( termsOfServiceEndpoint, {
			body: {
				code: 'terms_of_service_request_failed',
				message: 'The Terms of Service could not be retrieved.',
			},
			status: 500,
		} );

		render( <StepTermsOfService />, { registry } );

		await waitFor( () => {
			expect(
				screen.getByText(
					'The Terms of Service could not be retrieved. (Please try again.)'
				)
			).toBeInTheDocument();
		} );
		expect( console ).toHaveErrored();
	} );

	it( 'submits acceptance and navigates to the publication policies step', async () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE }`;
		const registry = setupRegistry();

		fetchMock.postOnce( publicationEndpoint, {
			body: {
				publicationId: publicationID,
				rrmProduct: {
					tosAcceptance: {
						userAccepted: true,
					},
				},
			},
			status: 200,
		} );

		render( <StepTermsOfService />, { registry } );

		fireEvent.click( screen.getByRole( 'radio', { name: 'Non-profit' } ) );
		fireEvent.click(
			screen.getByRole( 'checkbox', {
				name: 'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
			} )
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'I agree' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( publicationEndpoint );
		} );

		expect( fetchMock ).toHaveFetched( publicationEndpoint, {
			body: {
				data: {
					organizationID,
					publicationID,
					data: {
						publicationType: 'NON_PROFIT',
						rrmProduct: {
							tosAcceptance: {
								emailOptIn: true,
								userAccepted: true,
							},
						},
					},
				},
			},
		} );
		expect( global.location.href ).toContain(
			`step=${ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES }`
		);
	} );

	it( 'renders a submission error and keeps user selections intact', async () => {
		const registry = setupRegistry();

		fetchMock.postOnce( publicationEndpoint, {
			body: {
				code: 'publication_update_failed',
				message: 'The publication could not be updated.',
			},
			status: 500,
		} );

		render( <StepTermsOfService />, { registry } );

		fireEvent.click( screen.getByRole( 'radio', { name: 'Non-profit' } ) );
		fireEvent.click(
			screen.getByRole( 'checkbox', {
				name: 'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
			} )
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'I agree' } ) );

		await waitFor( () => {
			expect(
				screen.getByText(
					'The publication could not be updated. (Please try again.)'
				)
			).toBeInTheDocument();
		} );
		expect( console ).toHaveErrored();

		expect(
			screen.getByRole( 'radio', { name: 'Non-profit' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
			} )
		).toBeChecked();
	} );
} );
