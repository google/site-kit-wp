/**
 * Reader Revenue Manager SettingsView component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	createTestRegistry,
	createTestRegistryWithFeatures,
	provideModuleRegistrations,
	provideModules,
	provideUserInfo,
	render,
} from '@tests/js/test-utils';
import SettingsView from './SettingsView';

describe( 'SettingsView', () => {
	let registry;

	const { ONBOARDING_ACTION_REQUIRED, PENDING_VERIFICATION } =
		PUBLICATION_ONBOARDING_STATES;

	const publication = publications[ 2 ];
	const {
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: publicationID,
	} = publication;

	function setupRegistry() {
		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		];
		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );
		provideUserInfo( registry );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		setupRegistry();
	} );

	it( 'should render the "SettingsView" component', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationID( publicationID );

		const { getByText, waitForRegistry } = render( <SettingsView />, {
			registry,
		} );

		await waitForRegistry();

		// Ensure the publication ID is rendered.
		expect( getByText( publicationID ) ).toBeInTheDocument();
	} );

	it.each( [
		[
			ONBOARDING_ACTION_REQUIRED,
			'Your publication requires further setup in Reader Revenue Manager',
			'Complete publication setup',
		],
		[
			PENDING_VERIFICATION,
			'Your publication is still awaiting review. You can check its status in Reader Revenue Manager.',
			'Check publication status',
		],
	] )(
		'should render "SettingsView" with appropriate notice when the onboarding state is %s',
		async ( publicationState, noticeText, ctaText ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					ownerID: 1,
					publicationID,
					publicationOnboardingState: publicationState,
				} );

			const { getByText, waitForRegistry } = render( <SettingsView />, {
				registry,
			} );

			await waitForRegistry();

			// Ensure the publication ID is rendered.
			expect( getByText( publicationID ) ).toBeInTheDocument();

			// Ensure the publication onboarding state notice is displayed.
			expect( getByText( noticeText ) ).toBeInTheDocument();

			// Ensure the CTA button is rendered.
			expect( getByText( ctaText ) ).toBeInTheDocument();
		}
	);

	it( 'should not render the publication onboarding state notice if the user does not have module access', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				ownerID: 2,
				publicationID,
				publicationOnboardingState: ONBOARDING_ACTION_REQUIRED,
			} );

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: MODULE_SLUG_READER_REVENUE_MANAGER }
			);

		const { queryByText, waitForRegistry } = render( <SettingsView />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText(
				'Your publication requires further setup in Reader Revenue Manager'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should display settings for product ID, snippet placement, and post types', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				ownerID: 1,
				publicationID,
				publicationOnboardingState: ONBOARDING_ACTION_REQUIRED,
				productID: 'openaccess',
				snippetMode: 'post_types',
				postTypes: [ 'post' ],
			} );

		const { getByText, waitForRegistry } = render( <SettingsView />, {
			registry,
		} );

		await waitForRegistry();

		expect( getByText( 'Default Product ID' ) ).toBeInTheDocument();
		expect( getByText( 'Display CTAs' ) ).toBeInTheDocument();
		expect(
			getByText( 'Content type to display CTAs' )
		).toBeInTheDocument();
	} );

	describe( 'configured CTAs', () => {
		const settings = {
			ownerID: 1,
			publicationID,
			publicationOnboardingState: ONBOARDING_ACTION_REQUIRED,
			productID: 'openaccess',
			snippetMode: 'post_types',
			postTypes: [ 'post' ],
			configuredCTAs: {
				'cta-1': 'newsletter-signup',
			},
		};

		beforeEach( () => {
			registry = createTestRegistryWithFeatures( [ 'rrmExpressSetup' ] );
			setupRegistry();
		} );

		it( 'should display the configured CTAs when the `rrmExpressSetup` feature flag is enabled', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( settings );

			const { getByText, waitForRegistry } = render( <SettingsView />, {
				registry,
				features: [ 'rrmExpressSetup' ],
			} );

			await waitForRegistry();

			expect( getByText( 'CTAs' ) ).toBeInTheDocument();
			expect(
				getByText( 'Newsletter sign-up form' )
			).toBeInTheDocument();
		} );

		it( 'should display the configured CTAs as a comma-separated list', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					...settings,
					configuredCTAs: {
						'cta-1': 'newsletter-signup',
						'cta-2': 'newsletter-signup',
					},
				} );

			const { getByText, waitForRegistry } = render( <SettingsView />, {
				registry,
				features: [ 'rrmExpressSetup' ],
			} );

			await waitForRegistry();

			expect(
				getByText( 'Newsletter sign-up form, Newsletter sign-up form' )
			).toBeInTheDocument();
		} );

		it( 'should not display the CTAs item when there are no configured CTAs', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { ...settings, configuredCTAs: {} } );

			const { queryByText, waitForRegistry } = render( <SettingsView />, {
				registry,
				features: [ 'rrmExpressSetup' ],
			} );

			await waitForRegistry();

			expect( queryByText( 'CTAs' ) ).not.toBeInTheDocument();
		} );

		it( 'should not display the CTAs item when the feature flag is disabled', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( settings );

			const { queryByText, waitForRegistry } = render( <SettingsView />, {
				registry,
			} );

			await waitForRegistry();

			expect( queryByText( 'CTAs' ) ).not.toBeInTheDocument();
			expect(
				queryByText( 'Newsletter sign-up form' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should not display setting for post types if snippet placement is set otherwise', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				ownerID: 1,
				publicationID,
				publicationOnboardingState: ONBOARDING_ACTION_REQUIRED,
				productID: 'openaccess',
				snippetMode: 'per_post',
				postTypes: [ 'post' ],
			} );

		const { queryByText, waitForRegistry } = render( <SettingsView />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText( 'Content type to display CTAs' )
		).not.toBeInTheDocument();
	} );
} );
