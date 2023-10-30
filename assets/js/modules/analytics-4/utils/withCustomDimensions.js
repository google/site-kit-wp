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
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE as ANALYTICS_EDIT_SCOPE } from '../../analytics/datastore/constants';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../components/KeyMetrics/key-metrics-widgets';
import MetricTileWrapper from '../../../components/KeyMetrics/MetricTileWrapper';
import MetricTileTable from '../../../components/KeyMetrics/MetricTileTable';
import {
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	isInsufficientPermissionsError,
} from '../../../util/errors';
import { isInvalidCustomDimensionError } from './custom-dimensions';
import {
	AnalyticsUpdateError,
	CustomDimensionsMissingError,
	InsufficientPermissionsError,
} from '../components/key-metrics';
const { useSelect, useDispatch } = Data;

export default function withCustomDimensions( options = {} ) {
	const {
		dimensions,
		infoTooltip,
		reportOptions: wrappedReportOptions,
		title,
	} = options;

	return ( WrappedComponent ) => {
		const WithCustomDimensionsComponent = ( props ) => {
			const { Widget, widgetSlug } = props;
			const {
				description,
				infoTooltip: definedInfoTooltip,
				requiredCustomDimensions,
				title: definedTitle,
			} = KEY_METRICS_WIDGETS[ widgetSlug ] || {};

			const tileTitle = title || definedTitle;
			const tileInfoTooltip =
				infoTooltip || definedInfoTooltip || description;

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
			}, [ requiredCustomDimensions ] );

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
						select(
							MODULES_ANALYTICS_4
						).getCreateCustomDimensionError( dimension );

					if ( error ) {
						errors.push( error );
					}
				} );

				return errors;
			} );
			const hasAnalyticsEditScope = useSelect(
				( select ) =>
					!! customDimensions &&
					select( CORE_USER ).hasScope( ANALYTICS_EDIT_SCOPE )
			);
			const isSyncingAvailableCustomDimensions = useSelect(
				( select ) =>
					!! customDimensions &&
					select(
						MODULES_ANALYTICS_4
					).isSyncingAvailableCustomDimensions()
			);
			const isNavigatingToOAuthURL = useSelect( ( select ) => {
				const OAuthURL = select( CORE_USER ).getConnectURL( {
					additionalScopes: [ ANALYTICS_EDIT_SCOPE ],
					redirectURL: global.location.href,
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

				return select( MODULES_ANALYTICS_4 ).getErrorForSelector(
					'getReport',
					[ reportOptions ]
				);
			} );

			const {
				clearError,
				fetchSyncAvailableCustomDimensions,
				invalidateResolution,
			} = useDispatch( MODULES_ANALYTICS_4 );
			const { setValues } = useDispatch( CORE_FORMS );
			const { setPermissionScopeError } = useDispatch( CORE_USER );

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
					// Custom dimension gathering data is not applicable if we're still loading or there are no custom dimensions.
					return null;
				}

				if ( ! customDimensions ) {
					return false;
				}

				return select(
					MODULES_ANALYTICS_4
				).areCustomDimensionsGatheringData( customDimensions );
			} );

			const commonErrorProps = {
				headerText: tileTitle,
				infoTooltip: tileInfoTooltip,
			};

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
							'Additional permissions are required to create new Analytics custom dimensions.',
							'google-site-kit'
						),
						data: {
							status: 403,
							scopes: [ ANALYTICS_EDIT_SCOPE ],
							skipModal: true,
						},
					} );
				}
			}, [
				hasAnalyticsEditScope,
				loading,
				setPermissionScopeError,
				setValues,
			] );

			// If the list of available custom dimensions is outdated, sync it.
			useEffect( () => {
				if (
					! customDimensions ||
					! isInvalidCustomDimensionError( reportError ) ||
					isSyncingAvailableCustomDimensions
				) {
					return;
				}

				// Clear report error so that the fetch sync action isn't
				// triggered multiple times.
				clearError( 'getReport', [ reportOptions ] );

				// Sync available custom dimensions.
				fetchSyncAvailableCustomDimensions().then( () => {
					// Invalidate report request so that it is re-fetched.
					invalidateResolution( 'getReport', [ reportOptions ] );
				} );
			}, [
				clearError,
				customDimensions,
				fetchSyncAvailableCustomDimensions,
				invalidateResolution,
				isSyncingAvailableCustomDimensions,
				reportError,
				reportOptions,
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
						loading
						moduleSlug="analytics-4"
						title={ tileTitle }
						Widget={ Widget }
					/>
				);
			}

			const insufficientPermissionsError =
				customDimensionsCreationErrors?.find(
					isInsufficientPermissionsError
				);

			if ( insufficientPermissionsError ) {
				// Handle permissions error encountered while creating
				// custom dimensions.
				return (
					<InsufficientPermissionsError
						{ ...commonErrorProps }
						error={ insufficientPermissionsError }
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
		};

		WithCustomDimensionsComponent.displayName = 'WithCustomDimensions';

		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WithCustomDimensionsComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}

		return WithCustomDimensionsComponent;
	};
}
