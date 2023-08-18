/**
 * EnhancedMeasurementToggle component.
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar, Switch } from 'googlesitekit-components';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	isValidPropertyID,
	isValidWebDataStreamID,
} from '../../utils/validation';
import Link from '../../../../components/Link';
const { useDispatch, useSelect } = Data;

export default function EnhancedMeasurementToggle( {
	hasModuleAccess = true,
} ) {
	const { propertyID, webDataStreamID } = useSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getSettings() || {}
	);

	const enhancedMeasurementSettings = useSelect( ( select ) =>
		isValidPropertyID( propertyID ) &&
		isValidWebDataStreamID( webDataStreamID ) &&
		hasModuleAccess !== false
			? select( MODULES_ANALYTICS_4 ).getEnhancedMeasurementSettings(
					propertyID,
					webDataStreamID
			  )
			: null
	);

	const isLoading = useSelect( ( select ) => {
		const loadedEnhancedMeasurementSettings =
			isValidPropertyID( propertyID ) &&
			isValidWebDataStreamID( webDataStreamID ) &&
			hasModuleAccess !== false
				? select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getEnhancedMeasurementSettings',
						[ propertyID, webDataStreamID ]
				  )
				: true;
		return ! loadedEnhancedMeasurementSettings;
	} );

	const { setEnhancedMeasurementSettings } =
		useDispatch( MODULES_ANALYTICS_4 );

	const onChange = useCallback( () => {
		setEnhancedMeasurementSettings( propertyID, webDataStreamID, {
			...enhancedMeasurementSettings,
			streamEnabled: ! enhancedMeasurementSettings?.streamEnabled,
		} );
	}, [
		enhancedMeasurementSettings,
		propertyID,
		setEnhancedMeasurementSettings,
		webDataStreamID,
	] );

	if ( enhancedMeasurementSettings === null ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<div className="googlesitekit-analytics-enable">
				{ isLoading && <ProgressBar height={ 20 } small /> }
				{ ! isLoading && (
					<Switch
						label={ __(
							'Enable enhanced measurement',
							'google-site-kit'
						) }
						checked={ Boolean(
							enhancedMeasurementSettings?.streamEnabled
						) }
						onClick={ onChange }
						hideLabel={ false }
						disabled={ ! hasModuleAccess }
					/>
				) }
				<p>
					{ __(
						'Automatically measure interactions and content on your sites in addition to standard page view measurement.',
						'google-site-kit'
					) }
					{ ' ' /* POC code :) */ }
					<Link
						href="https://support.google.com/analytics/answer/9216061?hl=en-GB&utm_id=ad"
						external
						aria-label={ __(
							'Learn more about Ad Sense Web Stories.',
							'google-site-kit'
						) }
					>
						{ __( 'Learn more', 'google-site-kit' ) }
					</Link>
				</p>
			</div>
		</div>
	);
}

EnhancedMeasurementToggle.propTypes = {
	hasModuleAccess: PropTypes.bool,
};
