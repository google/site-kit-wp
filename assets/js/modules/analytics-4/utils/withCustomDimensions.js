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

/* eslint complexity: [ "error", 18 ] */

/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
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
import { isInvalidCustomDimensionError } from './custom-dimensions';
import useViewOnly from '../../../hooks/useViewOnly';
import {
	AnalyticsUpdateError,
	CustomDimensionsMissingError,
} from '../components/key-metrics';

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
					select( CORE_USER ).hasScope( EDIT_SCOPE )
			);
			const isSyncingAvailableCustomDimensions = useSelect(
				( select ) =>
					!! customDimensions &&
					select(
						MODULES_ANALYTICS_4
					).isSyncingAvailableCustomDimensions()
			);
			// The `custom_dimensions` query value is arbitrary and serves two purposes:
			// 1. To ensure that `authentication_success` isn't appended when returning from OAuth.
			// 2. To guarantee it doesn't match any existing notifications in the `BannerNotifications` component, thus preventing any unintended displays.
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

				return select( MODULES_ANALYTICS_4 ).getErrorForSelector(
					'getReport',
					[ reportOptions ]
				);
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
			const dataAvailabilityReportErrors = useSelect( ( select ) => {
				if ( ! customDimensions ) {
					return {};
				}

				return select(
					MODULES_ANALYTICS_4
				).getDataAvailabilityReportErrors( customDimensions );
			} );

			const hasInvalidCustomDimensionError =
				( isGatheringData &&
					Object.values( dataAvailabilityReportErrors ).some(
						( error ) => isInvalidCustomDimensionError( error )
					) ) ||
				( ! isGatheringData &&
					isInvalidCustomDimensionError( reportError ) );

			const invalidCustomDimensionReportOptions = useSelect(
				( select ) => {
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
				}
			);

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
						loading
						moduleSlug="analytics-4"
						title={ tileTitle }
						Widget={ Widget }
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
