/**
 * AudienceTile component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../../hooks/useBreakpoint';
import useViewOnly from '../../../../../../../hooks/useViewOnly';
import { MODULES_ANALYTICS_4 } from '../../../../../datastore/constants';
import AudienceMetricIconVisitors from '../../../../../../../../svg/icons/audience-metric-icon-visitors.svg';
import AudienceMetricIconVisitsPerVisitor from '../../../../../../../../svg/icons/audience-metric-icon-visits-per-visitor.svg';
import AudienceMetricIconPagesPerVisit from '../../../../../../../../svg/icons/audience-metric-icon-pages-per-visit.svg';
import AudienceMetricIconPageviews from '../../../../../../../../svg/icons/audience-metric-icon-pageviews.svg';
import AudienceMetricIconCities from '../../../../../../../../svg/icons/audience-metric-icon-cities.svg';
import AudienceMetricIconTopContent from '../../../../../../../../svg/icons/audience-metric-icon-top-content.svg';
import AudienceTileMetric from './AudienceTileMetric';
import AudienceTileCitiesMetric from './AudienceTileCitiesMetric';
import AudienceTilePagesMetric from './AudienceTilePagesMetric';
import ChangeBadge from '../../../../../../../components/ChangeBadge';
import InfoTooltip from '../../../../../../../components/InfoTooltip';
import PartialDataNotice from './PartialDataNotice';
import { numFmt, trackEvent } from '../../../../../../../util';
import BadgeWithTooltip from '../../../../../../../components/BadgeWithTooltip';
import useViewContext from '../../../../../../../hooks/useViewContext';
import AudienceTileZeroData from './AudienceTileZeroData';

// TODO: as part of #8484 the report props should be updated to expect
// the full report rows for the current tile to reduce data manipulation
// in AudienceTiles.
export default function AudienceTile( {
	// TODO: The prop `audienceTileNumber` is part of a temporary workaround to ensure `AudienceErrorModal` is only rendered once
	// within `AudienceTilesWidget`. This should be removed once the `AudienceErrorModal` render is extracted
	// from `AudienceTilePagesMetric` and it's rendered once at a higher level instead. See https://github.com/google/site-kit-wp/issues/9543.
	audienceTileNumber = 0,
	audienceSlug,
	title,
	infoTooltip,
	visitors,
	visitsPerVisitor,
	pagesPerVisit,
	pageviews,
	percentageOfTotalPageViews,
	topCities,
	topContent,
	topContentTitles,
	hasInvalidCustomDimensionError,
	Widget,
	audienceResourceName,
	isZeroData,
	isPartialData,
	isTileHideable,
	onHideTile,
} ) {
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();
	const isViewOnly = useViewOnly();

	const isPropertyPartialData = useInViewSelect( ( select ) => {
		const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

		return (
			propertyID &&
			select( MODULES_ANALYTICS_4 ).isPropertyPartialData( propertyID )
		);
	} );
	const isSiteKitAudience = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSiteKitAudience( audienceResourceName )
	);
	const isAudiencePartialData = useInViewSelect(
		( select ) => {
			if ( isSiteKitAudience || isPropertyPartialData === undefined ) {
				return false;
			}

			return (
				! isPropertyPartialData &&
				audienceResourceName &&
				select( MODULES_ANALYTICS_4 ).isAudiencePartialData(
					audienceResourceName
				)
			);
		},
		[ isPropertyPartialData, isSiteKitAudience, audienceResourceName ]
	);
	const isTopContentPartialData = useInViewSelect(
		( select ) => {
			if ( isPropertyPartialData === undefined ) {
				return false;
			}

			return (
				! isPropertyPartialData &&
				! isAudiencePartialData &&
				select( MODULES_ANALYTICS_4 ).isCustomDimensionPartialData(
					'googlesitekit_post_type'
				)
			);
		},
		[ isAudiencePartialData ]
	);

	const postTypeDimensionExists = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				'googlesitekit_post_type'
			),
		[]
	);

	const isMobileBreakpoint = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);

	if ( isPartialData && isZeroData ) {
		return (
			<AudienceTileZeroData
				Widget={ Widget }
				audienceSlug={ audienceSlug }
				title={ title }
				infoTooltip={ infoTooltip }
				isMobileBreakpoint={ isMobileBreakpoint }
				isTileHideable={ isTileHideable }
				onHideTile={ onHideTile }
			/>
		);
	}

	return (
		<Widget noPadding>
			<div
				className={ classnames(
					'googlesitekit-audience-segmentation-tile',
					{
						'googlesitekit-audience-segmentation-tile--partial-data':
							isAudiencePartialData,
					}
				) }
			>
				{ ! isMobileBreakpoint && (
					<div className="googlesitekit-audience-segmentation-tile__header">
						<div className="googlesitekit-audience-segmentation-tile__header-title">
							{ title }
							{ infoTooltip && (
								<InfoTooltip
									title={ infoTooltip }
									tooltipClassName="googlesitekit-info-tooltip__content--audience"
									onOpen={ () =>
										trackEvent(
											`${ viewContext }_audiences-tile`,
											'view_tile_tooltip',
											audienceSlug
										)
									}
								/>
							) }
						</div>
						{ isAudiencePartialData && (
							<BadgeWithTooltip
								className="googlesitekit-audience-segmentation-partial-data-badge"
								label={ __(
									'Partial data',
									'google-site-kit'
								) }
								tooltipTitle={ __(
									'Still collecting full data for this timeframe, partial data is displayed for this group',
									'google-site-kit'
								) }
								onTooltipOpen={ () => {
									trackEvent(
										`${ viewContext }_audiences-tile`,
										'view_tile_partial_data_tooltip',
										audienceSlug
									);
								} }
							/>
						) }
					</div>
				) }
				<div className="googlesitekit-audience-segmentation-tile__metrics">
					{ isMobileBreakpoint && isAudiencePartialData && (
						<PartialDataNotice
							content={ __(
								'Still collecting full data for this timeframe, partial data is displayed for this group',
								'google-site-kit'
							) }
						/>
					) }
					<AudienceTileMetric
						TileIcon={ AudienceMetricIconVisitors }
						title={ __( 'Visitors', 'google-site-kit' ) }
						metricValue={ visitors.currentValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ visitors.previousValue }
								currentValue={ visitors.currentValue }
							/>
						) }
					/>

					<AudienceTileMetric
						TileIcon={ AudienceMetricIconVisitsPerVisitor }
						title={ __( 'Visits per visitor', 'google-site-kit' ) }
						metricValue={ visitsPerVisitor.currentValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ visitsPerVisitor.previousValue }
								currentValue={ visitsPerVisitor.currentValue }
							/>
						) }
					/>

					<AudienceTileMetric
						TileIcon={ AudienceMetricIconPagesPerVisit }
						title={ __( 'Pages per visit', 'google-site-kit' ) }
						metricValue={ pagesPerVisit.currentValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ pagesPerVisit.previousValue }
								currentValue={ pagesPerVisit.currentValue }
							/>
						) }
						metricValueFormat={ {
							style: 'decimal',
							maximumFractionDigits: 2,
						} }
					/>

					<AudienceTileMetric
						TileIcon={ AudienceMetricIconPageviews }
						title={ sprintf(
							/* translators: %s: is a percentage value such as 33.3%. */
							__( '%s of total pageviews', 'google-site-kit' ),
							numFmt( percentageOfTotalPageViews, {
								style: 'percent',
								maximumFractionDigits: 1,
							} )
						) }
						metricValue={ pageviews.currentValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ pageviews.previousValue }
								currentValue={ pageviews.currentValue }
							/>
						) }
					/>

					<AudienceTileCitiesMetric
						TileIcon={ AudienceMetricIconCities }
						title={ __(
							'Cities with the most visitors',
							'google-site-kit'
						) }
						topCities={ topCities }
					/>

					{ ( ! isViewOnly ||
						( postTypeDimensionExists &&
							! hasInvalidCustomDimensionError ) ) && (
						<AudienceTilePagesMetric
							audienceTileNumber={ audienceTileNumber }
							audienceSlug={ audienceSlug }
							TileIcon={ AudienceMetricIconTopContent }
							title={ __(
								'Top content by pageviews',
								'google-site-kit'
							) }
							topContentTitles={ topContentTitles }
							topContent={ topContent }
							isTopContentPartialData={ isTopContentPartialData }
						/>
					) }
				</div>
			</div>
		</Widget>
	);
}

AudienceTile.propTypes = {
	audienceTileNumber: PropTypes.number,
	audienceSlug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	visitors: PropTypes.object,
	visitsPerVisitor: PropTypes.object,
	pagesPerVisit: PropTypes.object,
	pageviews: PropTypes.object,
	percentageOfTotalPageViews: PropTypes.number,
	topCities: PropTypes.object,
	topContent: PropTypes.object,
	topContentTitles: PropTypes.object,
	hasInvalidCustomDimensionError: PropTypes.bool,
	Widget: PropTypes.elementType.isRequired,
	audienceResourceName: PropTypes.string.isRequired,
	isZeroData: PropTypes.bool,
	isPartialData: PropTypes.bool,
	isTileHideable: PropTypes.bool,
	onHideTile: PropTypes.func,
};
