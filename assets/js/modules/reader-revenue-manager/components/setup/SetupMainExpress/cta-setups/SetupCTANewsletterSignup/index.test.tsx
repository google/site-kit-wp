/**
 * Reader Revenue Manager SetupCTANewsletterSignup component tests.
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
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import {
	providePublication,
	providePublications,
} from '@/js/modules/reader-revenue-manager/utils/test-utils';
import * as tracking from '@/js/util/tracking';
import { decodeServiceURL } from '@tests/js/mock-accountChooserURL-utils';
import {
	mockIntersectionObserver,
	mockLocation,
} from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import SetupCTANewsletterSignup from './index';

jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/PoweredBy',
	() => () => null
);

// Renders the real publication setup step alongside a button that completes
// it, so that navigation can be tested without submitting the step's form.
jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup',
	() => {
		const { createElement, Fragment } =
			jest.requireActual( '@wordpress/element' );
		const actual = jest.requireActual(
			'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup'
		);

		return {
			...actual,
			publicationSetupStep: {
				...actual.publicationSetupStep,
				Component: ( props: { onComplete: () => void } ) =>
					createElement(
						Fragment,
						null,
						createElement( actual.default, props ),
						createElement(
							'button',
							{ onClick: props.onComplete, type: 'button' },
							'Test: complete step'
						)
					),
			},
		};
	}
);

const STEP_CONTENT = {
	'connect-publication':
		'To set up a newsletter sign-up form using Reader Revenue Manager, you will need to create a publication.',
	'terms-of-service':
		'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
	'publication-policies':
		'To set up a newsletter using Reader Revenue Manager, you will need to add links to your publication’s policies.',
	'newsletter-signup-form': 'Set up your sign-up form',
	'setup-complete': 'Your newsletter signup form is ready!',
};

// Has accepted the terms of service and set both policy URLs.
const completePublication = publications[ 3 ] as Publication;

// Has not accepted the terms of service.
const publicationWithoutTerms = publications[ 2 ] as Publication;

/**
 * Connects the given publication with no CTAs.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object} registry    Registry to seed.
 * @param {Object} publication Publication to connect.
 * @return {void}
 */
function connectPublication( registry: Registry, publication: Publication ) {
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
		.setPublicationID( publication.publicationId );

	providePublications( registry, [ publication ] );

	// CTAs are keyed by the publication ID, so receive them after setting it.
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetCTAs( { ctas: [], params: {} } );
}

describe( 'SetupCTANewsletterSignup', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideUserAuthentication( registry, {
			grantedScopes: EXPRESS_SETUP_SCOPES,
		} );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { publicationID: '' } );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, [] );

		provideSiteInfo( registry );
	} );

	it( 'renders its steps in order, with the newsletter CTA step before setup complete', async () => {
		global.location.href = 'http://example.com/';

		connectPublication( registry, publicationWithoutTerms );

		const { container, waitForRegistry } = render(
			<SetupCTANewsletterSignup />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( steps ).toHaveLength( 5 );
		expect( steps[ 0 ] ).toHaveTextContent( 'Connect publication' );
		expect( steps[ 1 ] ).toHaveTextContent( 'Accept terms of service' );
		expect( steps[ 2 ] ).toHaveTextContent( 'Add publication policies' );
		expect( steps[ 3 ] ).toHaveTextContent( 'Set up a sign-up form' );
		expect( steps[ 4 ] ).toHaveTextContent( 'Setup complete' );
	} );

	describe( 'completing a step', () => {
		// `publications[ 2 ]` has not accepted the terms of service;
		// `publications[ 0 ]` has.
		it.each( [
			[
				'passes over the terms of service step when the terms are already accepted',
				publications[ 0 ],
				STEP_CONTENT[ 'publication-policies' ],
			],
			[
				'advances to the terms of service step when the terms are not accepted',
				publications[ 2 ],
				STEP_CONTENT[ 'terms-of-service' ],
			],
		] )( '%s', async ( _, publication, expectedContent ) => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=connect-publication';

			connectPublication( registry, publication as Publication );

			const { getByRole, getByText, waitForRegistry } = render(
				<SetupCTANewsletterSignup />,
				{ registry }
			);

			await waitForRegistry();

			fireEvent.click(
				getByRole( 'button', { name: 'Test: complete step' } )
			);

			await waitFor( () => {
				expect( getByText( expectedContent ) ).toBeInTheDocument();
			} );
		} );
	} );

	it.each( Object.entries( STEP_CONTENT ) )(
		'renders the %s step content',
		async ( step, content ) => {
			global.location.href = `http://example.com/?step=${ step }`;

			// Each step's copy depends on the connected publication.
			if ( step === 'terms-of-service' ) {
				connectPublication( registry, publicationWithoutTerms );
			} else if ( step !== 'connect-publication' ) {
				connectPublication( registry, completePublication );
			}

			const { getByText, queryByText } = render(
				<SetupCTANewsletterSignup />,
				{ registry }
			);

			await waitFor( () => {
				expect( getByText( content ) ).toBeInTheDocument();
			} );

			Object.entries( STEP_CONTENT )
				.filter( ( [ otherStep ] ) => otherStep !== step )
				.forEach( ( [ , otherContent ] ) => {
					expect(
						queryByText( otherContent )
					).not.toBeInTheDocument();
				} );
		}
	);

	it( 'redirects an unknown step to the first incomplete step', async () => {
		global.location.href = 'http://example.com/?step=unknown-step';

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { publicationID: '' } );

		const { getByText } = render( <SetupCTANewsletterSignup />, {
			registry,
		} );

		await waitFor( () => {
			expect(
				getByText( STEP_CONTENT[ 'connect-publication' ] )
			).toBeInTheDocument();
		} );

		expect( global.location.href ).toContain( 'step=connect-publication' );
	} );

	describe( 'while the initial step is unresolved', () => {
		const authenticationEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/authentication'
		);
		const settingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
		);
		const publicationEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication'
		);

		const errorResponse = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};

		const ERROR_TITLE = 'We couldn’t set up your sign-up form';

		/**
		 * Sets up a registry without resolved settings or publication.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Object}         [options]               Optional. Options.
		 * @param {Array.<string>} [options.grantedScopes] Optional. Granted scopes; omit to leave them loading.
		 * @return {void}
		 */
		function setupRegistry( {
			grantedScopes,
		}: { grantedScopes?: string[] } = {} ) {
			registry = createTestRegistry() as Registry;

			if ( grantedScopes ) {
				provideUserAuthentication( registry, { grantedScopes } );
			} else {
				freezeFetch( authenticationEndpoint );
			}

			const moduleData = [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			];

			provideModules( registry, moduleData );
			provideModuleRegistrations( registry, moduleData );
			providePublications( registry, [] );
		}

		/**
		 * Resolves the settings with the given publication ID.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {string} publicationID Publication ID.
		 * @return {void}
		 */
		function provideSettings( publicationID: string ) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID } );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.finishResolution( 'getSettings', [] );
		}

		/**
		 * Asserts that only the progress bar is rendered.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Element} container Rendered container.
		 * @return {void}
		 */
		function expectOnlyProgressBar( container: Element ) {
			expect(
				container.querySelector( '.mdc-linear-progress' )
			).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-stepper' )
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-rrm-express-setup-step__headline'
				)
			).not.toBeInTheDocument();
		}

		beforeEach( () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';
		} );

		it( 'should show only a progress bar while the settings are loading', () => {
			setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
			freezeFetch( settingsEndpoint );

			const { container } = render( <SetupCTANewsletterSignup />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while the connected publication is loading', () => {
			setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			provideSettings( publicationWithoutTerms.publicationId );
			freezeFetch( publicationEndpoint );

			const { container } = render( <SetupCTANewsletterSignup />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while the granted scopes are loading', () => {
			setupRegistry();
			provideSettings( '' );

			const { container } = render( <SetupCTANewsletterSignup />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while a required scope is missing, when no publication is connected', () => {
			setupRegistry( { grantedScopes: [] } );
			provideSettings( '' );

			const { container } = render( <SetupCTANewsletterSignup />, {
				registry,
			} );

			expectOnlyProgressBar( container );
		} );

		it( 'should show only a progress bar while a required scope is missing, when the publication request has failed', async () => {
			setupRegistry( { grantedScopes: [] } );
			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			provideSettings( publicationWithoutTerms.publicationId );

			fetchMock.getOnce( publicationEndpoint, {
				body: {
					code: 'forbidden',
					message: 'Missing required scopes.',
					data: { status: 403 },
				},
				status: 403,
			} );

			const { container, waitForRegistry } = render(
				<SetupCTANewsletterSignup />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched( publicationEndpoint );
			expect(
				registry.select( MODULES_READER_REVENUE_MANAGER ).hasErrors()
			).toBe( true );
			expectOnlyProgressBar( container );
			expect( console ).toHaveErrored();
		} );

		it.each( [
			[
				'settings',
				settingsEndpoint,
				() => undefined,
				{ publicationID: '' },
				'.googlesitekit-stepper__step--active',
			],
			[
				'connected publication',
				publicationEndpoint,
				() =>
					// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
					provideSettings( publicationWithoutTerms.publicationId ),
				publicationWithoutTerms,
				'.googlesitekit-stepper__step--active',
			],
		] )(
			'should show the error with a Retry button when the %s request fails, and recover once it succeeds',
			async (
				_,
				endpoint,
				provideData,
				successResponse,
				activeStepSelector
			) => {
				setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
				provideData();

				fetchMock.getOnce( endpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { container, getByRole, getByText } = render(
					<SetupCTANewsletterSignup />,
					{ registry }
				);

				await waitFor( () => {
					expect( getByText( ERROR_TITLE ) ).toBeInTheDocument();
				} );

				expect(
					getByText( /Internal server error/ )
				).toBeInTheDocument();
				expect(
					container.querySelector( '.mdc-linear-progress' )
				).not.toBeInTheDocument();
				expect(
					container.querySelector( '.googlesitekit-stepper' )
				).not.toBeInTheDocument();
				expect( console ).toHaveErrored();

				let respond: ( ( response: object ) => void ) | undefined;

				fetchMock.getOnce(
					endpoint,
					new Promise( ( resolve ) => {
						respond = resolve;
					} )
				);

				fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

				await waitFor( () => {
					expectOnlyProgressBar( container );
				} );

				expect(
					container.querySelector( '.googlesitekit-notice' )
				).not.toBeInTheDocument();

				await act( async () => {
					respond?.( { body: successResponse, status: 200 } );
					await waitFor( () => {
						expect(
							container.querySelector( activeStepSelector )
						).toBeInTheDocument();
					} );
				} );

				expect(
					container.querySelector( '.mdc-linear-progress' )
				).not.toBeInTheDocument();
				expect(
					container.querySelector(
						'.googlesitekit-rrm-express-setup__content'
					)
				).not.toBeEmptyDOMElement();
			}
		);

		it( 'should show the stepper and the step once the scopes are granted and the step has resolved', async () => {
			setupRegistry( { grantedScopes: EXPRESS_SETUP_SCOPES } );
			provideSettings( '' );

			const { container, waitForRegistry } = render(
				<SetupCTANewsletterSignup />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				container.querySelector( '.googlesitekit-stepper' )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-rrm-express-setup-step__headline'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-rrm-express-setup__content > .mdc-linear-progress'
				)
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'setup complete step', () => {
		// Publication with accepted terms of service.
		const publication = publications[ 3 ];

		/* eslint-disable sitekit/acronym-case */
		const organizationID = publication.organizationId;
		const publicationID = publication.publicationId;
		/* eslint-enable sitekit/acronym-case */

		const preExistingCTA = {
			name: `organizations/${ organizationID }/publications/${ publicationID }/ctas/1`,
			type: CTA_TYPES.NEWSLETTER_SIGNUP,
		};

		const newsletterCTA = {
			name: `organizations/${ organizationID }/publications/${ publicationID }/ctas/5`,
			type: CTA_TYPES.NEWSLETTER_SIGNUP,
		};

		const setupCompleteURL =
			'http://example.com/?cta=newsletter-signup&step=setup-complete';

		const searchEndpoint = new RegExp( '^/wp/v2/search' );

		let originalHref: string;

		function setupRegistry( {
			ctas = [ newsletterCTA ],
			snippetMode = 'sitewide',
			postTypes = [] as string[],
		} = {} ) {
			registry = createTestRegistry() as Registry;
			provideUserAuthentication( registry, {
				grantedScopes: EXPRESS_SETUP_SCOPES,
			} );
			provideSiteInfo( registry );
			provideUserInfo( registry );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					organizationID,
					publicationID,
					snippetMode,
					postTypes,
				} );

			providePublication( registry, publication );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetCTAs( { ctas, params: {} } );
		}

		beforeEach( () => {
			setupRegistry();

			originalHref = global.location.href;
			global.location.href = setupCompleteURL;
		} );

		afterEach( () => {
			global.location.href = originalHref;
		} );

		it( 'renders correctly without pre-existing CTAs', () => {
			const { container, queryByText } = render(
				<SetupCTANewsletterSignup />,
				{
					registry,
				}
			);

			expect( container ).toMatchSnapshot();

			expect( queryByText( 'Display order' ) ).not.toBeInTheDocument();
		} );

		it( 'renders correctly with pre-existing CTAs', () => {
			setupRegistry( { ctas: [ preExistingCTA, newsletterCTA ] } );

			const { container, getByText } = render(
				<SetupCTANewsletterSignup />,
				{
					registry,
				}
			);

			expect( container ).toMatchSnapshot();

			expect( getByText( 'Display order' ) ).toBeInTheDocument();
		} );

		describe( 'links', () => {
			it( 'links the display order detail to the Publisher Center overview', () => {
				setupRegistry( { ctas: [ preExistingCTA, newsletterCTA ] } );

				const { getAllByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				const [ overviewLink ] = getAllByRole( 'link', {
					name: /Publisher center/i,
				} );

				const serviceURL = new URL(
					decodeServiceURL(
						overviewLink.getAttribute( 'href' ) as string
					) as string
				);

				expect( serviceURL.origin ).toBe(
					'https://publishercenter.google.com'
				);
				expect( serviceURL.pathname ).toBe(
					'/reader-revenue-manager/content-access/overview'
				);
				expect( serviceURL.searchParams.get( 'publication' ) ).toBe(
					publicationID
				);
			} );

			it( 'links the content detail to the Publisher Center CTA edit screen', () => {
				const { getByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				const ctaEditLink = getByRole( 'link', {
					name: /Publisher center/i,
				} );

				const serviceURL = new URL(
					decodeServiceURL(
						ctaEditLink.getAttribute( 'href' ) as string
					) as string
				);

				expect( serviceURL.pathname ).toBe(
					'/reader-revenue-manager/content-access/ctas/newsletter/5'
				);
				expect( serviceURL.searchParams.get( 'publication' ) ).toBe(
					publicationID
				);
			} );

			it( 'links contact support to the plugin support forum', () => {
				const { getByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					getByRole( 'link', { name: /contact support/i } )
				).toHaveAttribute(
					'href',
					'https://wordpress.org/support/plugin/google-site-kit/'
				);
			} );
		} );

		describe( '"View on your site" CTA', () => {
			beforeEach( () => {
				jest.spyOn( global, 'open' ).mockImplementation( () => null );
			} );

			afterEach( () => {
				jest.restoreAllMocks();
			} );

			it( 'opens the front page for the sitewide snippet mode', () => {
				const { getByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					getByRole( 'button', { name: /View on your site/i } )
				).toBeInTheDocument();

				expect( global.open ).not.toHaveBeenCalled();

				fireEvent.click(
					getByRole( 'button', { name: /View on your site/i } )
				);

				expect( global.open ).toHaveBeenCalledWith(
					'http://example.com',
					'_blank'
				);
			} );

			it( 'opens the first matching post for the post_types snippet mode', async () => {
				fetchMock.getOnce( searchEndpoint, {
					body: [ { url: 'http://example.com/hello-world/' } ],
					status: 200,
				} );

				setupRegistry( {
					snippetMode: 'post_types',
					postTypes: [ 'post' ],
				} );

				const { findByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					await findByRole( 'button', {
						name: /View on your site/i,
					} )
				).toBeInTheDocument();

				expect( fetchMock ).toHaveFetched( searchEndpoint );
				expect( fetchMock.lastCall( searchEndpoint )?.[ 0 ] ).toContain(
					'subtype=post'
				);

				expect( global.open ).not.toHaveBeenCalled();

				fireEvent.click(
					await findByRole( 'button', {
						name: /View on your site/i,
					} )
				);

				expect( global.open ).toHaveBeenCalledWith(
					'http://example.com/hello-world/',
					'_blank'
				);
			} );

			it( 'is not rendered when no matching post can be resolved', async () => {
				fetchMock.getOnce( searchEndpoint, {
					body: [],
					status: 200,
				} );

				setupRegistry( {
					snippetMode: 'post_types',
					postTypes: [ 'post' ],
				} );

				const { queryByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				await waitFor( () =>
					expect( fetchMock ).toHaveFetched( searchEndpoint )
				);

				expect(
					queryByRole( 'button', { name: /View on your site/i } )
				).not.toBeInTheDocument();
			} );

			it( 'is not rendered for an unsupported snippet mode', () => {
				setupRegistry( { snippetMode: 'per_post' } );

				const { queryByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					queryByRole( 'button', { name: /View on your site/i } )
				).not.toBeInTheDocument();
			} );

			it( 'is not rendered when the publication has pre-existing CTAs', () => {
				setupRegistry( { ctas: [ preExistingCTA, newsletterCTA ] } );

				const { queryByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					queryByRole( 'button', { name: /View on your site/i } )
				).not.toBeInTheDocument();
			} );

			it( 'opens the resolved URL in a new tab', () => {
				const openSpy = jest
					.spyOn( global, 'open' )
					.mockImplementation( () => null );

				const { getByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				fireEvent.click(
					getByRole( 'button', { name: /View on your site/i } )
				);

				expect( openSpy ).toHaveBeenCalledWith(
					'http://example.com',
					'_blank'
				);

				openSpy.mockRestore();
			} );
		} );
	} );

	describe( 'event tracking', () => {
		const { simulateAllIntersections } = mockIntersectionObserver();

		const eventCategory = `${ VIEW_CONTEXT_MODULE_SETUP }_rrm-express-setup_newsletter-signup`;

		let mockTrackEvent: jest.SpyInstance;

		beforeEach( () => {
			mockTrackEvent = jest
				.spyOn( tracking, 'trackEvent' )
				.mockImplementation( () => Promise.resolve() );
		} );

		afterEach( () => {
			mockTrackEvent.mockRestore();
		} );

		it( 'should track the start of the setup', () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=terms-of-service';

			render( <SetupCTANewsletterSignup />, {
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'start_setup',
				undefined
			);
		} );

		it( 'should track the start of a step once it is in view', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=terms-of-service';

			connectPublication( registry, publicationWithoutTerms );

			const { getByText } = render( <SetupCTANewsletterSignup />, {
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			} );

			await waitFor( () => {
				expect(
					getByText( STEP_CONTENT[ 'terms-of-service' ] )
				).toBeInTheDocument();
			} );

			expect( mockTrackEvent ).not.toHaveBeenCalledWith(
				eventCategory,
				'start_step',
				expect.anything()
			);

			act( () => {
				simulateAllIntersections();
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'start_step',
				'terms-of-service'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
		} );

		it.each( [
			[ 'connect-publication', [ publications[ 0 ] ] ],
			[ 'create-publication', [] ],
		] )(
			'should track the start of the publication setup step as %s',
			async ( label, availablePublications ) => {
				global.location.href =
					'http://example.com/?cta=newsletter-signup&step=connect-publication';

				providePublications( registry, availablePublications );

				const { waitForRegistry } = render(
					<SetupCTANewsletterSignup />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MODULE_SETUP,
					}
				);

				await waitForRegistry();

				act( () => {
					simulateAllIntersections();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'start_step',
					label
				);
			}
		);

		it( 'should track the completion of a step', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=connect-publication';

			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			const publicationID = publications[ 0 ].publicationId;

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID } );

			providePublications( registry, [ publications[ 0 ] ] );

			const { getByRole, waitForRegistry } = render(
				<SetupCTANewsletterSignup />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MODULE_SETUP,
				}
			);

			await waitForRegistry();

			fireEvent.click(
				getByRole( 'button', { name: 'Test: complete step' } )
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'complete_step',
				'connect-publication'
			);
		} );

		it( 'should not track any events outside a CTA setup flow', async () => {
			global.location.href = 'http://example.com/?step=terms-of-service';

			connectPublication( registry, publicationWithoutTerms );

			const { getByText } = render( <SetupCTANewsletterSignup />, {
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			} );

			await waitFor( () => {
				expect(
					getByText( STEP_CONTENT[ 'terms-of-service' ] )
				).toBeInTheDocument();
			} );

			act( () => {
				simulateAllIntersections();
			} );

			expect( mockTrackEvent ).not.toHaveBeenCalled();
		} );

		describe( 'setup complete step', () => {
			beforeEach( () => {
				const publication = publications[ 3 ];

				registry = createTestRegistry() as Registry;
				provideUserAuthentication( registry, {
					grantedScopes: EXPRESS_SETUP_SCOPES,
				} );
				provideSiteInfo( registry );
				provideUserInfo( registry );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						/* eslint-disable sitekit/acronym-case */
						organizationID: publication.organizationId,
						publicationID: publication.publicationId,
						/* eslint-enable sitekit/acronym-case */
						snippetMode: 'sitewide',
						postTypes: [],
					} );

				providePublication( registry, publication );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [], params: {} } );

				global.location.href =
					'http://example.com/?cta=newsletter-signup&step=setup-complete';
			} );

			it( 'should track the start of the step and the completion of the setup once it is in view', () => {
				render( <SetupCTANewsletterSignup />, {
					registry,
					viewContext: VIEW_CONTEXT_MODULE_SETUP,
				} );

				act( () => {
					simulateAllIntersections();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'start_step',
					'setup-complete'
				);
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'complete_setup',
					undefined
				);
			} );

			it( 'should track the completion of the step before returning to the dashboard', async () => {
				const { getByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
					viewContext: VIEW_CONTEXT_MODULE_SETUP,
				} );

				fireEvent.click(
					getByRole( 'button', { name: /Return to Dashboard/i } )
				);

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'complete_step',
					'setup-complete'
				);

				await waitFor( () => {
					expect( global.location.assign ).toHaveBeenCalledWith(
						'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
					);
				} );
			} );
		} );
	} );
} );
