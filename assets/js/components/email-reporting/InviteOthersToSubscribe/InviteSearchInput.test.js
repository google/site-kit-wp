/**
 * InviteSearchInput tests.
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
import { fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { createTestRegistry, render } from '../../../../../tests/js/test-utils';
import InviteSearchInput from './InviteSearchInput';

describe( 'InviteSearchInput', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'calls onChange on every keystroke', () => {
		const onChange = jest.fn();
		const { getByLabelText } = render(
			<InviteSearchInput value="" onChange={ onChange } />,
			{ registry }
		);
		const searchInput = getByLabelText(
			/Search user name, role, or email/i
		);

		fireEvent.change( searchInput, {
			target: { value: 'a' },
		} );
		fireEvent.change( searchInput, {
			target: { value: 'ab' },
		} );

		expect( onChange ).toHaveBeenNthCalledWith( 1, 'a' );
		expect( onChange ).toHaveBeenNthCalledWith( 2, 'ab' );
	} );

	it( 'clears search when clear button is clicked', () => {
		const onChange = jest.fn();
		const { getByLabelText } = render(
			<InviteSearchInput value="abc" onChange={ onChange } />,
			{ registry }
		);

		fireEvent.click( getByLabelText( 'Clear search' ) );

		expect( onChange ).toHaveBeenCalledWith( '' );
	} );
} );
