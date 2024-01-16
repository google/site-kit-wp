/**
 * SettingsEnhancedMeasurementSwitch component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../datastore/constants';
import EnhancedMeasurementSwitch from '../common/EnhancedMeasurementSwitch';
import {
	isValidPropertyID,
	isValidPropertySelection,
	isValidWebDataStreamID,
	isValidWebDataStreamSelection,
} from '../../utils/validation';
const { useSelect, useDispatch } = Data;

export default function SettingsEnhancedMeasurementSwitch( {
	hasAnalytics4Access,
} ) {
	const isEnhancedMeasurementEnabled = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ENHANCED_MEASUREMENT_FORM,
			ENHANCED_MEASUREMENT_ENABLED
		)
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const isLoadingPropertySummaries = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).isLoadingPropertySummaries();
	} );

	const isLoadingWebDataStreams = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).isLoadingWebDataStreams( {
			hasModuleAccess: hasAnalytics4Access,
		} );
	} );

	const isEnhancedMeasurementStreamEnabled = useSelect( ( select ) => {
		if ( isLoadingPropertySummaries || isLoadingWebDataStreams ) {
			return undefined;
		}

		if (
			! isValidPropertyID( propertyID ) ||
			! isValidWebDataStreamID( webDataStreamID )
		) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).isEnhancedMeasurementStreamEnabled(
			propertyID,
			webDataStreamID
		);
	} );

	const isEnhancedMeasurementAlreadyEnabled = useSelect( ( select ) => {
		if (
			isLoadingPropertySummaries ||
			isLoadingWebDataStreams ||
			isEnhancedMeasurementStreamEnabled === undefined
		) {
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

		return (
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getEnhancedMeasurementSettings',
				[ propertyID, webDataStreamID ]
			) ||
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'isEnhancedMeasurementStreamAlreadyEnabled',
				[ propertyID, webDataStreamID ]
			)
		);
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { setEnhancedMeasurementStreamEnabled } =
		useDispatch( MODULES_ANALYTICS_4 );

	// If `isEnhancedMeasurementEnabled` is already defined in the first render, and either `PROPERTY_CREATE` or
	// `WEBDATASTREAM_CREATE` is selected, it means we're rendering this component after the user has actively
	// selected the enhanced measurement setting for the creation flow, in which case we don't want to override
	// the setting to `true` in the `useEffect()` unless the property or web data stream selection is subsequently
	// changed.
	const skipEffect = useRef(
		( propertyID === PROPERTY_CREATE ||
			webDataStreamID === WEBDATASTREAM_CREATE ) &&
			isEnhancedMeasurementEnabled !== undefined
	);

	useEffect( () => {
		if ( skipEffect.current ) {
			skipEffect.current = false;
			return;
		}

		if (
			isEnhancedMeasurementStreamEnabled === undefined ||
			! isValidPropertySelection( propertyID ) ||
			! isValidWebDataStreamSelection( webDataStreamID )
		) {
			return;
		}

		// Here we update the form value in order to toggle the switch in `EnhancedMeasurementSwitch`,
		if (
			propertyID === PROPERTY_CREATE ||
			webDataStreamID === WEBDATASTREAM_CREATE
		) {
			setValues( ENHANCED_MEASUREMENT_FORM, {
				[ ENHANCED_MEASUREMENT_ENABLED ]: true,
			} );
		} else {
			setValues( ENHANCED_MEASUREMENT_FORM, {
				[ ENHANCED_MEASUREMENT_ENABLED ]:
					isEnhancedMeasurementStreamEnabled,
			} );
		}
	}, [
		isEnhancedMeasurementStreamEnabled,
		propertyID,
		setEnhancedMeasurementStreamEnabled,
		setValues,
		webDataStreamID,
	] );

	return (
		<EnhancedMeasurementSwitch
			disabled={ ! hasAnalytics4Access }
			loading={ isLoading }
			isEnhancedMeasurementAlreadyEnabled={
				isEnhancedMeasurementAlreadyEnabled
			}
			onClick={ () => {
				if (
					! isValidPropertyID( propertyID ) ||
					! isValidWebDataStreamID( webDataStreamID )
				) {
					return;
				}

				// Here we update the enhanced measurement `streamEnabled` setting to ensure `validateCanSubmitChanges()` can detect
				// that the setting has changed via its call to `haveEnhancedMeasurementSettingsChanged()`.
				setEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID,
					! isEnhancedMeasurementEnabled
				);
			} }
		/>
	);
}

SettingsEnhancedMeasurementSwitch.propTypes = {
	hasAnalytics4Access: PropTypes.bool,
};
