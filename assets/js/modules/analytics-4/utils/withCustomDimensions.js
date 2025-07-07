/**
 * `withCustomDimensions` HOC.
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
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../components/KeyMetrics/key-metrics-widgets';
import {
	InsufficientPermissionsError,
	MetricTileTable,
	MetricTileWrapper,
} from '../../../components/KeyMetrics';
import {
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	isInsufficientPermissionsError,
} from '../../../util/errors';
import useViewOnly from '../../../hooks/useViewOnly';
import {
	AnalyticsUpdateError,
	CustomDimensionsMissingError,
} from '../components/key-metrics';
import useCustomDimensionsData from '../hooks/useCustomDimensionsData';

export default function withCustomDimensions( options = {} ) {
	const {
		dimensions,
		infoTooltip,
		reportOptions: wrappedReportOptions,
		title,
	} = options;

	return ( WrappedComponent ) => {
		function WithCustomDimensionsComponent( props ) {
			const isViewOnly = useViewOnly();

			const { Widget, widgetSlug } = props;
			const {
				description,
				infoTooltip: definedInfoTooltip,
				title: definedTitle,
			} = KEY_METRICS_WIDGETS[ widgetSlug ] || {};

			const tileTitle = title || definedTitle;
			const tileInfoTooltip =
				infoTooltip || definedInfoTooltip || description;

			const {
				customDimensions,
				hasCustomDimensions,
				customDimensionsCreationErrors,
				hasAnalyticsEditScope,
				isSyncingAvailableCustomDimensions,
				loading,
				isGatheringData,
				hasInvalidCustomDimensionError,
				invalidCustomDimensionReportOptions,
				redirectURL,
			} = useCustomDimensionsData( {
				dimensions,
				widgetSlug,
				reportOptions: wrappedReportOptions,
			} );

			const { clearError, scheduleSyncAvailableCustomDimensions } =
				useDispatch( MODULES_ANALYTICS_4 );
			const { setValues } = useDispatch( CORE_FORMS );
			const { setPermissionScopeError } = useDispatch( CORE_USER );

			const handleCreateCustomDimensions = useCallback( () => {
				if ( loading ) {
					return;
				}

				setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
					autoSubmit: true,
				} );

				if ( ! hasAnalyticsEditScope ) {
					setPermissionScopeError( {
						code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
						message: __(
							'Additional permissions are required to create new Analytics custom dimensions',
							'google-site-kit'
						),
						data: {
							status: 403,
							scopes: [ EDIT_SCOPE ],
							skipModal: true,
							redirectURL,
						},
					} );
				}
			}, [
				hasAnalyticsEditScope,
				loading,
				setPermissionScopeError,
				setValues,
				redirectURL,
			] );

			// If the list of available custom dimensions is outdated, sync it.
			useEffect( () => {
				if (
					! customDimensions ||
					! hasInvalidCustomDimensionError ||
					isSyncingAvailableCustomDimensions ||
					isViewOnly
				) {
					return;
				}

				( async () => {
					// Clear report errors so that the useEffect isn't
					// triggered multiple times.
					await Promise.all(
						invalidCustomDimensionReportOptions.map( ( args ) => {
							return clearError( 'getReport', [ args ] );
						} )
					);

					// Sync available custom dimensions.
					scheduleSyncAvailableCustomDimensions();
				} )();
			}, [
				clearError,
				customDimensions,
				hasInvalidCustomDimensionError,
				invalidCustomDimensionReportOptions,
				isSyncingAvailableCustomDimensions,
				isViewOnly,
				scheduleSyncAvailableCustomDimensions,
			] );

			// Return early if the wrapped widget doesn't need custom dimensions.
			if ( ! customDimensions ) {
				return <WrappedComponent { ...props } />;
			}

			// Show loading state.
			if ( loading || isGatheringData === undefined ) {
				return (
					<MetricTileWrapper
						infoTooltip={ tileInfoTooltip }
						moduleSlug="analytics-4"
						title={ tileTitle }
						Widget={ Widget }
						loading
					/>
				);
			}

			const commonErrorProps = {
				headerText: tileTitle,
				infoTooltip: tileInfoTooltip,
			};

			if (
				customDimensionsCreationErrors?.some(
					isInsufficientPermissionsError
				)
			) {
				// Handle permissions error encountered while creating
				// custom dimensions.
				return (
					<InsufficientPermissionsError
						{ ...commonErrorProps }
						moduleSlug="analytics-4"
						onRetry={ handleCreateCustomDimensions }
					/>
				);
			} else if ( customDimensionsCreationErrors?.length > 0 ) {
				// Handle generic errors encountered while creating
				// custom dimensions.
				return (
					<AnalyticsUpdateError
						{ ...commonErrorProps }
						error={ customDimensionsCreationErrors[ 0 ] }
						onRetry={ handleCreateCustomDimensions }
					/>
				);
			} else if ( false === hasCustomDimensions ) {
				return (
					<CustomDimensionsMissingError
						{ ...commonErrorProps }
						onRetry={ handleCreateCustomDimensions }
					/>
				);
			}

			if ( isGatheringData ) {
				return (
					<MetricTileTable
						infoTooltip={ tileInfoTooltip }
						moduleSlug="analytics-4"
						title={ tileTitle }
						Widget={ Widget }
						ZeroState={ () =>
							__(
								'Setup successful: Analytics is gathering data for this metric',
								'google-site-kit'
							)
						}
					/>
				);
			}

			return <WrappedComponent { ...props } />;
		}

		WithCustomDimensionsComponent.displayName = 'WithCustomDimensions';

		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WithCustomDimensionsComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}

		return WithCustomDimensionsComponent;
	};
}
