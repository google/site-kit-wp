/**
 * PropertyOrWebDataStreamNotAvailableError component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { isValidPropertyID } from '../../../analytics-4/utils/validation';
import ErrorText from '../../../../components/ErrorText';
const { useSelect } = Data;

export default function PropertyOrWebDataStreamNotAvailableError( props ) {
	const { hasModuleAccess, isDisabled } = props;

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);

	const properties = useSelect( ( select ) =>
		hasModuleAccess !== false && ! isDisabled
			? select( MODULES_ANALYTICS_4 ).getPropertySummaries( accountID )
			: []
	);

	const webDataStreams = useSelect( ( select ) =>
		isValidPropertyID( propertyID ) && hasModuleAccess !== false
			? select( MODULES_ANALYTICS_4 ).getWebDataStreams( propertyID )
			: []
	);

	const getWebDataStreamsError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector(
			'getWebDataStreams',
			[ propertyID ]
		)
	);

	const getPropertiesError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector(
			'getAccountSummaries',
			[]
		)
	);

	if (
		! hasModuleAccess ||
		isDisabled ||
		properties === undefined ||
		webDataStreams === undefined ||
		! isValidPropertyID( propertyID )
	) {
		return null;
	}

	const propertyAvailable = properties.some(
		( { _id } ) => _id === propertyID
	);

	if (
		propertyAvailable &&
		measurementID &&
		! getWebDataStreamsError &&
		! webDataStreams.some(
			( { webStreamData } ) =>
				// eslint-disable-next-line sitekit/acronym-case
				webStreamData.measurementId === measurementID
		)
	) {
		return (
			<ErrorText
				message={ sprintf(
					/* translators: 1: Google Analytics 4 Measurement ID. */
					__(
						'The previously selected web data stream with measurement ID %1$s is no longer available. Please select a new web data stream to continue collecting data with Google Analytics 4.',
						'google-site-kit'
					),
					measurementID
				) }
			/>
		);
	}

	if ( ! propertyAvailable && ! getPropertiesError ) {
		return (
			<ErrorText
				message={ sprintf(
					/* translators: 1: Google Analytics 4 Property ID. */
					__(
						'The previously selected property with ID %1$s is no longer available. Please select a new property to continue collecting data with Google Analytics 4.',
						'google-site-kit'
					),
					propertyID
				) }
			/>
		);
	}

	return null;
}

PropertyOrWebDataStreamNotAvailableError.propTypes = {
	hasModuleAccess: PropTypes.bool,
	isDisabled: PropTypes.bool,
};
