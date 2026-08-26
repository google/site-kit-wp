/**
 * Reader Revenue Manager connect publication component tests.
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
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	providePublications,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import ConnectPublication from './ConnectPublication';

const TEST_DEFAULT_PUBLICATION = publications[ publications.length - 1 ];
const TEST_PUBLICATION_WITH_ACCEPTED_TERMS = publications[ 3 ];
const TEST_PUBLICATION_WITHOUT_ACCEPTED_TERMS = publications[ 2 ];

describe( 'ConnectPublication', () => {
	let registry: Registry;

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	mockLocation();

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideSiteInfo( registry );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );
		providePublications( registry, publications );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				configuredCTAs: {},
				postTypes: [ 'post' ],
				snippetMode: 'post_types',
			} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`;
	} );

	it( 'should disable submission if no publications exist', () => {
		providePublications( registry, [] );

		const { getByRole } = render( <ConnectPublication />, {
			registry,
		} );

		expect(
			getByRole( 'button', { name: 'Connect existing publication' } )
		).toBeDisabled();
	} );

	it( 'should disable submission when submission is in progress', async () => {
		freezeFetch( settingsEndpoint );

		const { getByRole } = render( <ConnectPublication />, {
			registry,
		} );

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( submitButton ).toBeDisabled();
		} );
	} );

	it( 'should select a default publication on load', async () => {
		expect(
			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
		).toBeUndefined();

		const { container } = render( <ConnectPublication />, {
			registry,
		} );

		await waitFor( () => {
			const publicationID = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationID();

			expect( publicationID ).toBe(
				// eslint-disable-next-line sitekit/acronym-case
				TEST_DEFAULT_PUBLICATION.publicationId
			);

			const select = container.querySelector(
				'.mdc-select__selected-text'
			);

			expect( select ).toHaveTextContent( publicationID );
		} );
	} );

	it( 'should navigate to the publication policies step on success if terms have been accepted', async () => {
		fetchMock.postOnce( settingsEndpoint, {} );

		providePublications( registry, [
			TEST_PUBLICATION_WITH_ACCEPTED_TERMS,
		] );

		const { getByRole } = render( <ConnectPublication />, {
			registry,
		} );

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( global.location.href ).toContain(
				`step=${ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES }`
			);
		} );

		expect( fetchMock ).toHaveFetched( settingsEndpoint );
	} );

	it( 'should navigate to the terms of service step if the terms have not been accepted', async () => {
		fetchMock.postOnce( settingsEndpoint, {} );

		providePublications( registry, [
			TEST_PUBLICATION_WITHOUT_ACCEPTED_TERMS,
		] );

		const { getByRole } = render( <ConnectPublication />, {
			registry,
		} );

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( global.location.href ).toContain(
				`step=${ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE }`
			);
		} );

		expect( fetchMock ).toHaveFetched( settingsEndpoint );
	} );

	it( 'should display an error notice if the submission fails', async () => {
		fetchMock.postOnce( settingsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole } = render( <ConnectPublication />, {
			registry,
		} );

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect( global.location.href ).toContain(
			`step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`
		);

		expect( console ).toHaveErrored();
	} );

	it.each( [
		[ 'en', 'English', 'US', 'United States' ],
		[ 'zh', 'Chinese', 'CN', 'China' ],
		[ 'abc', 'abc', 'xyz', 'xyz' ],
		[ undefined, 'Unknown', undefined, 'Unknown' ],
	] )(
		'should display language code %s as %s and region code %s as %s',
		async ( languageCode, language, regionCode, region ) => {
			const publicationID = 'ABCDE';

			providePublications( registry, [
				{
					languageCode,
					/* eslint-disable-next-line sitekit/acronym-case */
					publicationId: publicationID,
					onboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					regionCode,
				},
			] );

			const { container } = render( <ConnectPublication />, {
				registry,
			} );

			await waitFor( () => {
				const descriptions = container.querySelectorAll(
					'.googlesitekit-rrm-publication-setup-details__item'
				);

				expect( descriptions.length ).toBe( 2 );
				expect( descriptions[ 0 ] ).toHaveTextContent( language );
				expect( descriptions[ 1 ] ).toHaveTextContent( region );
			} );
		}
	);

	it.each( [
		{
			cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
			description:
				'To set up a newsletter sign-up form using Reader Revenue Manager, connect your publication or create a new one.',
		},
		{
			cta: undefined,
			description:
				'To use Reader Revenue Manager, connect your publication or create a new one.',
		},
	] )(
		'should renders the expected description when the CTA is $cta',
		async ( { cta, description } ) => {
			global.location.href = cta
				? `http://example.com/?cta=${ cta }&step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`
				: `http://example.com/?step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`;

			const { getByText } = render( <ConnectPublication />, {
				registry,
			} );

			await waitFor( () => {
				expect( getByText( description ) ).toBeInTheDocument();
			} );
		}
	);
} );
