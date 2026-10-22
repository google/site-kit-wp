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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MODULE_SETUP,
} from '@/js/googlesitekit/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTA_FORMS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
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
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { NEWSLETTER_SIGNUP_FORM } from './constants';
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

const settingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
);

const createCTAEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-cta'
);

const publicationEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication(?:\\?|$)'
);

const ctasEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
);

const userSettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/user-settings'
);

/**
 * Gets the `lastActionedExpressSetups` entries sent by each user settings save.
 *
 * @since n.e.x.t
 * @private
 *
 * @return {Array.<Object>} The entries sent by each save, in order.
 */
function getSavedExpressSetupEntries(): Record< string, number | null >[] {
	return fetchMock
		.calls( userSettingsEndpoint )
		.map(
			( call ) =>
				JSON.parse( String( call[ 1 ]?.body ) ).data
					.lastActionedExpressSetups
		);
}

describe( 'SetupCTANewsletterSignup', () => {
	mockLocation();

	let registry: Registry;

	// Publication with accepted terms of service and its policies added, so
	// every step before the sign-up form is complete.
	const readyPublication = publications[ 3 ];

	/* eslint-disable sitekit/acronym-case */
	const readyOrganizationID = readyPublication.organizationId;
	const readyPublicationID = readyPublication.publicationId;
	/* eslint-enable sitekit/acronym-case */

	const preExistingCTA = {
		name: `organizations/${ readyOrganizationID }/publications/${ readyPublicationID }/ctas/1`,
		type: CTA_TYPES.NEWSLETTER_SIGNUP,
	};

	const newsletterCTA = {
		name: `organizations/${ readyOrganizationID }/publications/${ readyPublicationID }/ctas/5`,
		type: CTA_TYPES.NEWSLETTER_SIGNUP,
	};

	/**
	 * Sets up a new registry with the ready publication connected.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object}         [options]             Optional. Registry options.
	 * @param {Array.<Object>} [options.ctas]        Optional. The publication's CTAs. Default the newsletter CTA.
	 * @param {string}         [options.snippetMode] Optional. Snippet mode setting. Default `sitewide`.
	 * @param {Array.<string>} [options.postTypes]   Optional. Post types setting. Default empty.
	 * @return {Object} The module settings received by the registry.
	 */
	function setupRegistryWithReadyPublication( {
		ctas = [ newsletterCTA ] as { name: string; type: string }[],
		snippetMode = 'sitewide',
		postTypes = [] as string[],
	} = {} ) {
		registry = createTestRegistry() as Registry;
		provideUserAuthentication( registry, {
			grantedScopes: EXPRESS_SETUP_SCOPES,
		} );
		provideSiteInfo( registry );
		provideUserInfo( registry );

		const settings = {
			organizationID: readyOrganizationID,
			publicationID: readyPublicationID,
			snippetMode,
			postTypes,
		};

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( settings );

		providePublication( registry, readyPublication );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetCTAs( { ctas, params: {} } );

		return settings;
	}

	beforeEach( () => {
		fetchMock.post( userSettingsEndpoint, {
			body: { lastActionedExpressSetups: {} },
			status: 200,
		} );

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
			.receiveGetSettings( {} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, [] );
	} );

	it( 'renders its steps in order, with the newsletter CTA step before setup complete', () => {
		const { container } = render( <SetupCTANewsletterSignup />, {
			registry,
		} );

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

			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			const publicationID = publication.publicationId;

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID } );

			providePublications( registry, [ publication ] );

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

	describe( 'setup complete step', () => {
		const setupCompleteURL =
			'http://example.com/?cta=newsletter-signup&step=setup-complete';

		const searchEndpoint = new RegExp( '^/wp/v2/search' );

		let originalHref: string;

		beforeEach( () => {
			setupRegistryWithReadyPublication();

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
			setupRegistryWithReadyPublication( {
				ctas: [ preExistingCTA, newsletterCTA ],
			} );

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
				setupRegistryWithReadyPublication( {
					ctas: [ preExistingCTA, newsletterCTA ],
				} );

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
					readyPublicationID
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
					readyPublicationID
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

		describe.each( [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MODULE_SETUP,
		] )( 'click tracking in %s', ( viewContext ) => {
			let mockTrackEvent: jest.SpyInstance;
			let mockOpen: jest.SpyInstance;

			beforeEach( () => {
				mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );

				mockTrackEvent.mockImplementation( () => Promise.resolve() );

				mockOpen = jest
					.spyOn( global, 'open' )
					.mockImplementation( () => null );
			} );

			afterEach( () => {
				mockTrackEvent.mockRestore();
				mockOpen.mockRestore();
			} );

			it.each( [
				{
					action: 'click_change_display_order_link',
					name: /Publisher center/i,
					hasPreExistingCTAs: true,
				},
				{
					action: 'click_change_placement_settings_link',
					name: /Site Kit settings/i,
					hasPreExistingCTAs: false,
				},
				{
					action: 'click_edit_content_link',
					name: /Publisher center/i,
					hasPreExistingCTAs: false,
				},
				{
					action: 'click_contact_support_link',
					name: /contact support/i,
					hasPreExistingCTAs: false,
				},
				{
					action: 'click_view_on_your_site_link',
					name: /View on your site/i,
					hasPreExistingCTAs: false,
				},
			] )(
				'should track $action only when clicked',
				async ( { action, name, hasPreExistingCTAs } ) => {
					const eventCategory = `${ viewContext }_rrm-express-setup_newsletter-signup`;

					setupRegistryWithReadyPublication( {
						ctas: hasPreExistingCTAs
							? [ preExistingCTA, newsletterCTA ]
							: [ newsletterCTA ],
					} );

					const { getAllByRole, waitForRegistry } = render(
						<SetupCTANewsletterSignup />,
						{
							registry,
							viewContext,
							features: [ 'rrmExpressSetup' ],
						}
					);

					await waitForRegistry();

					expect( mockTrackEvent ).toHaveBeenCalledWith(
						eventCategory,
						'start_setup',
						undefined
					);

					expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
					expect( global.open ).not.toHaveBeenCalled();

					const isViewOnSite =
						action === 'click_view_on_your_site_link';

					// Keep tracking pending to verify that opening the preview tab
					// does not wait for the event to finish sending.
					mockTrackEvent.mockImplementationOnce(
						() => new Promise( () => {} )
					);

					fireEvent.click(
						getAllByRole( isViewOnSite ? 'button' : 'link', {
							name,
						} )[ 0 ]
					);

					expect( mockTrackEvent ).toHaveBeenCalledWith(
						eventCategory,
						action,
						'setup-complete'
					);

					expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );

					if ( isViewOnSite ) {
						expect( global.open ).toHaveBeenCalledTimes( 1 );
						expect( global.open ).toHaveBeenCalledWith(
							'http://example.com',
							'_blank'
						);
					}
				}
			);
		} );

		describe( '"View on your site" CTA', () => {
			let openSpy: jest.SpyInstance;

			beforeEach( () => {
				openSpy = jest
					.spyOn( global, 'open' )
					.mockImplementation( () => null );
			} );

			afterEach( () => {
				openSpy.mockRestore();
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

				setupRegistryWithReadyPublication( {
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

				setupRegistryWithReadyPublication( {
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
				setupRegistryWithReadyPublication( {
					snippetMode: 'per_post',
				} );

				const { queryByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					queryByRole( 'button', { name: /View on your site/i } )
				).not.toBeInTheDocument();
			} );

			it( 'is not rendered when the publication has pre-existing CTAs', () => {
				setupRegistryWithReadyPublication( {
					ctas: [ preExistingCTA, newsletterCTA ],
				} );

				const { queryByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					queryByRole( 'button', { name: /View on your site/i } )
				).not.toBeInTheDocument();
			} );

			it( 'opens the resolved URL in a new tab', () => {
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

	describe( 'recording setup progress', () => {
		const savedTimestamp = {
			'newsletter-signup:new': expect.any( Number ),
		};

		it( 'saves an entry when the setup opens on its first incomplete step', async () => {
			global.location.href = 'http://example.com/?cta=newsletter-signup';

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

			expect( getSavedExpressSetupEntries() ).toEqual( [
				savedTimestamp,
			] );
		} );

		it( 'saves an entry each time the user moves on to the next step', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=connect-publication';

			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			const publicationID = publications[ 0 ].publicationId;

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationID } );

			providePublications( registry, [ publications[ 0 ] ] );

			const { getByRole, getByText, waitForRegistry } = render(
				<SetupCTANewsletterSignup />,
				{ registry }
			);

			await waitForRegistry();

			expect( getSavedExpressSetupEntries() ).toEqual( [
				savedTimestamp,
			] );

			fireEvent.click(
				getByRole( 'button', { name: 'Test: complete step' } )
			);

			await waitFor( () => {
				expect(
					getByText( STEP_CONTENT[ 'publication-policies' ] )
				).toBeInTheDocument();
			} );

			await waitFor( () => {
				expect( getSavedExpressSetupEntries() ).toEqual( [
					savedTimestamp,
					savedTimestamp,
				] );
			} );
		} );

		it( 'saves an entry when the user is sent back to an earlier incomplete step', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=publication-policies';

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

			expect( global.location.href ).toContain(
				'step=connect-publication'
			);

			// The requested step renders, and so saves, before the flow sends
			// the user back, which saves again for the earlier step.
			await waitFor( () => {
				expect( getSavedExpressSetupEntries() ).toEqual( [
					savedTimestamp,
					savedTimestamp,
				] );
			} );
		} );

		it( 'removes the entry when the setup complete step begins', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=newsletter-signup-form';

			const settings = setupRegistryWithReadyPublication();

			// Publishing saves the module settings, which needs the module.
			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: true,
				},
			] );

			registry
				.dispatch( CORE_FORMS )
				.setValues( EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP, {
					[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]:
						'Newsletter signup',
				} );

			// Saves the settings both when submitting the step and after the CTA
			// is created.
			fetchMock.post( settingsEndpoint, {
				body: settings,
				status: 200,
			} );

			fetchMock.postOnce( createCTAEndpoint, {
				body: newsletterCTA,
				status: 200,
			} );

			// Creating the CTA reloads the publication and the CTAs.
			fetchMock.getOnce( publicationEndpoint, {
				body: readyPublication,
				status: 200,
			} );

			fetchMock.getOnce( ctasEndpoint, {
				body: [ newsletterCTA ],
				status: 200,
			} );

			const { getByRole, getByText, waitForRegistry } = render(
				<SetupCTANewsletterSignup />,
				{ registry }
			);

			await waitForRegistry();

			expect( getSavedExpressSetupEntries() ).toEqual( [
				savedTimestamp,
			] );

			fireEvent.click(
				getByRole( 'button', { name: 'Publish to your site' } )
			);

			await waitFor( () => {
				expect(
					getByText( STEP_CONTENT[ 'setup-complete' ] )
				).toBeInTheDocument();
			} );

			await waitFor( () => {
				expect( getSavedExpressSetupEntries() ).toEqual( [
					savedTimestamp,
					{ 'newsletter-signup:new': null },
				] );
			} );
		} );

		it( 'renders the step as usual when saving the entry fails', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=terms-of-service';

			fetchMock.post(
				userSettingsEndpoint,
				{
					body: {
						code: 'internal_server_error',
						message: 'Internal server error',
						data: { status: 500 },
					},
					status: 500,
				},
				{ overwriteRoutes: true }
			);

			const { queryByText, getByText } = render(
				<SetupCTANewsletterSignup />,
				{
					registry,
				}
			);

			await waitFor( () => {
				expect( fetchMock ).toHaveFetched( userSettingsEndpoint );
			} );

			expect( console ).toHaveErrored();
			expect(
				getByText( STEP_CONTENT[ 'terms-of-service' ] )
			).toBeInTheDocument();

			expect(
				queryByText( 'Error: Internal server error' )
			).not.toBeInTheDocument();
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

		it( 'should track the start of the setup', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=terms-of-service';

			const { waitForRegistry } = render( <SetupCTANewsletterSignup />, {
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			} );

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'start_setup',
				undefined
			);
		} );

		it( 'should track the start of a step once it is in view', async () => {
			global.location.href =
				'http://example.com/?cta=newsletter-signup&step=terms-of-service';

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
				setupRegistryWithReadyPublication( { ctas: [] } );

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
