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
import { Option, ProgressBar, Select } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import {
	MODULES_ANALYTICS,
	PROPERTY_TYPE_GA4,
	PROPERTY_TYPE_UA,
	PROPERTY_CREATE,
} from '../../datastore/constants';
import { isValidAccountID } from '../../util';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function PropertySelectIncludingGA4() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const unmappedProperties = useSelect(
		( select ) =>
			select( MODULES_ANALYTICS ).getPropertiesIncludingGA4(
				accountID
			) || []
	);
	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const uaPropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const isLoading = useSelect( ( select ) => {
		const isLoadingAccounts =
			! select( MODULES_ANALYTICS ).hasFinishedResolution(
				'getAccounts'
			);
		const isLoadingPropertiesGA4 = ! select(
			MODULES_ANALYTICS_4
		).hasFinishedResolution( 'getProperties', [ accountID ] );
		const isLoadingProperties = ! select(
			MODULES_ANALYTICS
		).hasFinishedResolution( 'getProperties', [ accountID ] );

		return (
			isLoadingAccounts || isLoadingProperties || isLoadingPropertiesGA4
		);
	} );

	const primaryPropertyType = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPrimaryPropertyType()
	);
	const propertyID =
		primaryPropertyType === PROPERTY_TYPE_GA4
			? ga4PropertyID
			: uaPropertyID;

	const ga4Dispatch = useDispatch( MODULES_ANALYTICS_4 );
	const uaDispatch = useDispatch( MODULES_ANALYTICS );
	const viewContext = useViewContext();

	const onChange = useCallback(
		async ( index, item ) => {
			const newPropertyID = item.dataset.value;
			// eslint-disable-next-line sitekit/acronym-case
			const internalID = item.dataset.internalId;
			if ( propertyID === newPropertyID ) {
				return;
			}

			if ( newPropertyID === PROPERTY_CREATE ) {
				trackEvent(
					`${ viewContext }_analytics`,
					'change_property_new',
					'ua'
				);
			} else {
				const label = !! internalID ? 'ua' : 'ga4';
				trackEvent(
					`${ viewContext }_analytics`,
					'change_property',
					label
				);
			}

			if ( !! internalID || newPropertyID === PROPERTY_CREATE ) {
				const ga4Property = await ga4Dispatch.matchAccountProperty(
					accountID
				);

				let webdatastream;
				if ( ga4Property?._id ) {
					webdatastream = await ga4Dispatch.matchWebDataStream(
						ga4Property._id
					);
				}

				uaDispatch.selectProperty( newPropertyID, internalID );
				uaDispatch.setPrimaryPropertyType( PROPERTY_TYPE_UA );

				ga4Dispatch.setPropertyID( ga4Property?._id || '' );
				ga4Dispatch.setWebDataStreamID( webdatastream?._id || '' );
				ga4Dispatch.updateSettingsForMeasurementID(
					// eslint-disable-next-line sitekit/acronym-case
					webdatastream?.webStreamData?.measurementId || ''
				);
			} else {
				const uaProperty = await uaDispatch.findMatchedProperty(
					accountID
				);

				let uaProfile;
				if ( uaProperty?.id ) {
					uaProfile = await uaDispatch.findPropertyProfile(
						accountID,
						uaProperty.id,
						// eslint-disable-next-line sitekit/acronym-case
						uaProperty.defaultProfileId
					);
				}

				ga4Dispatch.selectProperty( newPropertyID );
				uaDispatch.setPrimaryPropertyType( PROPERTY_TYPE_GA4 );

				uaDispatch.setPropertyID( uaProperty?.id || '' );
				uaDispatch.setInternalWebPropertyID(
					// eslint-disable-next-line sitekit/acronym-case
					uaProperty?.internalWebPropertyId || ''
				);
				uaDispatch.setProfileID( uaProfile?.id || '' );
			}
		},
		[ accountID, propertyID, ga4Dispatch, uaDispatch, viewContext ]
	);

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
				.map(
					(
						{ id, name, internalWebPropertyId } // eslint-disable-line sitekit/acronym-case
					) => (
						<Option
							key={ id }
							value={ id }
							data-internal-id={ internalWebPropertyId } // eslint-disable-line sitekit/acronym-case
						>
							{ id === PROPERTY_CREATE
								? name
								: sprintf(
										/* translators: 1: Property name. 2: Property ID. */
										_x(
											'%1$s (%2$s)',
											'Analytics property name and ID',
											'google-site-kit'
										),
										name,
										id
								  ) }
						</Option>
					)
				) }
		</Select>
	);
}
