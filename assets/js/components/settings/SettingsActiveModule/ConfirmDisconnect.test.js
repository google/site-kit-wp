/**
 * ConfirmDisconnect component tests.
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
import { SettingsDisconnectNote } from '@/js/modules/ads/components/settings';
import ConfirmDisconnect from '.';
import {
	render,
	createTestRegistry,
	provideModules,
} from '../../../../../tests/js/test-utils';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

describe( 'ConfirmDisconnect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry
			.dispatch( CORE_UI )
			.setValue( 'module-ads-dialogActive', true );
	} );

	it( 'should render the Ads Disconnect ModalDialog with a disconnect note component when it is passed', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADS,
				active: true,
				connected: true,
				name: 'Ads',
				features: [
					'Tagging necessary for your ads campaigns to work will be disabled',
					'Conversion tracking for your ads campaigns will be disabled',
				],
				SettingsDisconnectNoteComponent: SettingsDisconnectNote,
			},
		] );
		const mockAccountOverviewURL =
			'https://example.com/account/overview/url';

		registry
			.dispatch( CORE_USER )
			.receiveUserInfo( { email: 'test@example.com' } );

		await registry.dispatch( MODULES_ADS ).receiveGetSettings( {
			conversionID: '12345',
			accountOverviewURL: mockAccountOverviewURL,
		} );

		const { container } = render( <ConfirmDisconnect slug="ads" />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Disconnect Ads from Site Kit?'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the Ads Disconnect ModalDialog without a disconnect note component when it is not passed', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADS,
				active: true,
				connected: true,
				name: 'Ads',
				features: [
					'Tagging necessary for your ads campaigns to work will be disabled',
					'Conversion tracking for your ads campaigns will be disabled',
				],
			},
		] );
		const mockAccountOverviewURL =
			'https://example.com/account/overview/url';

		registry
			.dispatch( CORE_USER )
			.receiveUserInfo( { email: 'test@example.com' } );

		await registry.dispatch( MODULES_ADS ).receiveGetSettings( {
			conversionID: '12345',
			accountOverviewURL: mockAccountOverviewURL,
		} );

		const { container } = render( <ConfirmDisconnect slug="ads" />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Disconnect Ads from Site Kit?'
		);
		expect( container ).toMatchSnapshot();
	} );
} );
