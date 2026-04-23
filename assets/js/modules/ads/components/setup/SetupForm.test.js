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
import {
	createTestRegistry,
	provideModules,
	render,
} from '../../../../../../tests/js/test-utils';
import { MODULES_ADS, PLUGINS } from '@/js/modules/ads/datastore/constants';
import SetupForm from './SetupForm';

jest.mock( '@/js/components/StoreErrorNotices', () => () => null );
jest.mock( '@/js/modules/ads/components/common', () => ( {
	ConversionIDTextField: () => (
		<div data-testid="googlesitekit-ads-conversion-id-field" />
	),
} ) );

describe( 'SetupForm', () => {
	let registry;

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

	function renderSetupForm() {
		return render(
			<SetupForm
				finishSetup={ finishSetup }
				isNavigatingToOAuthURL={ false }
			/>,
			{
				registry,
			}
		);
	}

	function setupDuplicateConversionID( {
		isGoogleForWooCommerceActivated,
		canSubmitChanges = true,
	} ) {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: isGoogleForWooCommerceActivated,
					conversionID: 'AW-12345678',
				},
			},
		} );

		if ( canSubmitChanges ) {
			registry.dispatch( MODULES_ADS ).setConversionID( 'AW-12345678' );
		}
	}

	it( 'shows duplicate warning when Google for WooCommerce is active and duplicate exists, but does not block submit', async () => {
		setupDuplicateConversionID( { isGoogleForWooCommerceActivated: true } );

		const { getByRole, getByText, waitForRegistry } = renderSetupForm();
		await waitForRegistry();

		expect(
			getByText(
				'This Conversion ID is already in use via the Google for WooCommerce plugin. We don’t recommend adding it in Site Kit, as it may result in inaccurate measurement of your Ads campaign conversions.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: /Complete manual setup/i,
			} )
		).toBeEnabled();
	} );

	it( 'does not show duplicate warning when Google for WooCommerce is inactive, and submit is not blocked by duplicate', async () => {
		setupDuplicateConversionID( {
			isGoogleForWooCommerceActivated: false,
		} );

		const { getByRole, queryByText, waitForRegistry } = renderSetupForm();
		await waitForRegistry();

		expect(
			queryByText(
				'This Conversion ID is already in use via the Google for WooCommerce plugin. We don’t recommend adding it in Site Kit, as it may result in inaccurate measurement of your Ads campaign conversions.'
			)
		).not.toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: /Complete manual setup/i,
			} )
		).toBeEnabled();
	} );

	it( 'keeps submit controlled by existing submit guards when Google for WooCommerce is inactive', async () => {
		setupDuplicateConversionID( {
			isGoogleForWooCommerceActivated: false,
			canSubmitChanges: false,
		} );

		const { getByRole, waitForRegistry } = renderSetupForm();
		await waitForRegistry();

		expect(
			getByRole( 'button', {
				name: /Complete manual setup/i,
			} )
		).toBeDisabled();
	} );
} );
