/**
 * Selection Panel Item component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import SelectionBox from '../SelectionBox';

export default function SelectionPanelItem( {
	children,
	id,
	slug,
	title,
	description,
	isItemSelected,
	isItemDisabled,
	onCheckboxChange,
	subtitle,
	suffix,
} ) {
	return (
		<div className="googlesitekit-selection-panel-item">
			<SelectionBox
				checked={ isItemSelected }
				disabled={ isItemDisabled }
				id={ id }
				onChange={ onCheckboxChange }
				title={ title }
				value={ slug }
			>
				{ subtitle && (
					<span className="googlesitekit-selection-panel-item-subtitle">
						{ subtitle }
					</span>
				) }
				{ description }
				{ children }
			</SelectionBox>
			{ !! suffix && (
				<span className="googlesitekit-selection-panel-item-suffix">
					{ suffix }
				</span>
			) }
		</div>
	);
}

SelectionPanelItem.propTypes = {
	children: PropTypes.node,
	id: PropTypes.string,
	slug: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.string,
	isItemSelected: PropTypes.bool,
	isItemDisabled: PropTypes.bool,
	onCheckboxChange: PropTypes.func,
	subtitle: PropTypes.string,
	suffix: PropTypes.node,
};
