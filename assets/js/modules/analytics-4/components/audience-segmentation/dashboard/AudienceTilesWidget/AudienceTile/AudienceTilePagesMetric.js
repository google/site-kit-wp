/**
 * AudienceTilePagesMetric component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../../hooks/useBreakpoint';
import { CORE_FORMS } from '../../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import {
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	CUSTOM_DIMENSION_DEFINITIONS,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../../datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../../../util/errors';
import BadgeWithTooltip from '../../../../../../../components/BadgeWithTooltip';
import AudienceTilePagesMetricContent from './AudienceTilePagesMetricContent';
import AudienceErrorModal from '../../AudienceErrorModal';
import { AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION } from '../../../../../../../googlesitekit/widgets/default-areas';
import useViewContext from '../../../../../../../hooks/useViewContext';

export default function AudienceTilePagesMetric( {
	// TODO: The prop `audienceTileNumber` is part of a temporary workaround to ensure `AudienceErrorModal` is only rendered once
	// within `AudienceTilesWidget`. This should be removed once the `AudienceErrorModal` render is extracted
	// from `AudienceTilePagesMetric` and it's rendered once at a higher level instead. See https://github.com/google/site-kit-wp/issues/9543.
	audienceTileNumber,
	TileIcon,
	title,
	topContent,
	topContentTitles,
	isTopContentPartialData,
} ) {
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();

	const postTypeDimension =
		CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type.parameterName;

	const hasMissingCustomDimension = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				postTypeDimension
			)
	);

	const hasAnalyticsEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'audience_segmentation',
		widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	} );
	const errorRedirectURL = addQueryArgs( global.location.href, {
		widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	} );

	const isAutoCreatingCustomDimensionsForAudience = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
			'isAutoCreatingCustomDimensionsForAudience'
		)
	);

	const isCreatingCustomDimension = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension(
			postTypeDimension
		)
	);

	const isSyncingAvailableCustomDimensions = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isFetchingSyncAvailableCustomDimensions()
	);

	const customDimensionError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
			postTypeDimension
		)
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const { clearError } = useDispatch( MODULES_ANALYTICS_4 );
	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError, clearPermissionScopeError } =
		useDispatch( CORE_USER );

	const isRetryingCustomDimensionCreate = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
			'isRetrying'
		)
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
			'autoSubmit'
		)
	);

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);
	const { setSetupErrorCode } = useDispatch( CORE_SITE );

	const hasOAuthError = autoSubmit && setupErrorCode === 'access_denied';

	const onCreateCustomDimension = useCallback(
		( { isRetrying } = {} ) => {
			setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
				autoSubmit: true,
				isRetrying,
			} );

			if ( ! hasAnalyticsEditScope ) {
				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to create new audiences in Analytics.',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes: [ EDIT_SCOPE ],
						skipModal: true,
						skipDefaultErrorNotifications: true,
						redirectURL,
						errorRedirectURL,
					},
				} );
			}
		},
		[
			hasAnalyticsEditScope,
			redirectURL,
			errorRedirectURL,
			setPermissionScopeError,
			setValues,
		]
	);

	const onCancel = useCallback( () => {
		setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
			autoSubmit: false,
			isRetrying: false,
		} );
		setSetupErrorCode( null );
		clearPermissionScopeError();
		clearError( 'createCustomDimension', [
			propertyID,
			CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
		] );
	}, [
		clearError,
		clearPermissionScopeError,
		propertyID,
		setSetupErrorCode,
		setValues,
	] );

	const isMobileBreakpoint = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);

	const isSaving =
		isAutoCreatingCustomDimensionsForAudience ||
		isCreatingCustomDimension ||
		isSyncingAvailableCustomDimensions;

	return (
		<div className="googlesitekit-audience-segmentation-tile-metric googlesitekit-audience-segmentation-tile-metric--top-content">
			<div className="googlesitekit-audience-segmentation-tile-metric__icon">
				<TileIcon />
			</div>
			<div className="googlesitekit-audience-segmentation-tile-metric__container">
				<div className="googlesitekit-audience-segmentation-tile-metric__title">
					{ title }
					{ ! isMobileBreakpoint && isTopContentPartialData && (
						<BadgeWithTooltip
							className="googlesitekit-audience-segmentation-partial-data-badge"
							label={ __( 'Partial data', 'google-site-kit' ) }
							tooltipTitle={ __(
								'Still collecting full data for this timeframe, partial data is displayed for this metric',
								'google-site-kit'
							) }
						/>
					) }
				</div>
				<AudienceTilePagesMetricContent
					topContentTitles={ topContentTitles }
					topContent={ topContent }
					isTopContentPartialData={ isTopContentPartialData }
					hasCustomDimension={ ! hasMissingCustomDimension }
					onCreateCustomDimension={ onCreateCustomDimension }
					isSaving={ isSaving }
				/>
				{ /*
						TODO: The `audienceTileNumber` check is part of a temporary workaround to ensure `AudienceErrorModal` is only rendered once
						within `AudienceTilesWidget`. This should be removed, and the `AudienceErrorModal` render extracted
						from here to be rendered once at a higher level instead. See https://github.com/google/site-kit-wp/issues/9543.
					*/ }
				{ audienceTileNumber === 0 &&
					( ( customDimensionError && ! isSaving ) ||
						( isRetryingCustomDimensionCreate &&
							! isAutoCreatingCustomDimensionsForAudience ) ||
						hasOAuthError ) && (
						<AudienceErrorModal
							apiErrors={ [ customDimensionError ] }
							title={ __(
								'Failed to enable metric',
								'google-site-kit'
							) }
							description={ __(
								'Oops! Something went wrong. Retry enabling the metric.',
								'google-site-kit'
							) }
							onRetry={ () =>
								onCreateCustomDimension( { isRetrying: true } )
							}
							onCancel={ onCancel }
							inProgress={ isSaving }
							hasOAuthError={ hasOAuthError }
							trackEventCategory={ `${ viewContext }_audiences-top-content-cta` }
						/>
					) }
			</div>
		</div>
	);
}

AudienceTilePagesMetric.propTypes = {
	audienceTileNumber: PropTypes.number,
	TileIcon: PropTypes.elementType.isRequired,
	title: PropTypes.string.isRequired,
	topContent: PropTypes.object,
	topContentTitles: PropTypes.object,
	isTopContentPartialData: PropTypes.bool,
};
