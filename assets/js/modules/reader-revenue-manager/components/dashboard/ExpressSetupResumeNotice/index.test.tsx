/**
 * ExpressSetupResumeNotice component tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import ExpressSetupResumeNotice from '.';

describe( 'ExpressSetupResumeNotice', () => {
	let registry: WPDataRegistry;

	mockLocation();

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
	} );

	function renderNotice() {
		return render(
			<ExpressSetupResumeNotice
				description="Example description"
				notificationID="notification-id"
				setupCTA="example-setup"
				title="Example title"
			/>,
			{ registry }
		);
	}

	it( 'should resume express setup using the supplied setup slug', () => {
		const { getByRole } = renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Show me' } ) );

		expect( global.location.assign ).toHaveBeenCalledTimes( 1 );

		const setupURL = new URL(
			( global.location.assign as jest.Mock ).mock.calls[ 0 ][ 0 ]
		);
		expect( setupURL.href ).toMatchQueryParameters( {
			page: 'googlesitekit-dashboard',
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			reAuth: 'true',
			expressSetup: 'true',
			cta: 'example-setup',
		} );
	} );

	it( 'should not render when the setup URL is unavailable', () => {
		provideSiteInfo( registry, { adminURL: undefined } );

		const { container } = renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
