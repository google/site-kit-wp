/**
 * Checkbox tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fireEvent, render } from '../../../../tests/js/test-utils';
import Checkbox from './Checkbox';

// import '@material/web/checkbox/checkbox';
// function Checkbox() {
// 	return <md-checkbox></md-checkbox>;
// }

// TODO: Worth a look - https://www.npmjs.com/package/shadow-dom-testing-library

describe( 'Checkbox', () => {
	it( 'should render the checkbox', () => {
		const { container } = render( <Checkbox /> );
		expect( container ).toMatchSnapshot();
	} );

	describe( 'controlled input behaviour', () => {
		it( 'should correctly invoke onChange and retain its unchecked state when clicked', () => {
			const onChange = jest.fn();
			const { container, getByRole } = render(
				<Checkbox onChange={ onChange } />
			);

			expect( container ).toMatchSnapshot();

			// Confirm the checkbox is not checked.
			expect( getByRole( 'checkbox' ) ).not.toHaveAttribute( 'checked' );

			fireEvent.click( getByRole( 'checkbox' ) );

			expect( container ).toMatchSnapshot();

			// Confirm the click resulted in a change event with target.checked: true.
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			const event = onChange.mock.calls[ 0 ][ 0 ];
			expect( event.target.checked ).toBe( true );

			// Confirm the checkbox remains unchecked as its state is controlled.
			expect( getByRole( 'checkbox' ) ).not.toHaveAttribute( 'checked' );
		} );

		it( 'should allow updating of the checked state', () => {
			function CheckableCheckbox( { onChange } ) {
				const [ checked, setChecked ] = useState( false );

				return (
					<Checkbox
						checked={ checked }
						onChange={ ( event ) => {
							onChange( event );
							setChecked( event.target.checked );
						} }
					/>
				);
			}

			const onChange = jest.fn();
			const { container, getByRole } = render(
				<CheckableCheckbox onChange={ onChange } />
			);

			expect( container ).toMatchSnapshot();

			// Confirm the checkbox is not checked.
			expect( getByRole( 'checkbox' ) ).not.toHaveAttribute( 'checked' );

			fireEvent.click( getByRole( 'checkbox' ) );

			expect( container ).toMatchSnapshot();

			// Confirm the click resulted in a change event with target.checked: true.
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			let event = onChange.mock.calls[ 0 ][ 0 ];
			expect( event.target.checked ).toBe( true );

			// Confirm the checkbox is now checked
			expect( getByRole( 'checkbox' ) ).toHaveAttribute( 'checked' );

			// Click again to uncheck
			onChange.mockClear();
			fireEvent.click( getByRole( 'checkbox' ) );

			expect( container ).toMatchSnapshot();

			// Confirm the click resulted in a change event with target.checked: undefined.
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			event = onChange.mock.calls[ 0 ][ 0 ];
			expect( event.target ).toHaveProperty( 'checked', undefined );

			// Confirm the checkbox is now unchecked
			expect( getByRole( 'checkbox' ) ).not.toHaveAttribute( 'checked' );
		} );
	} );
} );
