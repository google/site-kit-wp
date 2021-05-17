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
	const unmappedProperties = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPropertiesIncludingGA4( accountID ) || [] );
	const propertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );
	const isLoading = useSelect( ( select ) => (
		! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getAccounts' ) ||
	! select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getProperties', [ accountID ] )
	) );

	const { selectProperty } = useDispatch( MODULES_ANALYTICS_4 );

	const onChange = useCallback( ( index, item ) => {
		const newPropertyID = item.dataset.value;
		// TODO - see AC
		if ( propertyID !== newPropertyID ) {
			selectProperty( newPropertyID );
			trackEvent( 'analytics_setup', 'property_change', newPropertyID );
		}
	}, [ propertyID, selectProperty ] );

	if ( isLoading ) {
		return <ProgressBar small />;
	}

	// TEMP FIX SO TESTS PASS
	const properties = unmappedProperties.map( ( p ) => {
		// console.log( p );
		// no idea why nullish... seems like mistake
		if ( p?._id ) {
			return {
				...p,
				// mapping to be like UA...
				id: p._id,
				name: p.displayName,
			};
		}
		return p;
	} )
	// undefineds are leaking in somehow
		.filter( Boolean );

	// TODO - fix undefineds at end
	// console.debug( properties );

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
					id: PROPERTY_CREATE,
					name: __( 'Set up a new property', 'google-site-kit' ),
				} )
				.map( ( { id, name }, index ) => (
					<Option
						key={ index }
						value={ id }
					>
						{ id === PROPERTY_CREATE
							? name
							: sprintf(
							/* translators: 1: Property name. 2: Property ID. */
								__( '%1$s (%2$s)', 'google-site-kit' ),
								name,
								id
							)
						}
					</Option>
				) ) }
		</Select>
	);
}

