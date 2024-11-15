/**
 * Key Metrics ACRSubtleNotification component tests.
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
	provideSiteInfo,
	render,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import ACRSubtleNotification from './ACRSubtleNotification';

describe( 'ACRSubtleNotification', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		provideSiteInfo( registry );
	} );

	it( 'should render "Get tailored metrics" CTA', async () => {
		const { queryByText, getByRole, waitForRegistry } = render(
			<ACRSubtleNotification />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( queryByText( /get tailored metrics/i ) ).toBeInTheDocument();
		const button = getByRole( 'button', { name: /get tailored metrics/i } );

		expect( button ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-user-input'
		);
	} );
} );
