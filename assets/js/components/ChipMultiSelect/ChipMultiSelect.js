/**
 * ChipMultiSelect component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ChipMultiSelectContext, { Provider } from './ChipMultiSelectContext';

import { omit } from 'lodash';
import { ChipSet, Chip } from '@material/react-chips';

function MultiSelectItem( { children, id, ...props } ) {
	const { selectedChips, setSelectedChips, onToggleChip } = useContext(
		ChipMultiSelectContext
	);

	return (
		<Chip
			className="googlesitekit-chip-multi-select__item"
			onClick={ () => {
				const newSelectedChips = selectedChips.includes( id )
					? selectedChips.filter( ( item ) => item !== id )
					: [ ...selectedChips, id ];

				setSelectedChips( newSelectedChips );

				onToggleChip( id, newSelectedChips.includes( id ) );
			} }
			id={ id }
			label={ children }
			selected={ selectedChips.includes( id ) }
			{ ...props }
		/>
	);
}
MultiSelectItem.propTypes = {
	children: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	...omit( Chip.propTypes, 'label' ),
};

MultiSelectItem.defaultProps = {
	handleSelect: () => {},
	handleRemove: () => {},
	handleInteraction: () => {},
};

export default function ChipMultiSelect( {
	children,
	onToggleChip = () => {},
} ) {
	const [ selectedChips, setSelectedChips ] = useState( [] );

	return (
		<div>
			<Provider
				value={ { selectedChips, setSelectedChips, onToggleChip } }
			>
				<div className="googlesitekit-chip-multi-select">
					{ children }
				</div>
			</Provider>

			<Provider
				value={ { selectedChips, setSelectedChips, onToggleChip } }
			>
				<ChipSet
					filter
					selectedChipIds={ selectedChips }
					handleSelect={ ( selectedChipIds ) => {
						setSelectedChips( selectedChipIds );
					} }
				>
					<MultiSelectItem id="1">Item 1</MultiSelectItem>
					<MultiSelectItem id="2">Item 2</MultiSelectItem>
					<MultiSelectItem id="3">Item 3</MultiSelectItem>
				</ChipSet>
			</Provider>
		</div>
	);
}

ChipMultiSelect.propTypes = {
	children: PropTypes.node.isRequired,
	onToggleChip: PropTypes.func,
};
