/**
 * Analytics Property Select component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import ProgressBar from '../../../../components/progress-bar';
import { STORE_NAME, PROPERTY_CREATE } from '../../datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { isValidAccountID } from '../../util';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function PropertySelect() {
	const {
		accountID,
		propertyID,
		properties,
		hasExistingTag,
		hasGtmTag,
		isLoadingAccounts,
		isLoadingProperties,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const data = {
			accountID: store.getAccountID(),
			propertyID: store.getPropertyID(),
			properties: [],
			hasExistingTag: store.hasExistingTag(),
			hasGtmTag: false,
			isLoadingAccounts: store.isDoingGetAccounts(),
			isLoadingProperties: false,
		};

		if ( data.accountID ) {
			data.properties = store.getProperties( data.accountID );
			data.isLoadingProperties = store.isDoingGetProperties( data.accountID );
		}

		if ( ! data.hasExistingTag ) {
			data.hasGtmTag = !! select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();
		}

		return data;
	} );

	const { selectProperty } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		const newPropertyID = item.dataset.value;
		if ( propertyID !== newPropertyID ) {
			selectProperty( newPropertyID, item.dataset.internalId ); // eslint-disable-line sitekit/camelcase-acronyms
			trackEvent( 'analytics_setup', 'property_change', newPropertyID );
		}
	}, [ propertyID ] );

	if ( isLoadingAccounts || isLoadingProperties ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-analytics__select-property"
			label={ __( 'Property', 'google-site-kit' ) }
			value={ propertyID }
			onEnhancedChange={ onChange }
			disabled={ hasExistingTag || hasGtmTag || ! isValidAccountID( accountID ) }
			enhanced
			outlined
		>
			{ ( properties || [] )
				.concat( {
					id: PROPERTY_CREATE,
					name: __( 'Set up a new property', 'google-site-kit' ),
				} )
				.map( ( { id, name, internalWebPropertyId }, index ) => ( // eslint-disable-line sitekit/camelcase-acronyms
					<Option
						key={ index }
						value={ id }
						data-internal-id={ internalWebPropertyId } // eslint-disable-line sitekit/camelcase-acronyms
					>
						{ name }
					</Option>
				) ) }
		</Select>
	);
}
