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
				<ChipMultiSelectItem id="devices" selected>
					Devices
				</ChipMultiSelectItem>
			</ChipMultiSelect>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'calls `onToggleChip()` when a chip is selected', () => {
		const onToggleChip = jest.fn();

		const { getByText } = render(
			<ChipMultiSelect onToggleChip={ onToggleChip }>
				<ChipMultiSelectItem id="channels">
					Channels
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="locations" selected>
					Locations
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="devices">Devices</ChipMultiSelectItem>
			</ChipMultiSelect>
		);

		fireEvent.click( getByText( 'Channels' ) );

		expect( onToggleChip ).toHaveBeenCalledWith( 'channels', true );
	} );

	it( 'calls `onToggleChip()` when a chip is unselected', () => {
		const onToggleChip = jest.fn();

		const { getByText } = render(
			<ChipMultiSelect onToggleChip={ onToggleChip }>
				<ChipMultiSelectItem id="channels" selected>
					Channels
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="locations">
					Locations
				</ChipMultiSelectItem>
				<ChipMultiSelectItem id="devices" selected>
					Devices
				</ChipMultiSelectItem>
			</ChipMultiSelect>
		);

		fireEvent.click( getByText( 'Devices' ) );

		expect( onToggleChip ).toHaveBeenCalledWith( 'devices', false );
	} );
} );
