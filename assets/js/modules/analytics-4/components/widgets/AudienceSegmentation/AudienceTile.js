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
import AudienceMetricIconTopContent from '../../../../../../svg/icons/web.svg';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
	function AudienceTileMetric( { TileIcon, tileTitle, metricValue, Badge } ) {
		return (
			<div className="googlesitekit-audience-segmentation-tile__metric">
				<div className="googlesitekit-audience-segmentation-tile__metric-icon">
					<TileIcon />
				</div>
				<div className="googlesitekit-audience-segmentation-tile__metric-container">
					<div className="googlesitekit-audience-segmentation-tile__metric">
						{ numFmt( metricValue ) }
					</div>
					<p className="googlesitekit-audience-segmentation-tile__metric-title">
						{ tileTitle }
					</p>
				</div>
				<div className="googlesitekit-audience-segmentation-tile__metric-badge-container">
					<Badge />
				</div>
			</div>
		);
	}

	function AudienceTileCustomMetric( {
		TileIcon,
		tileTitle,
		children,
		Badge = null,
	} ) {
		return (
			<div className="googlesitekit-audience-segmentation-tile__custom-metric">
				<div className="googlesitekit-audience-segmentation-tile__custom-metric-icon">
					<TileIcon />
				</div>
				<div className="googlesitekit-audience-segmentation-tile__custom-metric-container">
					<p className="googlesitekit-audience-segmentation-tile__custom-metric-title">
						{ tileTitle }
						{ Badge && (
							<div className="googlesitekit-audience-segmentation-tile__metric-badge-container">
								<Badge />
							</div>
						) }
					</p>
					<div className="googlesitekit-audience-segmentation-tile__custom-metric">
						{ children }
					</div>
				</div>
			</div>
		);
	}

	function NoData() {
		return (
			<div className="googlesitekit-audience-segmentation-tile__custom-metric-item">
				{ __( 'No data to show yet', 'google-site-kit' ) }
			</div>
		);
	}

	return (
		<Widget noPadding>
			<div className="googlesitekit-audience-segmentation-tile">
				<div className="googlesitekit-audience-segmentation-tile-header">
					<div className="googlesitekit-audience-segmentation-tile-header__title">
						{ title }
					</div>
					{ infoTooltip && <InfoTooltip title={ infoTooltip } /> }
				</div>
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
						tileTitle={ __( 'Pageviews', 'google-site-kit' ) }
						metricValue={ pageviews.metricValue }
						Badge={ () => (
							<ChangeBadge
								previousValue={ pageviews.previousValue }
								currentValue={ pageviews.currentValue }
							/>
						) }
					/>

					<AudienceTileCustomMetric
						TileIcon={ AudienceMetricIconCities }
						tileTitle={ __(
							'Cities with the most visitors',
							'google-site-kit'
						) }
					>
						{ topCities === null && <NoData /> }
						{ topCities &&
							topCities.dimensionValues.map( ( city, index ) => (
								<div
									key={ city.value }
									className="googlesitekit-audience-segmentation-tile__custom-metric-item"
								>
									{ city.value }
									<span>
										{ numFmt(
											topCities.metricValues[ index ]
												.value,
											{
												style: 'percent',
												maximumFractionDigits: 1,
											}
										) }
									</span>
								</div>
							) ) }
					</AudienceTileCustomMetric>

					<AudienceTileCustomMetric
						TileIcon={ AudienceMetricIconTopContent }
						tileTitle={ __( 'Top content', 'google-site-kit' ) }
						Badge={ () => (
							<div className="googlesitekit-audience-segmentation-tile__custom-metric-partial-data-badge">
								{ __( 'Partial data', 'google-site-kit' ) }
								<InfoTooltip
									title={ __(
										'Partial data tooltip', // TODO: This needs updating to the final tooltip copy.
										'google-site-kit'
									) }
								></InfoTooltip>
							</div>
						) }
					>
						{ topContent === null && <NoData /> }
						{ topContent &&
							topContent.dimensionValues.map(
								( content, index ) => {
									const contentTitle =
										topContentTitles[ content.value ];

									return (
										<div
											key={ content.value }
											className="googlesitekit-audience-segmentation-tile__custom-metric-item"
										>
											{ /* TODO: link to that page in the GA report. */ }
											{ contentTitle }
											<span>
												{ numFmt(
													topContent.metricValues[
														index
													].value
												) }
											</span>
										</div>
									);
								}
							) }
					</AudienceTileCustomMetric>
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
