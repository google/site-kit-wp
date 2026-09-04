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
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
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

const STEP_CONTENT = {
	[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]:
		'To set up a newsletter sign-up form using Reader Revenue Manager, you will need to create a publication.',
	[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]:
		'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
	[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]:
		'To set up a newsletter using Reader Revenue Manager, you will need to add links to your publication’s policies.',
	[ EXPRESS_SETUP_STEPS.SETUP_CTA ]:
		'RRM express setup placeholder: newsletter CTA setup step.',
	[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]:
		'Your newsletter signup form is ready!',
};

const ORGANIZATION_ID = 'ABCD1234';
const PUBLICATION_ID = 'ABCD_123-4';

const PRE_EXISTING_CTA = {
	name: `organizations/${ ORGANIZATION_ID }/publications/${ PUBLICATION_ID }/ctas/1`,
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
};

const NEWSLETTER_CTA = {
	name: `organizations/${ ORGANIZATION_ID }/publications/${ PUBLICATION_ID }/ctas/5`,
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
};

const SETUP_COMPLETE_URL = `http://example.com/?cta=newsletter-signup&step=${ EXPRESS_SETUP_STEPS.SETUP_COMPLETE }`;

const searchEndpoint = new RegExp( '^/wp/v2/search' );

describe( 'SetupCTANewsletterSignup', () => {
	// This is needed for `navigateTo` to work in the test.
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

	it( 'renders the newsletter CTA step title in the sidebar', () => {
		const { getByText, container } = render( <SetupCTANewsletterSignup />, {
			registry,
		} );

		expect( getByText( 'Set up a sign-up form' ) ).toBeInTheDocument();
		expect( getByText( 'Connect publication' ) ).toBeInTheDocument();
		expect( getByText( 'Add publication policies' ) ).toBeInTheDocument();
		expect( getByText( 'Setup complete' ) ).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 4 );
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
		let originalHref: string;

		function setupRegistry( {
			ctas = [ NEWSLETTER_CTA ],
			snippetMode = 'sitewide',
			postTypes = [] as string[],
		} = {} ) {
			registry = createTestRegistry() as Registry;
			provideSiteInfo( registry );
			provideUserInfo( registry );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					organizationID: ORGANIZATION_ID,
					publicationID: PUBLICATION_ID,
					snippetMode,
					postTypes,
				} );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetCTAs( { ctas, params: {} } );
		}

		beforeEach( () => {
			setupRegistry();

			global.location.href = 'http://example.com/';
		} );

		beforeEach( () => {
			originalHref = global.location.href;
			global.location.href = SETUP_COMPLETE_URL;
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
			setupRegistry( { ctas: [ PRE_EXISTING_CTA, NEWSLETTER_CTA ] } );

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
				setupRegistry( { ctas: [ PRE_EXISTING_CTA, NEWSLETTER_CTA ] } );

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
					PUBLICATION_ID
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
					PUBLICATION_ID
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
			it( 'opens the front page for the sitewide snippet mode', () => {
				const { getByRole } = render( <SetupCTANewsletterSignup />, {
					registry,
				} );

				expect(
					getByRole( 'button', { name: /View on your site/i } )
				).toBeInTheDocument();
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
				setupRegistry( { ctas: [ PRE_EXISTING_CTA, NEWSLETTER_CTA ] } );

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
