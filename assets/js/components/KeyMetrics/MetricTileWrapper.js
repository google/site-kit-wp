/**
 * MetricTileWrapper component.
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
import classnames from 'classnames';
import { castArray } from 'lodash';
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
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE } from '../../modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';
import { Button } from 'googlesitekit-components';
import GetHelpLink from './GetHelpLink';
import Link from '../Link';
import MetricTileLoader from './MetricTileLoader';
import MetricTileError from './MetricTileError';
import MetricTileHeader from './MetricTileHeader';
import ReportErrorActions from '../ReportErrorActions';
import {
	ERROR_REASON_BAD_REQUEST,
	isInsufficientPermissionsError,
} from '../../util/errors';
import { useFeature } from '../../hooks/useFeature';
const { useSelect, useDispatch } = Data;

export default function MetricTileWrapper( {
	className,
	children,
	error: reportError,
	title,
	infoTooltip,
	loading: isReportLoading,
	moduleSlug,
	Widget,
	widgetSlug,
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

		return select( CORE_USER ).hasScope( EDIT_SCOPE );
	} );
	const isSyncingAvailableCustomDimensions = useSelect( ( select ) => {
		if ( ! customDimensions ) {
			return false;
		}

		return select(
			MODULES_ANALYTICS_4
		).isSyncingAvailableCustomDimensions();
	} );

	const { createCustomDimensions, syncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );

	const loading =
		isReportLoading ||
		isCreatingCustomDimensions ||
		isSyncingAvailableCustomDimensions;
	const hasError = !! reportError || !! customDimensionsCreationErrors.length;

	const tileTitle = title || KEY_METRICS_WIDGETS[ widgetSlug ]?.title;
	const tileInfoTooltip =
		infoTooltip ||
		KEY_METRICS_WIDGETS[ widgetSlug ]?.infoTooltip ||
		KEY_METRICS_WIDGETS[ widgetSlug ]?.description;

	const commonErrorProps = {
		headerText: tileTitle,
		infoTooltip: tileInfoTooltip,
	};

	const handleCreateCustomDimensions = useCallback( async () => {
		if ( loading ) {
			return;
		}

		if ( hasAnalyticsEditScope ) {
			await createCustomDimensions();
		}

		// TODO: Handle case where user does not have edit scope (from #7599).
	}, [ createCustomDimensions, hasAnalyticsEditScope, loading ] );

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
										'Permissions updated? <RetryLink />',
										'google-site-kit'
									),
									{
										RetryLink: (
											<Link
												onClick={
													handleCreateCustomDimensions
												}
											>
												{ __(
													'Retry',
													'google-site-kit'
												) }
											</Link>
										),
									}
								) }
							</span>
							<span className="googlesitekit-error-retry-text">
								{ createInterpolateElement(
									__(
										'You’ll need to contact your administrator. <LearnMoreLink />',
										'google-site-kit'
									),
									{
										LearnMoreLink: (
											<Link href={ helpLink } external>
												{ __(
													'Learn more',
													'google-site-kit'
												) }
											</Link>
										),
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
									'Retry didn’t work? <GetHelpLink />',
									'google-site-kit'
								),
								{
									GetHelpLink: (
										<Link href={ helpLink } external>
											{ __(
												'Learn more',
												'google-site-kit'
											) }
										</Link>
									),
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

	if ( reportError ) {
		const hasInsufficientPermissionsReportError = castArray(
			reportError
		).some( isInsufficientPermissionsError );

		return (
			<MetricTileError
				title={
					hasInsufficientPermissionsReportError
						? __( 'Insufficient permissions', 'google-site-kit' )
						: __( 'Data loading failed', 'google-site-kit' )
				}
				{ ...commonErrorProps }
			>
				<ReportErrorActions
					moduleSlug={ moduleSlug }
					error={ reportError }
					GetHelpLink={
						hasInsufficientPermissionsReportError
							? GetHelpLink
							: undefined
					}
				/>
			</MetricTileError>
		);
	}

	return (
		<Widget noPadding>
			<div
				className={ classnames(
					'googlesitekit-km-widget-tile',
					className
				) }
			>
				<MetricTileHeader
					title={ tileTitle }
					infoTooltip={ tileInfoTooltip }
				/>
				<div className="googlesitekit-km-widget-tile__body">
					{ loading && <MetricTileLoader /> }
					{ ! loading && ! hasError && children }
				</div>
			</div>
		</Widget>
	);
}

MetricTileWrapper.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	loading: PropTypes.bool,
	title: PropTypes.string,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	moduleSlug: PropTypes.string.isRequired,
};
