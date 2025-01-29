/**
 * ChipMultiSelectItem component.
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
import { omit } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Chip } from 'googlesitekit-components';
import CheckMark from '../../../svg/icons/check-2.svg';
import ChipMultiSelectContext from './ChipMultiSelectContext';

function ChipCheckmark() {
	return (
		<div className="mdc-chip__checkmark">
			<CheckMark className="mdc-chip__checkmark-svg" />
		</div>
	);
}

export default function ChipMultiSelectItem( { children, id, ...props } ) {
	const { selectedChips, setSelectedChips, onToggleChip } = useContext(
		ChipMultiSelectContext
	);

	return (
		<Chip
			className="googlesitekit-chip-multi-select__item"
			CheckMark={ ChipCheckmark }
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

ChipMultiSelectItem.propTypes = {
	children: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	...omit( Chip.propTypes, 'label' ),
};

ChipMultiSelectItem.defaultProps = {
	handleSelect: () => {},
	handleRemove: () => {},
	handleInteraction: () => {},
};
