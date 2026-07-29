/**
 * ConversionIDTextField component tests.
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
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import ConversionIDTextField from './ConversionIDTextField';

describe( 'ConversionIDTextField', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );

		registry.dispatch( MODULES_ADS ).receiveGetSettings( {
			conversionID: '',
			paxConversionID: '',
			extCustomerID: '',
			customerID: '',
			userID: '',
			accountOverviewURL: '',
		} );
	} );

	it( 'should show an accessible error state when the stored conversion ID is invalid', async () => {
		registry.dispatch( MODULES_ADS ).setConversionID( 'AW-invalid' );

		const { container, getByText, waitForRegistry } = render(
			<ConversionIDTextField />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( true );

		const errorMessage = getByText(
			'Tracking for your Ads campaigns won’t work until you insert a valid ID'
		);

		expect( errorMessage ).toBeInTheDocument();

		const input = container.querySelector( 'input' );

		expect( input ).toHaveAttribute( 'aria-invalid', 'true' );
		expect( input ).toHaveAttribute(
			'aria-errormessage',
			errorMessage.getAttribute( 'id' )
		);
	} );

	it( 'should not show an error state when the stored conversion ID is valid', async () => {
		registry.dispatch( MODULES_ADS ).setConversionID( 'AW-12345678' );

		const { container, queryByText, waitForRegistry } = render(
			<ConversionIDTextField />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( false );

		expect(
			queryByText(
				'Tracking for your Ads campaigns won’t work until you insert a valid ID'
			)
		).not.toBeInTheDocument();

		expect( container.querySelector( 'input' ) ).not.toHaveAttribute(
			'aria-invalid'
		);
	} );

	it( 'should not show an error state when there is no conversion ID yet', async () => {
		const { container, waitForRegistry } = render(
			<ConversionIDTextField />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( false );

		expect( container.querySelector( 'input' ) ).not.toHaveAttribute(
			'aria-invalid'
		);
	} );
} );
