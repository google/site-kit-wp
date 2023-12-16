/**
 * WidgetCellWrapper component.
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

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { HIDDEN_CLASS } from '../util/constants';
import { Cell } from '../../../material-components';

function WidgetCellWrapper( { gridColumnWidth, children } ) {
	if ( 0 === gridColumnWidth ) {
		// Widget with columnWidth of 0 should be hidden
		return <div className={ HIDDEN_CLASS }>{ children }</div>;
	}

	// In practice this will be 3 or 4.
	if ( gridColumnWidth < 6 ) {
		return (
			<Cell lgSize={ gridColumnWidth } mdSize={ 4 } smSize={ 2 }>
				{ children }
			</Cell>
		);
	}

	// In practice this will be 6.
	if ( gridColumnWidth < 8 ) {
		return (
			<Cell lgSize={ gridColumnWidth } mdSize={ 8 }>
				{ children }
			</Cell>
		);
	}

	// In practice this will be 8, 9 or 12.
	return <Cell size={ gridColumnWidth }>{ children }</Cell>;
}

WidgetCellWrapper.propTypes = {
	gridColumnWidth: PropTypes.number.isRequired,
	children: PropTypes.element.isRequired,
};

export default WidgetCellWrapper;
