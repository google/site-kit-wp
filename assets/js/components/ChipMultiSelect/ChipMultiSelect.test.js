/**
 * ChipMultiSelect component tests.
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
import { render, fireEvent } from '../../../../tests/js/test-utils';
import ChipMultiSelect from './ChipMultiSelect';
import ChipMultiSelectItem from './ChipMultiSelectItem';

describe( 'ChipMultiSelect', () => {
	it( 'renders correctly', () => {
		const { container } = render(
			<ChipMultiSelect>
				<ChipMultiSelectItem id="channels">
					Channels
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="locations">
					Locations
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="devices">Devices</ChipMultiSelectItem>
			</ChipMultiSelect>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'toggles chips', () => {
		const { container, getByText } = render(
			<ChipMultiSelect>
				<ChipMultiSelectItem id="channels">
					Channels
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="locations">
					Locations
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="devices">Devices</ChipMultiSelectItem>
			</ChipMultiSelect>
		);

		fireEvent.click( getByText( 'Channels' ) );

		expect( getByText( 'Channels' ).parentElement ).toHaveClass(
			'mdc-chip--selected'
		);

		expect( container ).toMatchSnapshot();

		fireEvent.click( getByText( 'Locations' ) );

		expect( getByText( 'Locations' ).parentElement ).toHaveClass(
			'mdc-chip--selected'
		);

		expect( container ).toMatchSnapshot();

		fireEvent.click( getByText( 'Channels' ) );

		expect( getByText( 'Channels' ).parentElement ).not.toHaveClass(
			'mdc-chip--selected'
		);

		expect( getByText( 'Locations' ).parentElement ).toHaveClass(
			'mdc-chip--selected'
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'calls `onToggleChip()` when a chip is toggled', () => {
		const onToggleChip = jest.fn();

		const { getByText } = render(
			<ChipMultiSelect onToggleChip={ onToggleChip }>
				<ChipMultiSelectItem id="channels">
					Channels
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="locations">
					Locations
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="devices">Devices</ChipMultiSelectItem>
			</ChipMultiSelect>
		);

		fireEvent.click( getByText( 'Channels' ) );

		// The first call is when the `channels` chip is selected.
		expect( onToggleChip ).toHaveBeenCalledWith( 'channels', true );

		fireEvent.click( getByText( 'Locations' ) );

		// The second call is when the `locations` chip is selected.
		expect( onToggleChip ).toHaveBeenCalledWith( 'locations', true );

		fireEvent.click( getByText( 'Channels' ) );

		// The third call is when the `channels` chip is unselected.
		expect( onToggleChip ).toHaveBeenCalledWith( 'channels', false );
	} );
} );
