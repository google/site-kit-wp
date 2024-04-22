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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import InfoTooltip from '../../../../../../components/InfoTooltip';
import ChangeBadge from '../../../../../../components/ChangeBadge';
import AudienceMetricIconVisitors from '../../../../../../../svg/icons/audience-metric-icon-visitors.svg';
import AudienceMetricIconVisitsPerVisitor from '../../../../../../../svg/icons/audience-metric-icon-visits-per-visitor.svg';
import AudienceMetricIconPagesPerVisit from '../../../../../../../svg/icons/audience-metric-icon-pages-per-visit.svg';
import AudienceMetricIconPageviews from '../../../../../../../svg/icons/audience-metric-icon-pageviews.svg';
import AudienceMetricIconCities from '../../../../../../../svg/icons/audience-metric-icon-cities.svg';
import AudienceMetricIconTopContent from '../../../../../../../svg/icons/audience-metric-icon-top-content.svg';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../hooks/useBreakpoint';
import AudienceTileMetric from './AudienceTileMetric';
import AudienceTileCitiesMetric from './AudienceTileCitiesMetric';
import AudienceTilePagesMetric from './AudienceTilePagesMetric';
import { numFmt } from '../../../../../../util';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

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
} ) {
	const breakpoint = useBreakpoint();

	return (
		<Widget noPadding>
			<div className="googlesitekit-audience-segmentation-tile">
				{ breakpoint !== BREAKPOINT_TABLET &&
					breakpoint !== BREAKPOINT_SMALL && (
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
				<div className="googlesitekit-audience-segmentation-tile__metrics">
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
};
