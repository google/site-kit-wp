/**
 * Analytics-4 Settings controls.
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
 * External dependencies
 */
import { useUpdateEffect } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../../analytics-4/datastore/constants';
import { FORM_SETUP, MODULES_ANALYTICS } from '../../datastore/constants';
import { Select, Option } from '../../../../material-components';
import { GA4ActivateSwitch } from '../common';
import { PropertySelect } from '../../../analytics-4/components/common';
import ProgressBar from '../../../../components/ProgressBar';
import SettingsUseSnippetSwitch from './SettingsUseSnippetSwitch';
const { useSelect, useDispatch } = Data;

export default function GA4SettingsControls() {
	const [ matchedProperty, setMatchedProperty ] = useState();
	const [ matchedWebDataStream, setMatchedWebDataStream ] = useState();

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	// This select is needed to check whether the AdminAPI works or not.
	const properties = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getProperties( accountID )
	);

	const isAdminAPIWorking = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isAdminAPIWorking()
	);

	const enableGA4 = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4' )
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const {
		matchAccountProperty,
		matchWebDataStream,
		setPropertyID,
		setWebDataStreamID,
		setMeasurementID,
	} = useDispatch( MODULES_ANALYTICS_4 );

	useUpdateEffect( () => {
		const matchGA4Information = async () => {
			const matchingProperty = await matchAccountProperty( accountID );

			setMatchedProperty( matchingProperty );
			if ( matchingProperty?._id ) {
				const matchingWebDataStream = await matchWebDataStream(
					matchingProperty._id
				);
				setMatchedWebDataStream( matchingWebDataStream );
			}
		};

		if ( isAdminAPIWorking ) {
			setMatchedProperty( undefined );
			setMatchedWebDataStream( undefined );
			matchGA4Information();
		}
	}, [
		accountID,
		matchAccountProperty,
		matchWebDataStream,
		isAdminAPIWorking,
	] );

	const onActivate = useCallback( () => {
		const hasProperties = properties?.length > 0;
		const defaultProperty = hasProperties ? '' : PROPERTY_CREATE;
		const defaultWebDataStream = hasProperties ? '' : WEBDATASTREAM_CREATE;

		const { _id: newPropertyID = defaultProperty } = matchedProperty || {};
		const { _id: newWebDataStreamID = defaultWebDataStream } =
			matchedWebDataStream || {};

		setPropertyID( newPropertyID );
		setWebDataStreamID( newWebDataStreamID );
		setMeasurementID(
			// eslint-disable-next-line sitekit/acronym-case
			matchedWebDataStream?.webStreamData.measurementId || ''
		);
	}, [
		properties,
		matchedProperty,
		matchedWebDataStream,
		setPropertyID,
		setWebDataStreamID,
		setMeasurementID,
	] );

	const isDisabled = ! propertyID && ! enableGA4;

	if ( isAdminAPIWorking === undefined ) {
		return <ProgressBar height={ isDisabled ? 180 : 212 } small />;
	}

	if ( ! isAdminAPIWorking ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<div className="googlesitekit-setup-module__inputs">
				{ ! isDisabled && (
					<PropertySelect
						label={ __(
							'Google Analytics 4 Property',
							'google-site-kit'
						) }
					/>
				) }
				{ isDisabled && (
					<Select
						className="googlesitekit-analytics__select-property"
						label={ __(
							'Google Analytics 4 Property',
							'google-site-kit'
						) }
						value={ matchedProperty?._id || '' }
						disabled
						enhanced
						outlined
					>
						<Option value={ matchedProperty?._id || '' }>
							{ ! matchedProperty?._id ||
							! matchedProperty?.displayName
								? ''
								: sprintf(
										/* translators: 1: Property name. 2: Property ID. */
										_x(
											'%1$s (%2$s)',
											'Analytics property name and ID',
											'google-site-kit'
										),
										matchedProperty.displayName,
										matchedProperty._id
								  ) }
						</Option>
					</Select>
				) }
			</div>

			{ isDisabled && <GA4ActivateSwitch onActivate={ onActivate } /> }

			{ ! isDisabled && (
				<div className="googlesitekit-settings-module__meta-item">
					<SettingsUseSnippetSwitch />
				</div>
			) }
		</div>
	);
}
