/**
 * Ads Module Conversion Tracking ID component tests.
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
import { createTestRegistry, render } from '@tests/js/test-utils';
import ConversionIDTextField from './ConversionIDTextField';

describe( 'ConversionIDTextField', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	function renderConversionIDTextField( conversionID: string ) {
		registry.dispatch( MODULES_ADS ).receiveGetSettings( { conversionID } );

		return render(
			// @ts-expect-error - TypeScript reads `helperText` as required, because `ConversionIDTextField` is JavaScript and gives the prop no default value.
			<ConversionIDTextField hideHeading />,
			{ registry }
		);
	}

	it( 'shows the invalid ID message and marks the input invalid when the conversion ID holds a letter after "AW-"', () => {
		const { container, getByRole, getByText } =
			renderConversionIDTextField( 'AW-1A2B3C' );

		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);

		const errorMessage = getByText( /tracking for your ads campaigns/i );

		expect( errorMessage ).toBeVisible();
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-errormessage',
			errorMessage.id
		);
	} );

	it( 'shows no message and leaves the input valid when the conversion ID holds only digits after "AW-"', () => {
		const { container, getByRole, queryByText } =
			renderConversionIDTextField( 'AW-123456789' );

		expect( container.querySelector( '.mdc-text-field' ) ).not.toHaveClass(
			'mdc-text-field--error'
		);
		expect(
			queryByText( /tracking for your ads campaigns/i )
		).not.toBeInTheDocument();
		expect( getByRole( 'textbox' ) ).not.toHaveAttribute( 'aria-invalid' );
	} );
} );
