/**
 * SettingsIncludeWooCommerceProductsSwitch tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import SettingsIncludeWooCommerceProductsSwitch from './SettingsIncludeWooCommerceProductsSwitch';

describe( 'SettingsIncludeWooCommerceProductsSwitch', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		provideSiteInfo( registry, {
			wooCommerceInstalled: true,
			wooCommerceActive: true,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
		} );
	} );

	it( 'should render the label and subtitle', () => {
		const { getByText, getByLabelText } = render(
			<SettingsIncludeWooCommerceProductsSwitch />,
			{
				registry,
				features: [ 'freshData' ],
			}
		);

		expect(
			getByLabelText( 'Include products in Recent activity' )
		).toBeInTheDocument();
		expect(
			getByText(
				'Show your new products alongside your latest posts in "Recent activity"'
			)
		).toBeInTheDocument();
	} );

	it( 'should render nothing when the freshData flag is off', () => {
		const { container } = render(
			<SettingsIncludeWooCommerceProductsSwitch />,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when WooCommerce is not installed', () => {
		provideSiteInfo( registry, {
			wooCommerceInstalled: false,
			wooCommerceActive: false,
		} );

		const { container } = render(
			<SettingsIncludeWooCommerceProductsSwitch />,
			{
				registry,
				features: [ 'freshData' ],
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when Analytics is not connected', () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );

		const { container } = render(
			<SettingsIncludeWooCommerceProductsSwitch />,
			{
				registry,
				features: [ 'freshData' ],
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should still render when WooCommerce is installed but inactive', () => {
		provideSiteInfo( registry, {
			wooCommerceInstalled: true,
			wooCommerceActive: false,
		} );

		const { getByLabelText } = render(
			<SettingsIncludeWooCommerceProductsSwitch />,
			{
				registry,
				features: [ 'freshData' ],
			}
		);

		expect(
			getByLabelText( 'Include products in Recent activity' )
		).toBeInTheDocument();
	} );

	it( 'should dispatch setFreshDataIncludesWooCommerceProducts and flip haveSettingsChanged() to true when clicked', () => {
		const { getByLabelText } = render(
			<SettingsIncludeWooCommerceProductsSwitch />,
			{
				registry,
				features: [ 'freshData' ],
			}
		);

		expect(
			registry.select( MODULES_ANALYTICS_4 ).haveSettingsChanged()
		).toBe( false );

		fireEvent.click(
			getByLabelText( 'Include products in Recent activity' )
		);

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getFreshDataIncludesWooCommerceProducts()
		).toBe( false );
		expect(
			registry.select( MODULES_ANALYTICS_4 ).haveSettingsChanged()
		).toBe( true );
	} );

	it( 'should be disabled when hasModuleAccess is false', () => {
		const { getByLabelText } = render(
			<SettingsIncludeWooCommerceProductsSwitch
				hasModuleAccess={ false }
			/>,
			{
				registry,
				features: [ 'freshData' ],
			}
		);

		expect(
			getByLabelText( 'Include products in Recent activity' )
		).toBeDisabled();
	} );
} );
