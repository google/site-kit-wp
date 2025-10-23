/**
 * Sign in with Google SetupForm component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	provideModules,
} from '../../../../../../tests/js/utils';
import { render } from '../../../../../../tests/js/test-utils';
import SetupForm from './SetupForm';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';

describe( 'SetupForm', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );

		const endpoint = new RegExp(
			'^/google-site-kit/v1/modules/sign-in-with-google/data/compatibility-checks'
		);

		fetchMock.getOnce( endpoint, {
			body: {
				checks: {},
				timestamp: Date.now(),
			},
			status: 200,
		} );

		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( {} );
	} );

	it( 'should render the form correctly', async () => {
		const { container, getByRole, getByText, waitForRegistry } = render(
			<SetupForm onCompleteSetup={ () => {} } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText( 'Add your client ID here to complete setup:' )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', {
				name: /Get your client ID/i,
			} )
		).toBeInTheDocument();
	} );
} );
