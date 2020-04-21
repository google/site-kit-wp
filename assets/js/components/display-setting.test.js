/**
 * DisplaySetting tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import DisplaySetting from './display-setting';
import { render } from '../../../tests/js/test-utils';

describe( 'DisplaySetting', () => {
	it( 'returns non-empty string unchanged', () => {
		const { container } = render( <DisplaySetting value="Test Value" /> );
		expect( container.textContent ).toBe( 'Test Value' );
	} );

	it( 'returns unicode value for &nbsp; if no value prop provided', () => {
		const { container } = render( <DisplaySetting /> );
		expect( container.textContent ).toBe( '\u00A0' );
	} );

	it( 'returns unicode value for &nbsp; if value prop is undefined', () => {
		const { container } = render( <DisplaySetting value={ undefined } /> );
		expect( container.textContent ).toBe( '\u00A0' );
	} );

	it( 'returns unicode value for &nbsp; if value prop is null', () => {
		const { container } = render( <DisplaySetting value={ null } /> );
		expect( container.textContent ).toBe( '\u00A0' );
	} );

	it( 'returns unicode value for &nbsp; if value prop is false', () => {
		const { container } = render( <DisplaySetting value={ false } /> );
		expect( container.textContent ).toBe( '\u00A0' );
	} );

	it( 'returns unicode value for &nbsp; if value prop is empty string', () => {
		const { container } = render( <DisplaySetting value={ '' } /> );
		expect( container.textContent ).toBe( '\u00A0' );
	} );
} );
