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

		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`;
	} );

	it( 'should disable submission if no publications exist', async () => {
		providePublications( registry, [] );

		const { getByRole, waitForRegistry } = render( <ConnectPublication />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByRole( 'button', { name: 'Connect existing publication' } )
		).toBeDisabled();
	} );

	it( 'should disable submission if submission is already in progress', async () => {
		freezeFetch( settingsEndpoint );

		const { getByRole } = render( <ConnectPublication />, {
			registry,
		} );

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.isDoingSubmitChanges()
			).toBe( true );
		} );

		expect( submitButton ).toBeDisabled();
	} );

	it( 'should select a publication on load', async () => {
		expect(
			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
		).toBeUndefined();

		const { container } = render( <ConnectPublication />, {
			registry,
		} );

		await waitFor( () => {
			const select = container.querySelector(
				'.mdc-select__selected-text'
			);

			const publicationID = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationID();

			expect( select ).toHaveTextContent( publicationID );
		} );
	} );

	it( 'should navigate to the publication policies step on successful submission', async () => {
		fetchMock.postOnce( settingsEndpoint, {} );

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

		const publication = publications.find(
			( p ) => p.rrmProduct.tosAcceptance.userAccepted === false
		);

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.selectPublication( publication );

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
			body: {},
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
				/Connecting your publication failed/
			);
		} );

		expect( global.location.href ).toContain(
			`step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`
		);

		expect( console ).toHaveErrored();
	} );

	it( 'should navigate to the next step if a retry is successful', async () => {
		fetchMock
			.postOnce( settingsEndpoint, {
				body: {},
				status: 500,
			} )
			.postOnce( settingsEndpoint, { body: {}, status: 200 } );

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
				/Connecting your publication failed/
			);
		} );

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () => {
			expect( global.location.href ).toContain(
				`step=${ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES }`
			);
		} );

		expect( fetchMock ).toHaveFetchedTimes( 2, settingsEndpoint );
		expect( console ).toHaveErrored();
	} );

	it.each( [
		[ 'en', 'English', 'US', 'United States' ],
		[ 'zh', 'Chinese', 'CN', 'China' ],
		[ 'abc', 'abc', 'xyz', 'xyz' ],
		[ undefined, 'Unknown', undefined, 'Unknown' ],
	] )(
		'should display %s language code as %s and %s region code as %s',
		async ( languageCode, language, regionCode, region ) => {
			providePublications( registry, [
				{
					languageCode,
					/* eslint-disable-next-line sitekit/acronym-case */
					publicationId: 'ABCDE',
					onboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					regionCode,
				},
			] );

			const { container } = render( <ConnectPublication />, {
				registry,
			} );

			await waitFor( () => {
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toBe( 'ABCDE' );
			} );

			const descriptions = container.querySelectorAll(
				'.googlesitekit-rrm-publication-setup-details__item'
			);

			expect( descriptions.length ).toBe( 2 );
			expect( descriptions[ 0 ] ).toHaveTextContent( language );
			expect( descriptions[ 1 ] ).toHaveTextContent( region );
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
		'renders the expected description when the CTA is $cta',
		async ( { cta, description } ) => {
			global.location.href = cta
				? `http://example.com/?cta=${ cta }&step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`
				: `http://example.com/?step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`;

			const { getByText } = render( <ConnectPublication />, {
				registry,
			} );

			expect( getByText( description ) ).toBeInTheDocument();

			await waitFor( () => {
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toBeDefined();
			} );
		}
	);
} );
