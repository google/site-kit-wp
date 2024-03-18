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
import InfoTooltip from '../../../../../components/InfoTooltip';
import { numFmt } from '../../../../../util';
import ChangeBadge from '../../../../../components/ChangeBadge';

/**
 * Internal dependencies
 */
import AudienceMetricIconVisitors from '../../../../../../svg/icons/audience-metric-icon-visitors.svg';
import AudienceMetricIconVisitsPerVisitor from '../../../../../../svg/icons/audience-metric-icon-visits-per-visitor.svg';
import AudienceMetricIconPagesPerVisit from '../../../../../../svg/icons/audience-metric-icon-pages-per-visit.svg';
import AudienceMetricIconPageviews from '../../../../../../svg/icons/audience-metric-icon-pageviews.svg';
import AudienceMetricIconCities from '../../../../../../svg/icons/audience-metric-icon-cities.svg';
import AudienceMetricIconTopContent from '../../../../../../svg/icons/audience-metric-icon-top-content.svg';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Link from '../../../../../components/Link';
import useViewOnly from '../../../../../hooks/useViewOnly';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';

export default function AudienceTile( {
	title,
	infoTooltip,
	visitors,
	visitsPerVisitors,
	pagesPerVisit,
	pageviews,
	topCities,
	topContent,
	topContentTitles,
	Widget,
} ) {
	const breakpoint = useBreakpoint();
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	function AudienceTileMetric( { TileIcon, tileTitle, metricValue, Badge } ) {
		return (
			<div className="googlesitekit-audience-segmentation-tile__metric">
				<div className="googlesitekit-audience-segmentation-tile__metric-icon">
					<TileIcon />
				</div>
				<div className="googlesitekit-audience-segmentation-tile__metric-container">
					<div className="googlesitekit-audience-segmentation-tile__metric-value">
						{ numFmt( metricValue ) }
					</div>
					<div className="googlesitekit-audience-segmentation-tile__metric-title">
						{ tileTitle }
					</div>
				</div>
				<div className="googlesitekit-audience-segmentation-tile__metric-badge-container">
					<Badge />
				</div>
			</div>
		);
	}

	function AudienceTileCitiesMetric( {
		TileIcon,
		tileTitle,
		topCities: topCitiesColumns,
	} ) {
		return (
			<div className="googlesitekit-audience-segmentation-tile__metric googlesitekit-audience-segmentation-tile__cities-metric">
				<div className="googlesitekit-audience-segmentation-tile__metric-icon">
					<TileIcon />
				</div>
				<div className="googlesitekit-audience-segmentation-tile__metric-container">
					<div className="googlesitekit-audience-segmentation-tile__metric-title">
						{ tileTitle }
					</div>
					<div className="googlesitekit-audience-segmentation-tile__metric-content">
						{ topCitiesColumns === null && <NoData /> }
						{ topCitiesColumns &&
							topCitiesColumns.dimensionValues.map(
								( city, index ) => (
									<div
										key={ city.value }
										className="googlesitekit-audience-segmentation-tile__cities-metric-city"
									>
										<div className="googlesitekit-audience-segmentation-tile__cities-metric-city-name">
											{ city.value }
										</div>
										<div className="googlesitekit-audience-segmentation-tile__cities-metric-city-value">
											{ numFmt(
												topCitiesColumns.metricValues[
													index
												].value,
												{
													style: 'percent',
													maximumFractionDigits: 1,
												}
											) }
										</div>
									</div>
								)
							) }
					</div>
				</div>
			</div>
		);
	}

	function ContentLinkComponent( { content } ) {
		const contentTitle = topContentTitles[ content.value ];
		const url = content.value;

		const serviceURL = useSelect( ( select ) => {
			return ! viewOnlyDashboard
				? select( MODULES_ANALYTICS_4 ).getServiceReportURL(
						'all-pages-and-screens',
						{
							filters: {
								unifiedPagePathScreen: url,
							},
							dates,
						}
				  )
				: null;
		} );

		if ( viewOnlyDashboard ) {
			return (
				<div className="googlesitekit-audience-segmentation-tile__top-content-metric-name">
					{ contentTitle }
				</div>
			);
		}
		return (
			<Link
				href={ serviceURL }
				title={ title }
				external
				hideExternalIndicator
			>
				{ contentTitle }
			</Link>
		);
	}

	function AudienceTilePagesMetric( {
		TileIcon,
		tileTitle,
		topContent: topContentRows,
	} ) {
		return (
			<div className="googlesitekit-audience-segmentation-tile__metric googlesitekit-audience-segmentation-tile__top-content-metric">
				<div className="googlesitekit-audience-segmentation-tile__metric-icon">
					<TileIcon />
				</div>
				<div className="googlesitekit-audience-segmentation-tile__metric-container">
					<div className="googlesitekit-audience-segmentation-tile__metric-title">
						{ tileTitle }
					</div>
					<div className="googlesitekit-audience-segmentation-tile__metric-content">
						{ topContentRows === null && <NoData /> }
						{ topContentRows &&
							topContentRows.dimensionValues.map(
								( content, index ) => {
									return (
										<div
											key={ content.value }
											className="googlesitekit-audience-segmentation-tile__top-content-metric-page"
										>
											<ContentLinkComponent
												content={ content }
											/>
											<div className="googlesitekit-audience-segmentation-tile__top-content-metric-value">
												{ numFmt(
													topContent.metricValues[
														index
													].value
												) }
											</div>
										</div>
									);
								}
							) }
					</div>
				</div>
			</div>
		);
	}

	function NoData() {
		return (
			<div className="googlesitekit-audience-segmentation-tile__no-data">
				{ __( 'No data to show yet', 'google-site-kit' ) }
			</div>
		);
	}

	return (
		<Widget noPadding>
			<div className="googlesitekit-audience-segmentation-tile">
				{ breakpoint !== BREAKPOINT_TABLET &&
					breakpoint !== BREAKPOINT_SMALL && (
						<div className="googlesitekit-audience-segmentation-tile-header">
							<div className="googlesitekit-audience-segmentation-tile-header__title">
								{ title }
								{ infoTooltip && (
									<InfoTooltip title={ infoTooltip } />
								) }
							</div>
						</div>
					) }
				<div className="googlesitekit-audience-segmentation-tile__metrics">
					<AudienceTileMetric
						TileIcon={ AudienceMetricIconVisitors }
						tileTitle={ __( 'Visitors', 'google-site-kit' ) }
						metricValue={ visitors.metricValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ visitors.previousValue }
								currentValue={ visitors.currentValue }
							/>
						) }
					/>

					<AudienceTileMetric
						TileIcon={ AudienceMetricIconVisitsPerVisitor }
						tileTitle={ __(
							'Visits per visitor',
							'google-site-kit'
						) }
						metricValue={ visitsPerVisitors.metricValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={
									visitsPerVisitors.previousValue
								}
								currentValue={ visitsPerVisitors.currentValue }
							/>
						) }
					/>

					<AudienceTileMetric
						TileIcon={ AudienceMetricIconPagesPerVisit }
						tileTitle={ __( 'Pages per visit', 'google-site-kit' ) }
						metricValue={ pagesPerVisit.metricValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ pagesPerVisit.previousValue }
								currentValue={ pagesPerVisit.currentValue }
							/>
						) }
					/>

					<AudienceTileMetric
						TileIcon={ AudienceMetricIconPageviews }
						tileTitle={ __(
							'33% of total pageviews', // TODO: This title needs to take the dynamic % of total page views.
							'google-site-kit'
						) }
						metricValue={ pageviews.metricValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ pageviews.previousValue }
								currentValue={ pageviews.currentValue }
							/>
						) }
					/>

					<AudienceTileCitiesMetric
						TileIcon={ AudienceMetricIconCities }
						tileTitle={ __(
							'Cities with the most visitors',
							'google-site-kit'
						) }
						topCities={ topCities }
					/>

					<AudienceTilePagesMetric
						TileIcon={ AudienceMetricIconTopContent }
						tileTitle={ __( 'Top content', 'google-site-kit' ) }
						topContent={ topContent }
					/>
				</div>
			</div>
		</Widget>
	);
}

AudienceTile.propTypes = {
	title: PropTypes.string.isRequired,
	infoTooltip: PropTypes.string,
	visitors: PropTypes.object,
	visitsPerVisitors: PropTypes.object,
	pagesPerVisit: PropTypes.object,
	pageviews: PropTypes.object,
	topCities: PropTypes.object,
	topContent: PropTypes.object,
	topContentTitles: PropTypes.object,
	Widget: PropTypes.elementType.isRequired,
};
