/**
 * Custom hook for managing custom dimensions data and state.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../components/KeyMetrics/key-metrics-widgets';
import { isInvalidCustomDimensionError } from '../utils/custom-dimensions';

/**
 * Gets custom dimensions data and state.
 *
 * @since 1.156.0
 *
 * @param {Object}          options               Hook options.
 * @param {Array}           options.dimensions    Custom dimensions array.
 * @param {string}          options.widgetSlug    Widget slug for getting widget configuration.
 * @param {Object|Function} options.reportOptions Report options for data fetching.
 * @return {Object} Object containing custom dimensions data and state.
 */
export default function useCustomDimensionsData( {
	dimensions,
	widgetSlug,
	reportOptions: wrappedReportOptions,
} ) {
	const { requiredCustomDimensions } =
		KEY_METRICS_WIDGETS[ widgetSlug ] || {};

	// Determine which custom dimensions to use.
	const customDimensions = useMemo( () => {
		if ( Array.isArray( dimensions ) && dimensions.length ) {
			return dimensions;
		}

		if (
			Array.isArray( requiredCustomDimensions ) &&
			requiredCustomDimensions.length
		) {
			return requiredCustomDimensions;
		}

		return null;
	}, [ dimensions, requiredCustomDimensions ] );

	const hasCustomDimensions = useSelect(
		( select ) =>
			! customDimensions ||
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				customDimensions
			)
	);

	const isAutoCreatingCustomDimensions = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_CUSTOM_DIMENSIONS_CREATE,
			'isAutoCreatingCustomDimensions'
		)
	);

	const isCreatingCustomDimensions = useSelect( ( select ) => {
		if ( isAutoCreatingCustomDimensions ) {
			return true;
		}

		return (
			!! customDimensions &&
			customDimensions.some( ( dimension ) =>
				select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension(
					dimension
				)
			)
		);
	} );

	const customDimensionsCreationErrors = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return [];
		}

		const errors = [];

		customDimensions.forEach( ( dimension ) => {
			const error =
				select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
					dimension
				);

			if ( error ) {
				errors.push( error );
			}
		} );

		return errors;
	} );

	const hasAnalyticsEditScope = useSelect(
		( select ) =>
			!! customDimensions && select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const isSyncingAvailableCustomDimensions = useSelect(
		( select ) =>
			!! customDimensions &&
			select( MODULES_ANALYTICS_4 ).isSyncingAvailableCustomDimensions()
	);

	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'custom_dimensions',
	} );

	const isNavigatingToOAuthURL = useSelect( ( select ) => {
		const OAuthURL = select( CORE_USER ).getConnectURL( {
			additionalScopes: [ EDIT_SCOPE ],
			redirectURL,
		} );

		if ( ! OAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( OAuthURL );
	} );

	const reportOptions = useSelect( ( select ) => {
		if ( ! wrappedReportOptions ) {
			return null;
		}

		return isFunction( wrappedReportOptions )
			? wrappedReportOptions( select )
			: wrappedReportOptions;
	} );

	const reportError = useSelect( ( select ) => {
		if ( ! reportOptions ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] );
	} );

	const loading =
		isCreatingCustomDimensions ||
		isSyncingAvailableCustomDimensions ||
		isNavigatingToOAuthURL ||
		hasCustomDimensions === undefined;

	const isGatheringData = useSelect( ( select ) => {
		const isGA4GatheringData =
			select( MODULES_ANALYTICS_4 ).isGatheringData();

		if ( isGA4GatheringData !== false ) {
			return isGA4GatheringData;
		}

		if ( loading || ! hasCustomDimensions ) {
			return null;
		}

		if ( ! customDimensions ) {
			return false;
		}

		return select( MODULES_ANALYTICS_4 ).areCustomDimensionsGatheringData(
			customDimensions
		);
	} );

	const dataAvailabilityReportErrors = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return {};
		}

		return select( MODULES_ANALYTICS_4 ).getDataAvailabilityReportErrors(
			customDimensions
		);
	} );

	// Invalid custom dimension error handling.
	const hasInvalidCustomDimensionError =
		( isGatheringData &&
			Object.values( dataAvailabilityReportErrors ).some( ( error ) =>
				isInvalidCustomDimensionError( error )
			) ) ||
		( ! isGatheringData && isInvalidCustomDimensionError( reportError ) );

	const invalidCustomDimensionReportOptions = useSelect( ( select ) => {
		if ( ! hasInvalidCustomDimensionError ) {
			return [];
		}

		if ( isGatheringData ) {
			const { getDataAvailabilityReportOptions } =
				select( MODULES_ANALYTICS_4 );

			return Object.keys( dataAvailabilityReportErrors )
				.filter( ( dimension ) =>
					isInvalidCustomDimensionError(
						dataAvailabilityReportErrors[ dimension ]
					)
				)
				.map( ( dimension ) =>
					getDataAvailabilityReportOptions( dimension )
				);
		}

		if ( isInvalidCustomDimensionError( reportError ) ) {
			return [ reportOptions ];
		}

		return [];
	} );

	return {
		customDimensions,
		hasCustomDimensions,
		isAutoCreatingCustomDimensions,
		isCreatingCustomDimensions,
		customDimensionsCreationErrors,
		hasAnalyticsEditScope,
		isSyncingAvailableCustomDimensions,
		isNavigatingToOAuthURL,
		reportOptions,
		reportError,
		loading,
		isGatheringData,
		dataAvailabilityReportErrors,
		hasInvalidCustomDimensionError,
		invalidCustomDimensionReportOptions,
		redirectURL,
	};
}
