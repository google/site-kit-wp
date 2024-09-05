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
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
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

	beforeEach( () => {
		registry = createTestRegistry();

		const moduleData = [
			{
				slug: 'reader-revenue-manager',
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
					publicationOnboardingStateLastSyncedAtMs: 0,
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
				publicationOnboardingStateLastSyncedAtMs: 0,
			} );

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: READER_REVENUE_MANAGER_MODULE_SLUG }
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
} );
