/**
 * Reader Revenue Manager SetupMain component tests.
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

import {
	createTestRegistry,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import SetupMain from './SetupMain';
import {
	MODULE_SLUG,
	MODULES_READER_REVENUE_MANAGER,
} from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import { enabledFeatures } from '../../../../features';

describe( 'SetupMain', () => {
	let registry;

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	beforeEach( () => {
		enabledFeatures.add( 'rrmModule' ); // Enable RRM module to get its features.
		registry = createTestRegistry();

		const extraData = [
			{
				slug: MODULE_SLUG,
				active: true,
				connected: true,
				owner: { ID: 1 },
			},
		];
		provideModules( registry, extraData );
		provideModuleRegistrations( registry, extraData );
		provideUserAuthentication( registry );
		provideUserInfo( registry );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {} );
	} );

	it( 'should render the component', async () => {
		muteFetch( settingsEndpoint );
		const { getByText, waitForRegistry } = render( <SetupMain />, {
			registry,
		} );

		await waitForRegistry();

		// TODO: Adjust the tests once #8800 is implemented.
		expect(
			getByText(
				/Select your preferred publication to connect with Site Kit/i
			)
		).toBeInTheDocument();
	} );
} );
