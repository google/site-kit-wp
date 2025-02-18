/**
 * Reader Revenue Manager SettingsEdit component tests.
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
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import SettingsEdit from './SettingsEdit';
import { publications } from '../../datastore/__fixtures__';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';

describe( 'SettingsEdit', () => {
	let registry;

	const publication = publications[ 2 ];
	const {
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: publicationID,
		onboardingState: publicationOnboardingState,
	} = publication;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry, {
			postTypes: [
				{ slug: 'post', label: 'Posts' },
				{ slug: 'page', label: 'Pages' },
				{ slug: 'products', label: 'Products' },
			],
		} );
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideUserInfo( registry );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID,
				publicationOnboardingState,
				ownerID: 1,
				postTypes: [ 'post' ],
			} );
	} );

	it( 'should render the "SettingsEdit" component', async () => {
		const { getByRole, getByText, waitForRegistry } = render(
			<SettingsEdit />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Ensure publication select is rendered.
		expect( getByRole( 'menu', { hidden: true } ) ).toBeInTheDocument();

		// Ensure the publication onboarding state notice is displayed.
		getByText(
			'Your publication requires further setup in Reader Revenue Manager'
		);
	} );

	it( 'should render the publication onboarding state notice if applicable', async () => {
		const { getByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByText(
				'Your publication requires further setup in Reader Revenue Manager'
			)
		).toBeInTheDocument();
	} );

	it( 'should not render the publication onboarding state notice if the user does not have module access', async () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setOwnerID( 2 );

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: READER_REVENUE_MANAGER_MODULE_SLUG }
			);

		const { queryByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText(
				'Your publication requires further setup in Reader Revenue Manager'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should not render the publication onboarding state notice if the publication is not available', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ], publications[ 1 ] ] );

		const { queryByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText(
				'Your publication requires further setup in Reader Revenue Manager'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should render an error message if the publication is not available', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ], publications[ 1 ] ] );

		const { getByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByText(
				`Error: The previously selected publication with ID ${ publicationID } was not found. Please select a new publication.`
			)
		).toBeInTheDocument();
	} );

	it( 'should not render an error message if the user does not have module access even if the publication is not available', async () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setOwnerID( 2 );

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: READER_REVENUE_MANAGER_MODULE_SLUG }
			);

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ], publications[ 1 ] ] );

		const { queryByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText(
				`Error: The previously selected publication with ID ${ publicationID } was not found. Please select a new publication.`
			)
		).not.toBeInTheDocument();
	} );

	it( 'should render an error notice if the user does not have module access', async () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setOwnerID( 2 );

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: READER_REVENUE_MANAGER_MODULE_SLUG }
			);

		const { getByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByText(
				'Another admin configured Reader Revenue Manager and you don’t have access to its configured publication. Contact them to share access or change the configured publication.'
			)
		).toBeInTheDocument();
	} );

	describe( 'with the rrmModuleV2 feature flag enabled', () => {
		it( 'should display CTA placement settings', async () => {
			const { getByText, waitForRegistry } = render( <SettingsEdit />, {
				registry,
				features: [ 'rrmModuleV2' ],
			} );

			await waitForRegistry();

			expect( getByText( 'CTA Placement' ) ).toBeInTheDocument();
		} );

		it( 'should display the snippet mode setting', async () => {
			const { getByText, waitForRegistry } = render( <SettingsEdit />, {
				registry,
				features: [ 'rrmModuleV2' ],
			} );

			await waitForRegistry();

			expect( getByText( 'Display CTAs' ) ).toBeInTheDocument();
		} );

		it( 'should display the post types setting if snippet mode is set to post_types', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSnippetMode( 'post_types' );

			const { getByText, waitForRegistry } = render( <SettingsEdit />, {
				registry,
				features: [ 'rrmModuleV2' ],
			} );

			await waitForRegistry();

			expect(
				getByText(
					'Select the content types where you want your CTAs to appear:'
				)
			).toBeInTheDocument();
		} );

		it( 'should not display the post types setting if snippet mode is not set to post_types', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSnippetMode( 'per_post' );

			const { queryByText, waitForRegistry } = render( <SettingsEdit />, {
				registry,
				features: [ 'rrmModuleV2' ],
			} );

			await waitForRegistry();

			expect(
				queryByText(
					'Select the content types where you want your CTAs to appear:'
				)
			).not.toBeInTheDocument();
		} );
	} );
} );
