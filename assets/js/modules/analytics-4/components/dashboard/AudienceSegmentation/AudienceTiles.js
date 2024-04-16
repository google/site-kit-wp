/**
 * AudienceTiles component.
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import AudienceTile from './AudienceTile';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import { Tab, TabBar } from 'googlesitekit-components';
import InfoTooltip from '../../../../../components/InfoTooltip';
import AudienceTooltipMessage from './AudienceTooltipMessage';

const { useSelect } = Data;

export default function AudienceTiles( { Widget } ) {
	const [ activeTile, setActiveTile ] = useState( 0 );
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	// An array of audience entity names.
	const configuredAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);
	const audiencesDimensionFilter = {
		filter: {
			fieldName: 'audienceResourceName',
			inListFilter: {
				values: configuredAudiences,
			},
		},
	};
	const audiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAudiences()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilter: audiencesDimensionFilter,
		metrics: [
			{ name: 'totalUsers' },
			{ name: 'sessionsPerUser' },
			{ name: 'screenPageViewsPerSession' },
			{ name: 'screenPageViews' },
		],
	};

	const report = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );

	const { rows = [] } = report || {};

	const totalPageviewsReportOptions = {
		startDate: dates?.startDate,
		endDate: dates?.endDate,
		metrics: [ { name: 'screenPageViews' } ],
	};

	const totalPageviewsReport = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport(
			totalPageviewsReportOptions
		);
	} );

	const totalPageviews =
		totalPageviewsReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value || 0;

	const topCitiesReportOptions = {
		startDate: dates?.startDate,
		endDate: dates?.endDate,
		dimensions: [ 'city' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 3,
	};

	const topCitiesReport = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReportForAllAudiences( {
			options: topCitiesReportOptions,
			audiences,
		} );
	} );

	const topContentReportOptions = {
		startDate: dates?.startDate,
		endDate: dates?.endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 3,
	};

	const topContentReport = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReportForAllAudiences( {
			options: topContentReportOptions,
			audiences,
		} );
	} );

	const topContentPageTitlesReportOptions = {
		startDate: dates?.startDate,
		endDate: dates?.endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
	};

	const topContentPageTitlesReport = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReportForAllAudiences( {
			options: topContentPageTitlesReportOptions,
			audiences,
		} );
	} );

	return (
		<Widget className="googlesitekit-widget__audience-tiles">
			{ isTabbedBreakpoint && (
				<TabBar
					className="googlesitekit-widget__audience-tiles-tabs"
					activeIndex={ activeTile }
					handleActiveIndexUpdate={ ( index ) =>
						setActiveTile( index )
					}
				>
					{ audiences.map( ( { displayName }, index ) => {
						const tooltipMessage = (
							<AudienceTooltipMessage
								audienceName={ displayName }
							/>
						);

						return (
							<Tab
								key={ `google-sitekit-audience-segment-tab-${ index }` }
								aria-label={ displayName }
							>
								{ displayName }
								<InfoTooltip
									title={ tooltipMessage }
									tooltipClassName="googlesitekit-audience-tiles-info-tooltip__content"
								/>
							</Tab>
						);
					} ) }
				</TabBar>
			) }
			<div className="googlesitekit-widget__audience-tiles__body">
				{ configuredAudiences.map( ( audienceResourceName, index ) => {
					// Conditionally render only the selected audience tile on mobile.
					if ( isTabbedBreakpoint && index !== activeTile ) {
						return null;
					}

					// On desktop prevent > 3 tiles from rendering.
					if ( ! isTabbedBreakpoint && index > 2 ) {
						return null;
					}

					// TODO: as part of #8484, this data manipulation should be removed and the relevant
					// pivot report rows should be pass directly to the AudienceTile component.
					const metricIndexBase = index * 2;

					const audienceName =
						audiences?.filter(
							( { name } ) => name === audienceResourceName
						)?.[ 0 ]?.displayName || '';

					const visitors =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 0 ]?.value
						) || 0;
					const prevVisitors =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 0 ]
								?.value
						) || 0;

					const visitsPerVisitors =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 1 ]?.value
						) || 0;
					const prevVisitsPerVisitors =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 1 ]
								?.value
						) || 0;

					const pagesPerVisit =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 2 ]?.value
						) || 0;
					const prevPagesPerVisit =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 2 ]
								?.value
						) || 0;

					const pageviews =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 3 ]?.value
						) || 0;
					const prevPageviews =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 3 ]
								?.value
						) || 0;

					const topCities = topCitiesReport?.[ index ];

					const topContent = topContentReport?.[ index ];

					const topContentTitles = {};

					topContentPageTitlesReport?.[ index ]?.rows?.forEach(
						( row ) => {
							topContentTitles[ row.dimensionValues[ 0 ].value ] =
								row.dimensionValues[ 1 ].value;
						}
					);

					return (
						<AudienceTile
							key={ audienceResourceName }
							title={ audienceName }
							infoTooltip={
								<AudienceTooltipMessage
									audienceName={ audienceName }
								/>
							}
							visitors={ {
								currentValue: visitors,
								previousValue: prevVisitors,
							} }
							visitsPerVisitor={ {
								currentValue: visitsPerVisitors,
								previousValue: prevVisitsPerVisitors,
							} }
							pagesPerVisit={ {
								currentValue: pagesPerVisit,
								previousValue: prevPagesPerVisit,
							} }
							pageviews={ {
								currentValue: pageviews,
								previousValue: prevPageviews,
							} }
							percentageOfTotalPageViews={
								pageviews / totalPageviews
							}
							topCities={ {
								dimensionValues: [
									topCities?.rows?.[ 0 ]
										?.dimensionValues?.[ 0 ],
									topCities?.rows?.[ 1 ]
										?.dimensionValues?.[ 0 ],
									topCities?.rows?.[ 2 ]
										?.dimensionValues?.[ 0 ],
								],
								metricValues: [
									topCities?.rows?.[ 0 ]?.metricValues?.[ 0 ],
									topCities?.rows?.[ 1 ]?.metricValues?.[ 0 ],
									topCities?.rows?.[ 2 ]?.metricValues?.[ 0 ],
								],
								total: visitors,
							} }
							topContent={ {
								dimensionValues: [
									topContent?.rows?.[ 0 ]
										?.dimensionValues?.[ 0 ],
									topContent?.rows?.[ 1 ]
										?.dimensionValues?.[ 0 ],
									topContent?.rows?.[ 2 ]
										?.dimensionValues?.[ 0 ],
								],
								metricValues: [
									topContent?.rows?.[ 0 ]
										?.metricValues?.[ 0 ],
									topContent?.rows?.[ 1 ]
										?.metricValues?.[ 0 ],
									topContent?.rows?.[ 2 ]
										?.metricValues?.[ 0 ],
								],
							} }
							topContentTitles={ topContentTitles }
							Widget={ Widget }
						/>
					);
				} ) }
			</div>
		</Widget>
	);
}

AudienceTiles.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
