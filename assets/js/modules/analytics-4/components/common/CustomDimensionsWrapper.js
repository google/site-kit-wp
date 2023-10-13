/**
 * CustomDimensionsWrapper component.
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
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE as ANALYTICS_EDIT_SCOPE } from '../../../analytics/datastore/constants';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { Button } from 'googlesitekit-components';
import Link from '../../../../components/Link';
import MetricTileError from '../../../../components/KeyMetrics/MetricTileError';
import MetricTileLoading from '../../../../components/KeyMetrics/MetricTileLoading';
import {
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	ERROR_REASON_BAD_REQUEST,
	isInsufficientPermissionsError,
} from '../../../../util/errors';
import { useFeature } from '../../../../hooks/useFeature';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
const { useSelect, useDispatch } = Data;

export default function CustomDimensionsWrapper( {
	children,
	reportError,
	widgetSlug,
	title = KEY_METRICS_WIDGETS[ widgetSlug ]?.title,
	infoTooltip = KEY_METRICS_WIDGETS[ widgetSlug ]?.infoTooltip ||
		KEY_METRICS_WIDGETS[ widgetSlug ]?.description,
} ) {
	const newsKeyMetricsEnabled = useFeature( 'newsKeyMetrics' );

	const customDimensions = useMemo( () => {
		if ( ! widgetSlug || ! newsKeyMetricsEnabled ) {
			return null;
		}

		const { requiredCustomDimensions } = KEY_METRICS_WIDGETS[ widgetSlug ];

		if (
			! Array.isArray( requiredCustomDimensions ) ||
			! requiredCustomDimensions.length
		) {
			return null;
		}

		return requiredCustomDimensions;
	}, [ newsKeyMetricsEnabled, widgetSlug ] );

	const hasCustomDimensions = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return true;
		}

		return select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
			customDimensions
		);
	} );
	const isCreatingCustomDimensions = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return false;
		}

		return customDimensions.some( ( dimension ) =>
			select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension( dimension )
		);
	} );
	const customDimensionsCreationErrors = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return [];
		}

		return customDimensions
			.filter(
				( dimension ) =>
					!! select(
						MODULES_ANALYTICS_4
					).getCreateCustomDimensionError( dimension )
			)
			.map( ( dimension ) =>
				select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
					dimension
				)
			);
	} );
	const helpLink = useSelect( ( select ) => {
		if ( ! customDimensionsCreationErrors.length ) {
			return undefined;
		}

		return select( CORE_SITE ).getErrorTroubleshootingLinkURL(
			customDimensionsCreationErrors.find(
				isInsufficientPermissionsError
			) || customDimensionsCreationErrors[ 0 ]
		);
	} );
	const hasAnalyticsEditScope = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return undefined;
		}

		return select( CORE_USER ).hasScope( ANALYTICS_EDIT_SCOPE );
	} );
	const isSyncingAvailableCustomDimensions = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return false;
		}

		return select(
			MODULES_ANALYTICS_4
		).isSyncingAvailableCustomDimensions();
	} );
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

	const { syncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );
	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );

	const loading =
		isCreatingCustomDimensions ||
		isSyncingAvailableCustomDimensions ||
		isNavigatingToOAuthURL;

	const commonErrorProps = {
		headerText: title,
		infoTooltip,
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
	}, [ hasAnalyticsEditScope, loading, setPermissionScopeError, setValues ] );

	// If the list of available custom dimensions is outdated, sync it.
	useEffect( () => {
		if (
			! customDimensions ||
			reportError?.data?.reason !== ERROR_REASON_BAD_REQUEST ||
			isSyncingAvailableCustomDimensions
		) {
			return;
		}

		syncAvailableCustomDimensions();
	}, [
		customDimensions,
		isSyncingAvailableCustomDimensions,
		reportError?.data?.reason,
		syncAvailableCustomDimensions,
	] );

	if ( newsKeyMetricsEnabled && !! customDimensions && ! loading ) {
		if ( !! customDimensionsCreationErrors.length ) {
			// Handle permissions error encountered while creating
			// custom dimensions.
			if (
				customDimensionsCreationErrors.some(
					isInsufficientPermissionsError
				)
			) {
				return (
					<MetricTileError
						title={ __(
							'Insufficient permissions',
							'google-site-kit'
						) }
						{ ...commonErrorProps }
					>
						<div className="googlesitekit-report-error-actions">
							<span className="googlesitekit-error-retry-text">
								{ createInterpolateElement(
									__(
										'Permissions updated? <a>Retry</a>',
										'google-site-kit'
									),
									{
										a: (
											<Link
												onClick={
													handleCreateCustomDimensions
												}
											/>
										),
									}
								) }
							</span>
							<span className="googlesitekit-error-retry-text">
								{ createInterpolateElement(
									__(
										'You’ll need to contact your administrator. <a>Learn more</a>',
										'google-site-kit'
									),
									{
										a: <Link href={ helpLink } external />,
									}
								) }
							</span>
						</div>
					</MetricTileError>
				);
			}

			// Handle generic errors encountered while creating
			// custom dimensions.
			return (
				<MetricTileError
					title={ __( 'Analytics update failed', 'google-site-kit' ) }
					{ ...commonErrorProps }
				>
					<div className="googlesitekit-report-error-actions">
						<Button onClick={ handleCreateCustomDimensions }>
							{ __( 'Retry', 'google-site-kit' ) }
						</Button>
						<span className="googlesitekit-error-retry-text">
							{ createInterpolateElement(
								__(
									'Retry didn’t work? <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: <Link href={ helpLink } external />,
								}
							) }
						</span>
					</div>
				</MetricTileError>
			);
		}

		if ( ! hasCustomDimensions ) {
			return (
				<MetricTileError
					title={ __( 'No data to show', 'google-site-kit' ) }
					{ ...commonErrorProps }
				>
					<div className="googlesitekit-report-error-actions">
						<Button onClick={ handleCreateCustomDimensions }>
							{ __( 'Update', 'google-site-kit' ) }
						</Button>
						<span className="googlesitekit-error-retry-text">
							{ __(
								'Update Analytics to track metric',
								'google-site-kit'
							) }
						</span>
					</div>
				</MetricTileError>
			);
		}
	}

	if ( newsKeyMetricsEnabled && !! customDimensions && loading ) {
		const { Widget } = getWidgetComponentProps( widgetSlug );

		return (
			<Widget noPadding>
				<MetricTileLoading
					title={ title }
					infoTooltip={ infoTooltip }
				/>
			</Widget>
		);
	}

	return children;
}

CustomDimensionsWrapper.propTypes = {
	title: PropTypes.string,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	widgetSlug: PropTypes.string.isRequired,
};
