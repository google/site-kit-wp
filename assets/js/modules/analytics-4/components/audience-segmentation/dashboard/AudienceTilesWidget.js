/**
 * AudienceTilesWidget component.
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
import { filter } from 'lodash';
import { useEffectOnce } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import whenActive from '../../../../../util/when-active';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import AudienceTile from './AudienceTile';
import AudienceTooltipMessage from './AudienceTooltipMessage';
import InfoTooltip from '../../../../../components/InfoTooltip';

const { useSelect, useDispatch } = Data;

const hasZeroDataForAudience = ( report, audienceResourceName ) => {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === audienceResourceName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
};

function AudienceTilesWidget( { Widget } ) {
	const [ activeTile, setActiveTile ] = useState( 0 );
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	// An array of audience resource names.
	const configuredAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);
	const audiencesDimensionFilter = {
		audienceResourceName: configuredAudiences,
	};
	const audiences = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
	} );

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const { startDate, endDate } = dates;

	const reportOptions = {
		...dates,
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilters: audiencesDimensionFilter,
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
	const reportLoaded = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			reportOptions,
		] )
	);

	const { rows = [] } = report || {};

	const totalPageviewsReportOptions = {
		startDate,
		endDate,
		metrics: [ { name: 'screenPageViews' } ],
	};

	const totalPageviewsReport = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport(
			totalPageviewsReportOptions
		);
	} );
	const totalPageviewsReportLoaded = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			totalPageviewsReportOptions,
		] )
	);

	const totalPageviews =
		Number(
			totalPageviewsReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value
		) || 0;

	const topCitiesReportOptions = {
		startDate,
		endDate,
		dimensions: [ { name: 'city' }, { name: 'audienceResourceName' } ],
		dimensionFilters: {
			audienceResourceName: configuredAudiences,
		},
		metrics: [ { name: 'totalUsers' } ],
		pivots: [
			{
				fieldNames: [ 'city' ],
				orderby: [
					{ metric: { metricName: 'totalUsers' }, desc: true },
				],
				limit: 3,
			},
			{
				fieldNames: [ 'audienceResourceName' ],
				limit: configuredAudiences.length,
			},
		],
	};

	const topCitiesReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPivotReport( topCitiesReportOptions )
	);
	const topCitiesReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( () =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPivotReport',
				[ topCitiesReportOptions ]
			)
		)
	);

	const topContentReportOptions = {
		startDate,
		endDate,
		dimensions: [ { name: 'pagePath' }, { name: 'audienceResourceName' } ],
		dimensionFilters: {
			audienceResourceName: configuredAudiences,
		},
		metrics: [ { name: 'screenPageViews' } ],
		pivots: [
			{
				fieldNames: [ 'pagePath' ],
				orderby: [
					{ metric: { metricName: 'screenPageViews' }, desc: true },
				],
				limit: 3,
			},
			{
				fieldNames: [ 'audienceResourceName' ],
				limit: configuredAudiences.length,
			},
		],
	};

	const topContentReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPivotReport( topContentReportOptions )
	);
	const topContentReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( () =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPivotReport',
				[ topContentReportOptions ]
			)
		)
	);

	const topContentPageTitlesReportOptions = {
		startDate,
		endDate,
		dimensions: [
			{ name: 'pagePath' },
			{ name: 'pageTitle' },
			{ name: 'audienceResourceName' },
		],
		dimensionFilters: {
			audienceResourceName: configuredAudiences,
		},
		metrics: [ { name: 'screenPageViews' } ],
		pivots: [
			{
				fieldNames: [ 'pagePath', 'pageTitle' ],
				orderby: [
					{ metric: { metricName: 'screenPageViews' }, desc: true },
				],
				limit: 15,
			},
			{
				fieldNames: [ 'audienceResourceName' ],
				limit: configuredAudiences.length,
			},
		],
	};

	const topContentPageTitlesReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPivotReport(
			topContentPageTitlesReportOptions
		)
	);
	const topContentPageTitlesReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( () =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPivotReport',
				[ topContentPageTitlesReportOptions ]
			)
		)
	);

	const dismissedItems = useSelect( ( select ) =>
		select( CORE_USER ).getDismissedItems()
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const handleDismiss = useCallback(
		( audienceResourceName ) => {
			dismissItem( `audience-tile-${ audienceResourceName }` );
		},
		[ dismissItem ]
	);

	const partialDataStates = useSelect( ( select ) =>
		configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			acc[ audienceResourceName ] =
				select( MODULES_ANALYTICS_4 ).isAudiencePartialData(
					audienceResourceName
				);
			return acc;
		}, {} )
	);

	const audiencesToClearDismissal = [];
	const visibleAudiences = [];
	const tempAudiences = configuredAudiences.slice();

	while ( tempAudiences.length > 0 ) {
		const audienceResourceName = tempAudiences.shift();

		const isDismissed = dismissedItems?.includes(
			`audience-tile-${ audienceResourceName }`
		);
		const isZeroData = hasZeroDataForAudience(
			report,
			audienceResourceName
		);

		// Skip rendering the tile if it is dismissed, has zero data, and has more audiences to render.
		if ( isDismissed && isZeroData && tempAudiences.length > 0 ) {
			continue;
		}

		// Collect audiences to re-dismiss if they have data again.
		if ( isDismissed && ! isZeroData ) {
			audiencesToClearDismissal.push( audienceResourceName );
		}

		// Add audience to visibleAudiences
		visibleAudiences.push( audienceResourceName );
	}

	// Re-dismiss with a short expiry time to clear any previously dismissed tiles.
	// This ensures that the tile will reappear when it is populated with data again.
	useEffectOnce( () => {
		if ( audiencesToClearDismissal.length > 0 ) {
			audiencesToClearDismissal.forEach( ( audienceResourceName ) => {
				dismissItem( `audience-tile-${ audienceResourceName }`, {
					expiresInSeconds: 1,
				} );
			} );
		}
	} );

	/**
	 * Collects the rows of interest for the relevant audience from report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} audienceResourceName Audience resource name.
	 * @param {Array}  reportRows           Report rows.
	 * @param {number} index                Index at which audience resource name is available in dimension value.
	 * @return {Array} Filtered array.
	 */
	const collectAudiencesRows = (
		audienceResourceName,
		reportRows,
		index = 1
	) => {
		if ( ! reportRows ) {
			return [];
		}
		return filter( reportRows, ( row ) => {
			return (
				audienceResourceName === row?.dimensionValues?.[ index ]?.value
			);
		} );
	};

	const loading =
		! reportLoaded ||
		! totalPageviewsReportLoaded ||
		! topCitiesReportLoaded ||
		! topContentReportLoaded ||
		! topContentPageTitlesReportLoaded;

	return (
		<Widget className="googlesitekit-widget-audience-tiles" noPadding>
			{ isTabbedBreakpoint && (
				<TabBar
					className="googlesitekit-widget-audience-tiles__tabs"
					activeIndex={ activeTile }
					handleActiveIndexUpdate={ ( index ) =>
						setActiveTile( index )
					}
				>
					{ visibleAudiences.map( ( audienceResourceName ) => {
						const audienceName =
							audiences?.filter(
								( { name } ) => name === audienceResourceName
							)?.[ 0 ]?.displayName || '';

						const audienceSlug =
							audiences?.filter(
								( { name } ) => name === audienceResourceName
							)?.[ 0 ]?.audienceSlug || '';

						const tooltipMessage = (
							<AudienceTooltipMessage
								audienceName={ audienceName }
								audienceSlug={ audienceSlug }
							/>
						);

						return (
							<Tab
								key={ audienceResourceName }
								aria-label={ audienceName }
							>
								{ audienceName }
								<InfoTooltip
									title={ tooltipMessage }
									tooltipClassName="googlesitekit-info-tooltip__content--audience"
								/>
							</Tab>
						);
					} ) }
				</TabBar>
			) }
			<div className="googlesitekit-widget-audience-tiles__body">
				{ visibleAudiences.map( ( audienceResourceName, index ) => {
					// Conditionally render only the selected audience tile on mobile.
					if ( isTabbedBreakpoint && index !== activeTile ) {
						return null;
					}

					// TODO: as part of #8484, this data manipulation should be removed and the relevant
					// pivot report rows should be passed directly to the AudienceTile component.
					const metricIndexBase = index * 2;

					const audienceName =
						audiences?.filter(
							( { name } ) => name === audienceResourceName
						)?.[ 0 ]?.displayName || '';

					const audienceSlug =
						audiences?.filter(
							( { name } ) => name === audienceResourceName
						)?.[ 0 ]?.audienceSlug || '';

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

					const topCities = collectAudiencesRows(
						audienceResourceName,
						topCitiesReport?.rows
					);

					const topContent = collectAudiencesRows(
						audienceResourceName,
						topContentReport?.rows
					);

					const topContentTitles = {};

					collectAudiencesRows(
						audienceResourceName,
						topContentPageTitlesReport?.rows,
						2
					)?.forEach( ( row ) => {
						topContentTitles[ row.dimensionValues[ 0 ].value ] =
							row.dimensionValues[ 1 ].value;
					} );

					const isPartialData =
						partialDataStates[ audienceResourceName ];
					const isZeroData = hasZeroDataForAudience(
						report,
						audienceResourceName
					);

					return (
						<AudienceTile
							loaded={ ! loading }
							key={ audienceResourceName }
							title={ audienceName }
							infoTooltip={
								<AudienceTooltipMessage
									audienceName={ audienceName }
									audienceSlug={ audienceSlug }
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
								totalPageviews !== 0
									? pageviews / totalPageviews
									: 0
							}
							topCities={ {
								dimensionValues: [
									topCities?.[ 0 ]?.dimensionValues?.[ 0 ]
										?.value,
									topCities?.[ 1 ]?.dimensionValues?.[ 0 ]
										?.value,
									topCities?.[ 2 ]?.dimensionValues?.[ 0 ]
										?.value,
								],
								metricValues: [
									topCities?.[ 0 ]?.metricValues?.[ 0 ]
										?.value,
									topCities?.[ 1 ]?.metricValues?.[ 0 ]
										?.value,
									topCities?.[ 2 ]?.metricValues?.[ 0 ]
										?.value,
								],
								total: visitors,
							} }
							topContent={ {
								dimensionValues: [
									topContent?.[ 0 ]?.dimensionValues?.[ 0 ]
										?.value,
									topContent?.[ 1 ]?.dimensionValues?.[ 0 ]
										?.value,
									topContent?.[ 2 ]?.dimensionValues?.[ 0 ]
										?.value,
								],
								metricValues: [
									topContent?.[ 0 ]?.metricValues?.[ 0 ]
										?.value,
									topContent?.[ 1 ]?.metricValues?.[ 0 ]
										?.value,
									topContent?.[ 2 ]?.metricValues?.[ 0 ]
										?.value,
								],
							} }
							topContentTitles={ topContentTitles }
							Widget={ Widget }
							audienceResourceName={ audienceResourceName }
							isZeroData={ isZeroData }
							isPartialData={ isPartialData }
							isTileHideable={ visibleAudiences.length > 1 }
							onHideTile={ () =>
								handleDismiss( audienceResourceName )
							}
						/>
					);
				} ) }
			</div>
		</Widget>
	);
}

AudienceTilesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	AudienceTilesWidget
);
