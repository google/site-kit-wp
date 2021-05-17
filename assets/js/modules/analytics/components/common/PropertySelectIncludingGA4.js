/**
 * GA4 Property Select component.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import ProgressBar from '../../../../components/ProgressBar';
import { MODULES_ANALYTICS_4, PROPERTY_CREATE } from '../../../analytics-4/datastore/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { isValidAccountID } from '../../util';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function PropertySelectIncludingGA4() {
// TODO: Update this select hook to pull accountID from the modules/analytics-4 datastore when GA4 module becomes separated from the Analytics one
	const accountID = useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccountID() );
	const properties = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getProperties( accountID ) || [] );
	const propertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );
	const isLoading = useSelect( ( select ) => (
		! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getAccounts' ) ||
	! select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getProperties', [ accountID ] )
	) );

	const { selectProperty } = useDispatch( MODULES_ANALYTICS_4 );

	const onChange = useCallback( ( index, item ) => {
		const newPropertyID = item.dataset.value;
		if ( propertyID !== newPropertyID ) {
			selectProperty( newPropertyID );
			trackEvent( 'analytics_setup', 'property_change', newPropertyID );
		}
	}, [ propertyID, selectProperty ] );

	if ( isLoading ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-analytics__select-property"
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onChange }
			disabled={ ! isValidAccountID( accountID ) }
			enhanced
			outlined
		>
			{ ( properties || [] )
				.concat( {
					_id: PROPERTY_CREATE,
					displayName: __( 'Set up a new property', 'google-site-kit' ),
				} )
				.map( ( { _id, displayName }, index ) => (
					<Option
						key={ index }
						value={ _id }
					>
						{ _id === PROPERTY_CREATE
							? displayName
							: sprintf(
							/* translators: 1: Property name. 2: Property ID. */
								__( '%1$s (%2$s)', 'google-site-kit' ),
								displayName,
								_id
							)
						}
					</Option>
				) ) }
		</Select>
	);
}

