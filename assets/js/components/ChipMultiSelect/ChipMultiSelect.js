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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Provider } from './ChipMultiSelectContext';

export default function ChipMultiSelect( {
	children,
	onToggleChip = () => {},
} ) {
	const [ selectedChips, setSelectedChips ] = useState( [] );

	return (
		<Provider value={ { selectedChips, setSelectedChips, onToggleChip } }>
			<div className="googlesitekit-chip-multi-select">{ children }</div>
		</Provider>
	);
}

ChipMultiSelect.propTypes = {
	children: PropTypes.node.isRequired,
	onToggleChip: PropTypes.func,
};
