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
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import SettingsEdit from './SettingsEdit';
import { publications } from '../../datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	MODULE_SLUG,
} from '../../datastore/constants';
import { enabledFeatures } from '../../../../features';

describe( 'SettingsEdit', () => {
	let registry;

	beforeEach( () => {
		enabledFeatures.add( 'rrmModule' );
		registry = createTestRegistry();

		const extraData = [
			{
				slug: MODULE_SLUG,
				active: true,
				connected: true,
			},
		];
		provideModules( registry, extraData );
		provideModuleRegistrations( registry, extraData );
		provideUserInfo( registry );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	} );

	it( 'should render the "SettingsEdit" component', async () => {
		const publication = publications[ 2 ];
		const {
			// eslint-disable-next-line sitekit/acronym-case
			publicationId: publicationID,
			onboardingState: publicationOnboardingState,
		} = publication;

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID,
				publicationOnboardingState,
				publicationOnboardingStateLastSyncedAtMs: 0,
				ownerID: 1,
			} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );

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
} );
