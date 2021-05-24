/**
 * PropertySelectIncludingGA4 component.
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
import { __, _x, sprintf } from '@wordpress/i18n';

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
	const accountID = useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccountID() );
	const unmappedProperties = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPropertiesIncludingGA4( accountID ) || [] );
	const ga4PropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );
	const uaPropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPropertyID() );
	const isLoading = useSelect( ( select ) => {
		const isLoadingAccounts =	! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getAccounts' );
		const isLoadingPropertiesGA4 =	! select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getProperties', [ accountID ] );
		const isLoadingProperties =	! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getProperties', [ accountID ] );

		return isLoadingAccounts || isLoadingProperties || isLoadingPropertiesGA4;
	} );

	const primaryPropertyType = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPrimaryPropertyType() );

	const ga4Dispatch = useDispatch( MODULES_ANALYTICS_4 );
	const uaDispatch = useDispatch( MODULES_ANALYTICS );

	const propertyID = primaryPropertyType === 'ga4' ? ga4PropertyID : uaPropertyID;

	const onChange = useCallback( ( index, item ) => {
		const newPropertyID = item.dataset.value;
		const internalID = item.dataset.internalId; // eslint-disable-line sitekit/acronym-case
		if ( propertyID !== newPropertyID ) {
			trackEvent( 'analytics_setup', 'property_change', newPropertyID );
			if ( !! internalID ) {
				uaDispatch.selectProperty( newPropertyID, internalID );
				uaDispatch.setPrimaryPropertyType( 'ua' );

				ga4Dispatch.setPropertyID( '' );
				ga4Dispatch.setWebDataStreamID( '' );
				ga4Dispatch.setMeasurementID( '' );
			} else {
				ga4Dispatch.selectProperty( newPropertyID );
				uaDispatch.setPrimaryPropertyType( 'ga4' );

				uaDispatch.setPropertyID( '' );
				uaDispatch.setInternalWebPropertyID( '' );
				uaDispatch.setProfileID( '' );
			}
		}
	}, [ propertyID, ga4Dispatch, uaDispatch ] );

	if ( ! isValidAccountID( accountID ) ) {
		return null;
	}

	if ( isLoading ) {
		return <ProgressBar small />;
	}

	const properties = unmappedProperties.map( ( p ) => ( {
		...p,
		id: p._id || p.id,
		name: p.displayName || p.name,
	} ) );

	return (
		<Select
			className="googlesitekit-analytics__select-property"
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			{ ( properties || [] )
				.concat( {
					id: PROPERTY_CREATE,
					name: __( 'Set up a new property', 'google-site-kit' ),
				} )
				.map( ( { id, name, internalWebPropertyId }, index ) => ( // eslint-disable-line sitekit/acronym-case
					<Option
						key={ index }
						value={ id }
						data-internal-id={ internalWebPropertyId } // eslint-disable-line sitekit/acronym-case
					>
						{ id === PROPERTY_CREATE
							? name
							: sprintf(
								/* translators: 1: Property name. 2: Property ID. */
								_x( '%1$s (%2$s)', '{property name} ({property id})', 'google-site-kit' ),
								name,
								id
							)
						}
					</Option>
				) ) }
		</Select>
	);
}
