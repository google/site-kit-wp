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

/**
 * WordPress dependencies
 */
import {
	useState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../hooks/useBreakpoint';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import AudienceTile from './AudienceTile';
import InfoTooltip from '../../../../../../components/InfoTooltip';
import AudienceTooltipMessage from './AudienceTooltipMessage';
import AudienceSegmentationErrorWidget from '../AudienceSegmentationErrorWidget';
import AudienceTileError from './AudienceTile/AudienceTileError';
import PlaceholderTile from './PlaceholderTile';
import AudienceTileLoading from './AudienceTile/AudienceTileLoading';

const hasZeroDataForAudience = ( report, audienceResourceName ) => {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === audienceResourceName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
};

export default function AudienceTiles( { Widget, widgetLoading } ) {
	const [ activeTile, setActiveTile ] = useState( 0 );
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	// An array of audience resource names.
	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);
	const audiences = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
	} );

	const audiencesDimensionFilter = {
		audienceResourceName: configuredAudiences,
	};

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

	const reportError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
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

	const totalPageviewsReportError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
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

	const topCitiesReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topCitiesReportOptions,
			configuredAudiences
		)
	);

	const topCitiesReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				{
					...topCitiesReportOptions,
					dimensionFilters: { audienceResourceName },
				},
			] )
		)
	);

	const topCitiesReportErrors = useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...topCitiesReportOptions,
						dimensionFilters: { audienceResourceName },
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );

	const topContentReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 3,
	};

	const topContentReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topContentReportOptions,
			configuredAudiences
		)
	);

	const topContentReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				{
					...topContentReportOptions,
					dimensionFilters: { audienceResourceName },
				},
			] )
		)
	);

	const topContentReportErrors = useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...topContentReportOptions,
						dimensionFilters: { audienceResourceName },
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );

	const topContentPageTitlesReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
	};

	const topContentPageTitlesReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topContentPageTitlesReportOptions,
			configuredAudiences
		)
	);

	const topContentPageTitlesReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				{
					...topContentPageTitlesReportOptions,
					dimensionFilters: { audienceResourceName },
				},
			] )
		)
	);

	const topContentPageTitlesReportErrors = useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...topContentPageTitlesReportOptions,
						dimensionFilters: { audienceResourceName },
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );

	const individualTileErrors = configuredAudiences.reduce(
		( acc, audienceResourceName ) => {
			acc[ audienceResourceName ] = [];

			[
				topCitiesReportErrors,
				topContentReportErrors,
				topContentPageTitlesReportErrors,
			].forEach( ( reportErrors ) => {
				const error = reportErrors[ audienceResourceName ];
				if ( error ) {
					acc[ audienceResourceName ].push( error );
				}
			} );

			return acc;
		},
		{}
	);

	function checkForAllTilesError() {
		if ( reportError || totalPageviewsReportError ) {
			return true;
		}

		return configuredAudiences.every(
			( audienceResourceName ) =>
				individualTileErrors[ audienceResourceName ].length > 0
		);
	}

	const allTilesError = checkForAllTilesError();

	const dismissedItems = useSelect( ( select ) =>
		select( CORE_USER ).getDismissedItems()
	);

	const { isDismissingItem } = useSelect( ( select ) => select( CORE_USER ) );
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

	// useRef to track if the dismissal logic has already been executed.
	const hasDismissed = useRef( {} );

	const [ audiencesToClearDismissal, visibleAudiences ] = useMemo( () => {
		const toClear = [];
		const visible = [];
		// Filter `configuredAudiences` to ensure only available audiences are included.
		const tempAudiences = configuredAudiences
			.slice()
			.filter( ( audienceResourceName ) =>
				audiences.some(
					( audience ) => audience.name === audienceResourceName
				)
			);

		while ( tempAudiences.length > 0 ) {
			const audienceResourceName = tempAudiences.shift();

			const isDismissed = dismissedItems?.includes(
				`audience-tile-${ audienceResourceName }`
			);
			const isZeroData = hasZeroDataForAudience(
				report,
				audienceResourceName
			);

			// Check if there are more audiences remaining to be processed.
			const remainingAudiences =
				tempAudiences.length + visible.length > 0;

			// Skip rendering the tile if it is dismissed, has zero data, and there are still more audiences to render.
			if ( isDismissed && isZeroData && remainingAudiences ) {
				continue;
			}

			// Collect audiences to re-dismiss if they have data again.
			if ( isDismissed && ! isZeroData ) {
				toClear.push( audienceResourceName );
			}

			// Add audience to visibleAudiences
			visible.push( audienceResourceName );
		}

		return [ toClear, visible ];
	}, [ audiences, configuredAudiences, dismissedItems, report ] );

	// Re-dismiss with a short expiry time to clear any previously dismissed tiles.
	// This ensures that the tile will reappear when it is populated with data again.
	useEffect( () => {
		audiencesToClearDismissal.forEach( ( audienceResourceName ) => {
			const itemSlug = `audience-tile-${ audienceResourceName }`;

			if ( hasDismissed.current[ itemSlug ] ) {
				return;
			}

			dismissItem( itemSlug, {
				expiresInSeconds: 1,
			} );

			// Mark as dismissed to prevent re-dismissing.
			hasDismissed.current[ itemSlug ] = true;
		} );
	}, [ audiencesToClearDismissal, dismissItem, isDismissingItem ] );

	const loading =
		widgetLoading ||
		! reportLoaded ||
		! totalPageviewsReportLoaded ||
		! topCitiesReportLoaded ||
		! topContentReportLoaded ||
		! topContentPageTitlesReportLoaded;

	return (
		<Widget className="googlesitekit-widget-audience-tiles" noPadding>
			{ allTilesError === false &&
				! loading &&
				isTabbedBreakpoint &&
				visibleAudiences.length > 0 && (
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
									( { name } ) =>
										name === audienceResourceName
								)?.[ 0 ]?.displayName || '';

							const audienceSlug =
								audiences?.filter(
									( { name } ) =>
										name === audienceResourceName
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
				{ allTilesError && (
					<AudienceSegmentationErrorWidget
						Widget={ Widget }
						errors={ [
							...Object.values( individualTileErrors ).flat( 2 ),
							reportError,
							totalPageviewsReportError,
						] }
					/>
				) }
				{ allTilesError === false &&
					visibleAudiences.map( ( audienceResourceName, index ) => {
						// Conditionally render only the selected audience tile on mobile.
						if ( isTabbedBreakpoint && index !== activeTile ) {
							return null;
						}

						const currentMetricValues = rows.find( ( row ) => {
							return (
								row.dimensionValues[ 0 ]?.value ===
									audienceResourceName &&
								row.dimensionValues[ 1 ]?.value ===
									'date_range_0'
							);
						} )?.metricValues;

						const previousMetricValues = rows.find( ( row ) => {
							return (
								row.dimensionValues[ 0 ]?.value ===
									audienceResourceName &&
								row.dimensionValues[ 1 ]?.value ===
									'date_range_1'
							);
						} )?.metricValues;

						const audienceName =
							audiences?.filter(
								( { name } ) => name === audienceResourceName
							)?.[ 0 ]?.displayName || '';

						const audienceSlug =
							audiences?.filter(
								( { name } ) => name === audienceResourceName
							)?.[ 0 ]?.audienceSlug || '';

						const visitors =
							Number( currentMetricValues?.[ 0 ]?.value ) || 0;
						const prevVisitors =
							Number( previousMetricValues?.[ 0 ]?.value ) || 0;

						const visitsPerVisitors =
							Number( currentMetricValues?.[ 1 ]?.value ) || 0;
						const prevVisitsPerVisitors =
							Number( previousMetricValues?.[ 1 ]?.value ) || 0;

						const pagesPerVisit =
							Number( currentMetricValues?.[ 2 ]?.value ) || 0;
						const prevPagesPerVisit =
							Number( previousMetricValues?.[ 2 ]?.value ) || 0;

						const pageviews =
							Number( currentMetricValues?.[ 3 ]?.value ) || 0;
						const prevPageviews =
							Number( previousMetricValues?.[ 3 ]?.value ) || 0;

						const topCities = topCitiesReport?.[ index ];

						const topContent = topContentReport?.[ index ];

						const topContentTitles = {};

						topContentPageTitlesReport?.[ index ]?.rows?.forEach(
							( row ) => {
								topContentTitles[
									row.dimensionValues[ 0 ].value
								] = row.dimensionValues[ 1 ].value;
							}
						);

						const isPartialData =
							partialDataStates[ audienceResourceName ];
						const isZeroData = hasZeroDataForAudience(
							report,
							audienceResourceName
						);

						// Return loading tile if data is not yet loaded.
						if (
							loading ||
							isZeroData === undefined ||
							isPartialData === undefined
						) {
							return (
								<Widget key={ audienceResourceName } noPadding>
									<AudienceTileLoading />
								</Widget>
							);
						}

						// If errored, skip rendering.
						if (
							individualTileErrors[ audienceResourceName ]
								.length > 0
						) {
							return (
								<AudienceTileError
									key={ audienceResourceName }
									errors={
										individualTileErrors[
											audienceResourceName
										]
									}
								/>
							);
						}

						return (
							<AudienceTile
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
										topCities?.rows?.[ 0 ]
											?.dimensionValues?.[ 0 ],
										topCities?.rows?.[ 1 ]
											?.dimensionValues?.[ 0 ],
										topCities?.rows?.[ 2 ]
											?.dimensionValues?.[ 0 ],
									],
									metricValues: [
										topCities?.rows?.[ 0 ]
											?.metricValues?.[ 0 ],
										topCities?.rows?.[ 1 ]
											?.metricValues?.[ 0 ],
										topCities?.rows?.[ 2 ]
											?.metricValues?.[ 0 ],
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
				{ ! isTabbedBreakpoint &&
					allTilesError === false &&
					visibleAudiences.length === 1 && (
						<Fragment>
							{ loading && (
								<Widget noPadding>
									<AudienceTileLoading />
								</Widget>
							) }
							{ ! loading && (
								<PlaceholderTile Widget={ Widget } />
							) }
						</Fragment>
					) }
			</div>
		</Widget>
	);
}

AudienceTiles.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	widgetLoading: PropTypes.bool.isRequired,
};
