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
import { useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../../hooks/useBreakpoint';
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
import PartialDataBadge from './PartialDataBadge';
import PartialDataNotice from './PartialDataNotice';
import { numFmt } from '../../../../../../../util';
import AudienceTileCollectingData from './AudienceTileCollectingData';
import AudienceTileCollectingDataHideable from './AudienceTileCollectingDataHideable';

// TODO: as part of #8484 the report props should be updated to expect
// the full report rows for the current tile to reduce data manipulation
// in AudienceTiles.
export default function AudienceTile( {
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
	Widget,
	audienceResourceName,
	isZeroData,
	isPartialData,
	isTileHideable,
	onHideTile,
} ) {
	const breakpoint = useBreakpoint();

	const isPropertyPartialData = useSelect( ( select ) => {
		const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

		return (
			propertyID &&
			select( MODULES_ANALYTICS_4 ).isPropertyPartialData( propertyID )
		);
	} );
	const isAudiencePartialData = useSelect(
		( select ) =>
			! isPropertyPartialData &&
			audienceResourceName &&
			select( MODULES_ANALYTICS_4 ).isAudiencePartialData(
				audienceResourceName
			)
	);
	const isTopContentPartialData = useSelect(
		( select ) =>
			! isAudiencePartialData &&
			select( MODULES_ANALYTICS_4 ).isCustomDimensionPartialData(
				'googlesitekit_post_type'
			)
	);

	const isMobileBreakpoint = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);

	if ( isPartialData && isZeroData ) {
		return (
			<Widget
				className="googlesitekit-audience-segmentation-tile-widget"
				noPadding
			>
				<div className="googlesitekit-audience-segmentation-tile">
					<div className="googlesitekit-audience-segmentation-tile__zero-data-container">
						{ ! isMobileBreakpoint && (
							<div className="googlesitekit-audience-segmentation-tile__header">
								<div className="googlesitekit-audience-segmentation-tile__header-title">
									{ title }
									{ infoTooltip && (
										<InfoTooltip
											title={ infoTooltip }
											tooltipClassName="googlesitekit-info-tooltip__content--audience"
										/>
									) }
								</div>
							</div>
						) }
						<div className="googlesitekit-audience-segmentation-tile__zero-data-content">
							<AudienceTileCollectingData />
							{ isTileHideable && (
								<AudienceTileCollectingDataHideable
									onHideTile={ onHideTile }
								/>
							) }
						</div>
					</div>
				</div>
			</Widget>
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
								/>
							) }
						</div>
						{ isAudiencePartialData && (
							<PartialDataBadge
								tooltipTitle={ __(
									'Still collecting full data for this timeframe, partial data is displayed for this group',
									'google-site-kit'
								) }
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

					<AudienceTilePagesMetric
						TileIcon={ AudienceMetricIconTopContent }
						title={ __(
							'Top content by pageviews',
							'google-site-kit'
						) }
						topContentTitles={ topContentTitles }
						topContent={ topContent }
						isTopContentPartialData={ isTopContentPartialData }
					/>
				</div>
			</div>
		</Widget>
	);
}

AudienceTile.propTypes = {
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
	Widget: PropTypes.elementType.isRequired,
	audienceResourceName: PropTypes.string.isRequired,
	isZeroData: PropTypes.bool,
	isPartialData: PropTypes.bool,
	isTileHideable: PropTypes.bool,
	onHideTile: PropTypes.func,
};
