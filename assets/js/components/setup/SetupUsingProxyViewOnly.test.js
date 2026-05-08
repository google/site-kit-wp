/**
 * SetupUsingProxyViewOnly component tests.
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
import { fireEvent, render } from '../../../../tests/js/test-utils';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	provideUserInfo,
} from '../../../../tests/js/utils';
import { VIEW_CONTEXT_SPLASH } from '@/js/googlesitekit/constants';
import SetupUsingProxyViewOnly from './SetupUsingProxyViewOnly';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from './constants';

describe( 'SetupUsingProxyViewOnly', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash';

		provideModules( registry );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserCapabilities( registry );

		fetchMock.post(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [ SHARED_DASHBOARD_SPLASH_ITEM_KEY ] ),
				status: 200,
			}
		);
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'navigates to base dashboard URL when no params are present', async () => {
		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to dashboard' } ) );
		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
	} );

	it( 'preserves the panel query parameter when present', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&panel=email-reporting';

		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to dashboard' } ) );
		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting'
		);
	} );

	it( 'preserves the notification query parameter when present', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&notification=test_notice';

		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to dashboard' } ) );
		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=test_notice'
		);
	} );
} );
