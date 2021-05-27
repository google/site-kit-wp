/**
 * Analytics Property Select component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import ProgressBar from '../../../../components/ProgressBar';
import { STORE_NAME, PROPERTY_CREATE } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { isValidAccountSelection } from '../../util';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function PropertySelect() {
	const {
		accountID,
		properties,
		isResolvingProperties,
	} = useSelect( ( select ) => {
		const data = {
			accountID: select( STORE_NAME ).getAccountID(),
			properties: [],
			isResolvingProperties: false,
		};

		if ( data.accountID ) {
			data.properties = select( STORE_NAME ).getProperties( data.accountID );
			data.isResolvingProperties = select( STORE_NAME ).isResolving( 'getProperties', [ data.accountID ] );
		}

		return data;
	} );

	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const hasGTMPropertyID = useSelect( ( select ) => !! select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const hasResolvedAccounts = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ) );

	const { selectProperty } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		const newPropertyID = item.dataset.value;
		if ( propertyID !== newPropertyID ) {
			selectProperty( newPropertyID, item.dataset.internalId ); // eslint-disable-line sitekit/acronym-case
			trackEvent( 'analytics_setup', 'property_change', newPropertyID );
		}
	}, [ propertyID, selectProperty ] );

	if ( ! isValidAccountSelection( accountID ) ) {
		return null;
	}

	if ( ! hasResolvedAccounts || isResolvingProperties ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-analytics__select-property"
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onChange }
			disabled={ hasExistingTag || hasGTMPropertyID }
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
						{ internalWebPropertyId // eslint-disable-line sitekit/acronym-case
							? sprintf(
								/* translators: %1$s: property name, %2$s: property ID */
								__( '%1$s (%2$s)', 'google-site-kit' ),
								name,
								id
							) : name
						}
					</Option>
				) ) }
		</Select>
	);
}
