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
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import {
	providePublication,
	providePublications,
} from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { decodeServiceURL } from '@tests/js/mock-accountChooserURL-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
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

describe( 'SetupCTANewsletterSignup', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

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

	it( 'renders no step content for an unknown step', () => {
		global.location.href = 'http://example.com/?step=unknown-step';

		const { getByText, queryByText } = render(
			<SetupCTANewsletterSignup />,
			{ registry }
		);

		expect( getByText( 'Set up a sign-up form' ) ).toBeInTheDocument();

		Object.values( STEP_CONTENT ).forEach( ( content ) => {
			expect( queryByText( content ) ).not.toBeInTheDocument();
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
} );
