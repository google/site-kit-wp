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
import { useCallback, useContext } from '@wordpress/element';
import { _x, __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../../material-components';
import ProgressBar from '../../../../components/ProgressBar';
import { MODULES_ANALYTICS, PROPERTY_CREATE } from '../../datastore/constants';
import { isValidAccountSelection } from '../../util';
import { trackEvent } from '../../../../util';
import ViewContextContext from '../../../../components/Root/ViewContextContext';
const { useSelect, useDispatch } = Data;

export default function PropertySelect() {
	const { accountID, properties, isResolvingProperties } = useSelect(
		( select ) => {
			const data = {
				accountID: select( MODULES_ANALYTICS ).getAccountID(),
				properties: [],
				isResolvingProperties: false,
			};

			if ( data.accountID ) {
				data.properties = select( MODULES_ANALYTICS ).getProperties(
					data.accountID
				);
				data.isResolvingProperties = select(
					MODULES_ANALYTICS
				).isResolving( 'getProperties', [ data.accountID ] );
			}

			return data;
		}
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasFinishedResolution( 'getAccounts' )
	);

	const { selectProperty } = useDispatch( MODULES_ANALYTICS );
	const viewContext = useContext( ViewContextContext );
	const onChange = useCallback(
		( index, item ) => {
			const newPropertyID = item.dataset.value;
			if ( propertyID !== newPropertyID ) {
				selectProperty( newPropertyID, item.dataset.internalId ); // eslint-disable-line sitekit/acronym-case
				const action =
					newPropertyID === PROPERTY_CREATE
						? 'change_property_new'
						: 'change_property';
				trackEvent( `${ viewContext }_analytics`, action, 'ua' );
			}
		},
		[ propertyID, selectProperty, viewContext ]
	);

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
			enhanced
			outlined
		>
			{ ( properties || [] )
				.concat( {
					id: PROPERTY_CREATE,
					name: __( 'Set up a new property', 'google-site-kit' ),
				} )
				.map( (
					// eslint-disable-next-line sitekit/acronym-case
					{ id, name, internalWebPropertyId },
					index
				) => (
					<Option
						key={ index }
						value={ id }
						data-internal-id={ internalWebPropertyId } // eslint-disable-line sitekit/acronym-case
					>
						{ internalWebPropertyId // eslint-disable-line sitekit/acronym-case
							? sprintf(
									/* translators: %1$s: property name, %2$s: property ID */
									_x(
										'%1$s (%2$s)',
										'Analytics property name and ID',
										'google-site-kit'
									),
									name,
									id
							  )
							: name }
					</Option>
				) ) }
		</Select>
	);
}
