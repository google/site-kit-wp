/**
 * Selection Panel Items component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function SelectionPanelItems( {
	currentSelectionTitle = __( 'Current selection', 'google-site-kit' ),
	availableItemsTitle = __( 'Additional items', 'google-site-kit' ),
	savedItemSlugs = [],
	availableSavedItems = {},
	availableUnsavedItems = {},
	ItemComponent,
} ) {
	const renderItems = ( items ) => {
		return Object.keys( items ).map( ( slug ) => (
			<ItemComponent
				key={ slug }
				slug={ slug }
				savedItemSlugs={ savedItemSlugs }
				{ ...items[ slug ] }
			/>
		) );
	};

	return (
		<div className="googlesitekit-selection-panel-items">
			{
				// Split list into two sections with sub-headings for current selection and
				// additional items if there are already saved items.
				savedItemSlugs?.length !== 0 && (
					<Fragment>
						<p className="googlesitekit-selection-panel-items__subheading">
							{ currentSelectionTitle }
						</p>
						<div className="googlesitekit-selection-panel-items__subsection">
							{ renderItems( availableSavedItems ) }
						</div>
						<p className="googlesitekit-selection-panel-items__subheading">
							{ availableItemsTitle }
						</p>
					</Fragment>
				)
			}
			<div className="googlesitekit-selection-panel-items__subsection">
				{ renderItems( availableUnsavedItems ) }
			</div>
		</div>
	);
}

SelectionPanelItems.propTypes = {
	currentSelectionTitle: PropTypes.string,
	availableItemsTitle: PropTypes.string,
	savedItemSlugs: PropTypes.array,
	availableSavedItems: PropTypes.object,
	availableUnsavedItems: PropTypes.object,
	ItemComponent: PropTypes.elementType,
};
