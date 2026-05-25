/**
 * Ads SetupForm component tests.
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
import { MODULES_ADS, PLUGINS } from '@/js/modules/ads/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	render,
} from '../../../../../../tests/js/test-utils';
import SetupForm from './SetupForm';

// Store-level notices are unrelated to duplicate Conversion ID behavior
// and can introduce extra async rendering noise in this focused test file.
jest.mock( '@/js/components/StoreErrorNotices', () => () => null );

describe( 'SetupForm', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const finishSetup = jest.fn();

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );

		registry.dispatch( MODULES_ADS ).receiveGetSettings( {
			conversionID: 'AW-11111111',
			paxConversionID: '',
			extCustomerID: '',
			customerID: '',
			userID: '',
			accountOverviewURL: '',
		} );
	} );

	it( 'shows duplicate warning when Google for WooCommerce is active and duplicate exists, but does not block submit', async () => {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: true,
					conversionID: 'AW-12345678',
				},
			},
		} );
		registry.dispatch( MODULES_ADS ).setConversionID( 'AW-12345678' );

		const { getByRole, getByText, waitForRegistry } = render(
			<SetupForm
				finishSetup={ finishSetup }
				isNavigatingToOAuthURL={ false }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect(
			getByText( /Conversion ID is already in use/i )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: /Complete manual setup/i,
			} )
		).toBeEnabled();
	} );

	it( 'does not show duplicate warning when Google for WooCommerce is inactive, and submit is not blocked by duplicate', async () => {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: false,
					conversionID: 'AW-12345678',
				},
			},
		} );
		registry.dispatch( MODULES_ADS ).setConversionID( 'AW-12345678' );

		const { getByRole, queryByText, waitForRegistry } = render(
			<SetupForm
				finishSetup={ finishSetup }
				isNavigatingToOAuthURL={ false }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect(
			queryByText( /Conversion ID is already in use/i )
		).not.toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: /Complete manual setup/i,
			} )
		).toBeEnabled();
	} );

	it( 'keeps submit controlled by existing submit guards when Google for WooCommerce is inactive', async () => {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: false,
					conversionID: 'AW-12345678',
				},
			},
		} );

		const { getByRole, waitForRegistry } = render(
			<SetupForm
				finishSetup={ finishSetup }
				isNavigatingToOAuthURL={ false }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect(
			getByRole( 'button', {
				name: /Complete manual setup/i,
			} )
		).toBeDisabled();
	} );
} );
