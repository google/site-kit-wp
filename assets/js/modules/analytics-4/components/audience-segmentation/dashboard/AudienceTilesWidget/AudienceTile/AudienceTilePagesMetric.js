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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	CUSTOM_DIMENSION_DEFINITIONS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import BadgeWithTooltip from '@/js/components/BadgeWithTooltip';
import AudienceTilePagesMetricContent from './AudienceTilePagesMetricContent';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import useFormValue from '@/js/hooks/useFormValue';
import useCreateCustomDimension from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/hooks/useCreateCustomDimension';

export default function AudienceTilePagesMetric( {
	audienceSlug,
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

	const customDimensionError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
			postTypeDimension
		)
	);

	const isRetryingCustomDimensionCreate = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'isRetrying'
	);

	const autoSubmit = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'autoSubmit'
	);

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const hasOAuthError = autoSubmit && setupErrorCode === 'access_denied';

	const isMobileBreakpoint = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);

	const { onCreateCustomDimension, isSaving, setShowErrorModal } =
		useCreateCustomDimension();

	const shouldShowErrorModal =
		( customDimensionError && ! isSaving ) ||
		// I've deliberately removed the check for `! isAutoCreatingCustomDimensionsForAudience` to fix a bug where the error modal would disappear while retrying.
		isRetryingCustomDimensionCreate ||
		hasOAuthError;

	useEffect( () => {
		setShowErrorModal( shouldShowErrorModal );
	}, [ shouldShowErrorModal, setShowErrorModal ] );

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
							onTooltipOpen={ () => {
								trackEvent(
									`${ viewContext }_audiences-tile`,
									'view_top_content_partial_data_tooltip',
									audienceSlug
								);
							} }
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
			</div>
		</div>
	);
}

AudienceTilePagesMetric.propTypes = {
	audienceSlug: PropTypes.string.isRequired,
	TileIcon: PropTypes.elementType.isRequired,
	title: PropTypes.string.isRequired,
	topContent: PropTypes.object,
	topContentTitles: PropTypes.object,
	isTopContentPartialData: PropTypes.bool,
};
