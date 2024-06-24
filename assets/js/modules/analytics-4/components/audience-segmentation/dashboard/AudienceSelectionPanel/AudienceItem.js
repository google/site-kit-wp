/**
 * Audience Selection Panel AudienceItem
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_CHANGED,
	AUDIENCE_SELECTION_FORM,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { numFmt } from '../../../../../../util';
import { SelectionPanelItem } from '../../../../../../components/SelectionPanel';

const { useSelect, useDispatch } = Data;

export default function AudienceItem( {
	slug,
	title,
	description,
	subtitle,
	userCount,
} ) {
	const selectedItems = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SELECTION_FORM,
			AUDIENCE_SELECTED
		)
	);
	const userCountReportError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAudiencesUserCountReportError()
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const onCheckboxChange = useCallback(
		( event ) => {
			setValues( AUDIENCE_SELECTION_FORM, {
				[ AUDIENCE_SELECTED ]: event.target.checked
					? selectedItems.concat( [ slug ] )
					: selectedItems.filter(
							( selectedItem ) => selectedItem !== slug
					  ),
				[ AUDIENCE_SELECTION_CHANGED ]: true,
			} );
		},
		[ selectedItems, setValues, slug ]
	);

	const isItemSelected = selectedItems?.includes( slug );

	const id = `audience-selection-checkbox-${ slug }`;

	return (
		<SelectionPanelItem
			id={ id }
			slug={ slug }
			title={ title }
			subtitle={ subtitle }
			description={ description }
			isItemSelected={ isItemSelected }
			onCheckboxChange={ onCheckboxChange }
			suffix={ userCountReportError ? '-' : numFmt( userCount ) }
		/>
	);
}

AudienceItem.propTypes = {
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	subtitle: PropTypes.string.isRequired,
	userCount: PropTypes.number.isRequired,
};
