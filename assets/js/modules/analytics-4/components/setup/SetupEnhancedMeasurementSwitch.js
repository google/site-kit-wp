/**
 * SetupEnhancedMeasurementSwitch component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	FORM_SETUP,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../datastore/constants';
import EnhancedMeasurementSwitch from '../common/EnhancedMeasurementSwitch';
import {
	isValidAccountID,
	isValidPropertyID,
	isValidPropertySelection,
	isValidWebDataStreamID,
	isValidWebDataStreamSelection,
} from '../../utils/validation';

export default function SetupEnhancedMeasurementSwitch() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const isLoadingPropertySummaries = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isLoadingPropertySummaries()
	);

	const isLoadingWebDataStreams = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isLoadingWebDataStreams( {
			hasModuleAccess: true,
		} )
	);

	const isEnhancedMeasurementAlreadyEnabled = useSelect( ( select ) => {
		if ( isLoadingPropertySummaries || isLoadingWebDataStreams ) {
			return undefined;
		}

		if (
			! isValidPropertyID( propertyID ) ||
			! isValidWebDataStreamID( webDataStreamID )
		) {
			return null;
		}

		return select(
			MODULES_ANALYTICS_4
		).isEnhancedMeasurementStreamAlreadyEnabled(
			propertyID,
			webDataStreamID
		);
	} );

	const isLoading = useSelect( ( select ) => {
		if (
			! isValidPropertySelection( propertyID ) ||
			! isValidWebDataStreamSelection( webDataStreamID ) ||
			isLoadingPropertySummaries ||
			isLoadingWebDataStreams
		) {
			return true;
		}

		if (
			propertyID === PROPERTY_CREATE ||
			webDataStreamID === WEBDATASTREAM_CREATE
		) {
			return false;
		}

		return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'isEnhancedMeasurementStreamAlreadyEnabled',
			[ propertyID, webDataStreamID ]
		);
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { getValue } = useSelect( ( select ) => select( CORE_FORMS ) );

	useMount( () => {
		const autoSubmit = getValue( FORM_SETUP, 'autoSubmit' );
		if ( ! autoSubmit ) {
			setValues( ENHANCED_MEASUREMENT_FORM, {
				[ ENHANCED_MEASUREMENT_ENABLED ]: true,
			} );
		}
	} );

	if ( ! isValidAccountID( accountID ) ) {
		return null;
	}

	return (
		<EnhancedMeasurementSwitch
			loading={ isLoading }
			isEnhancedMeasurementAlreadyEnabled={
				isEnhancedMeasurementAlreadyEnabled
			}
		/>
	);
}
