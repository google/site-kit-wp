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
import { useDispatch, useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../hooks/useBreakpoint';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import AudienceTile from './AudienceTile';
import InfoTooltip from '../../../../../../components/InfoTooltip';
import AudienceTooltipMessage from './AudienceTooltipMessage';
import AudienceSegmentationErrorWidget from '../AudienceSegmentationErrorWidget';
import AudienceTileError from './AudienceTile/AudienceTileError';
import PlaceholderTile from './PlaceholderTile';
import AudienceTileLoading from './AudienceTile/AudienceTileLoading';
import useAudienceTilesReports from '../../../../hooks/useAudienceTilesReports';

const hasZeroDataForAudience = ( report, dimensionName ) => {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === dimensionName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
};

const aggregateMetrics = ( rows ) => {
	return rows?.reduce(
		( acc, row ) => {
			acc[ 0 ] += Number( row.metricValues?.[ 0 ]?.value || 0 ); // totalUsers
			acc[ 1 ] += Number( row.metricValues?.[ 1 ]?.value || 0 ); // sessionsPerUser
			acc[ 2 ] += Number( row.metricValues?.[ 2 ]?.value || 0 ); // screenPageViewsPerSession
			acc[ 3 ] += Number( row.metricValues?.[ 3 ]?.value || 0 ); // screenPageViews
			return acc;
		},
		[ 0, 0, 0, 0 ]
	);
};

export default function AudienceTiles( { Widget, widgetLoading } ) {
	const [ activeTile, setActiveTile ] = useState( 0 );
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	// An array of audience resource names.
	const configuredAudiences = useInViewSelect(
		( select ) => select( CORE_USER ).getConfiguredAudiences(),
		[]
	);
	const audiences = useInViewSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
	}, [] );

	const {
		report,
		reportLoaded,
		reportError,
		siteKitAudiencesReport,
		siteKitAudiencesReportLoaded,
		siteKitAudiencesReportError,
		totalPageviews,
		totalPageviewsReportLoaded,
		totalPageviewsReportError,
		topCitiesReport,
		topCitiesReportLoaded,
		topCitiesReportErrors,
		topContentReport,
		topContentReportLoaded,
		topContentReportErrors,
		topContentPageTitlesReport,
		topContentPageTitlesReportLoaded,
		topContentPageTitlesReportErrors,
	} = useAudienceTilesReports();

	// eslint-disable-next-line no-unused-vars
	const [ siteKitAudiences, otherAudiences ] = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredSiteKitAndOtherAudiences()
	);

	const isSiteKitAudiencePartialData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasAudiencePartialData( siteKitAudiences )
	);

	const getAudienceTileMetrics = ( audienceResourceName ) => {
		const isSiteKitAudience = siteKitAudiences.some(
			( audience ) => audience.name === audienceResourceName
		);

		// Get the audience slug (e.g., 'new-visitors', 'returning-visitors').
		const audienceSlug = siteKitAudiences.find(
			( audience ) => audience.name === audienceResourceName
		)?.audienceSlug;

		const aggregateRows = ( dateRange ) => {
			let rows = [];

			if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
				// Determine the dimension value ('new' or 'returning') for Site Kit audiences.
				const dimensionValue =
					audienceSlug === 'new-visitors' ? 'new' : 'returning';

				// Filter for Site Kit audiences with partial data state.
				rows = siteKitAudiencesReport?.rows?.filter(
					( row ) =>
						row.dimensionValues?.[ 0 ]?.value === dimensionValue &&
						row.dimensionValues?.[ 1 ]?.value === dateRange
				);
			} else {
				// Filter for non-Site Kit audiences or fully aggregated Site Kit data.
				rows = report?.rows?.filter(
					( row ) =>
						row.dimensionValues?.[ 0 ]?.value ===
							audienceResourceName &&
						row.dimensionValues?.[ 1 ]?.value === dateRange
				);
			}

			// Ensure rows are defined and non-empty before aggregating metrics.
			if ( rows && rows.length > 0 ) {
				return aggregateMetrics( rows );
			}
			// Return default values if no data is available.
			return [ 0, 0, 0, 0 ];
		};

		const currentMetrics = aggregateRows( 'date_range_0' );
		const previousMetrics = aggregateRows( 'date_range_1' );

		return { current: currentMetrics, previous: previousMetrics };
	};

	const getAudienceTileData = ( audienceResourceName, audienceIndex ) => {
		const audienceName =
			audiences?.filter(
				( { name } ) => name === audienceResourceName
			)?.[ 0 ]?.displayName || '';

		const audienceSlug =
			audiences?.filter(
				( { name } ) => name === audienceResourceName
			)?.[ 0 ]?.audienceSlug || '';

		const { current, previous } =
			getAudienceTileMetrics( audienceResourceName );

		const visitors = current[ 0 ] || 0;
		const prevVisitors = previous[ 0 ] || 0;

		const visitsPerVisitors = current[ 1 ] || 0;
		const prevVisitsPerVisitors = previous[ 1 ] || 0;

		const pagesPerVisit = current[ 2 ] || 0;
		const prevPagesPerVisit = previous[ 2 ] || 0;

		const pageviews = current[ 3 ] || 0;
		const prevPageviews = previous[ 3 ] || 0;

		const topCities = topCitiesReport?.[ audienceIndex ];

		const topContent = topContentReport?.[ audienceIndex ];

		const topContentTitles = {};

		topContentPageTitlesReport?.[ audienceIndex ]?.rows?.forEach(
			( row ) => {
				topContentTitles[ row.dimensionValues[ 0 ].value ] =
					row.dimensionValues[ 1 ].value;
			}
		);

		const isSiteKitAudience = siteKitAudiences.some(
			( audience ) => audience.name === audienceResourceName
		);

		let reportToCheck = report;
		let dimensionValue = audienceResourceName;

		if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
			// If it's a Site Kit audience in a partial data state, use the siteKitAudiencesReport.
			reportToCheck = siteKitAudiencesReport;

			// Determine the dimension value ('new' or 'returning') for Site Kit audiences.
			dimensionValue =
				audienceSlug === 'new-visitors' ? 'new' : 'returning';
		}

		const isZeroData = hasZeroDataForAudience(
			reportToCheck,
			dimensionValue
		);
		const isPartialData =
			isSiteKitAudience && isSiteKitAudiencePartialData
				? false
				: partialDataStates[ audienceResourceName ];

		return {
			audienceName,
			audienceSlug,
			visitors,
			prevVisitors,
			visitsPerVisitors,
			prevVisitsPerVisitors,
			pagesPerVisit,
			prevPagesPerVisit,
			pageviews,
			prevPageviews,
			topCities,
			topContent,
			topContentTitles,
			isZeroData,
			isPartialData,
		};
	};

	const individualTileErrors = configuredAudiences?.reduce(
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

	const partialDataStates = useInViewSelect(
		( select ) =>
			configuredAudiences?.reduce( ( acc, audienceResourceName ) => {
				acc[ audienceResourceName ] =
					select( MODULES_ANALYTICS_4 ).isAudiencePartialData(
						audienceResourceName
					);
				return acc;
			}, {} ),
		[ configuredAudiences ]
	);

	// useRef to track if the dismissal logic has already been executed.
	const hasDismissed = useRef( {} );

	const [ audiencesToClearDismissal, visibleAudiences ] = useMemo( () => {
		const toClear = [];
		const visible = [];
		// Filter `configuredAudiences` to ensure only available audiences are included.
		const tempAudiences = configuredAudiences
			?.slice()
			.filter( ( audienceResourceName ) =>
				audiences.some(
					( audience ) => audience.name === audienceResourceName
				)
			);

		while ( tempAudiences?.length > 0 ) {
			const audienceResourceName = tempAudiences.shift();
			const isDismissed = dismissedItems?.includes(
				`audience-tile-${ audienceResourceName }`
			);
			const isSiteKitAudience = siteKitAudiences.some(
				( audience ) => audience.name === audienceResourceName
			);

			let reportToCheck = report;
			let dimensionValue = audienceResourceName;

			if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
				// If it's a Site Kit audience in a partial data state, use the siteKitAudiencesReport.
				reportToCheck = siteKitAudiencesReport;

				// Get the audience slug (e.g., 'new-visitors', 'returning-visitors').
				const audienceSlug = siteKitAudiences.find(
					( audience ) => audience.name === audienceResourceName
				)?.audienceSlug;

				// Determine the dimension value ('new' or 'returning') for Site Kit audiences.
				dimensionValue =
					audienceSlug === 'new-visitors' ? 'new' : 'returning';
			}

			const isZeroData = hasZeroDataForAudience(
				reportToCheck,
				dimensionValue
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
	}, [
		audiences,
		configuredAudiences,
		dismissedItems,
		isSiteKitAudiencePartialData,
		report,
		siteKitAudiences,
		siteKitAudiencesReport,
	] );

	function checkForAllTilesError() {
		const isSiteKitAudience = visibleAudiences.some(
			( audienceResourceName ) =>
				siteKitAudiences.some(
					( audience ) => audience.name === audienceResourceName
				)
		);

		let reportErrorToCheck = reportError;
		if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
			reportErrorToCheck = siteKitAudiencesReportError;
		}

		if ( reportErrorToCheck || totalPageviewsReportError ) {
			return true;
		}

		return configuredAudiences?.every(
			( audienceResourceName ) =>
				individualTileErrors[ audienceResourceName ].length > 0
		);
	}

	const allTilesError = checkForAllTilesError();

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
		! siteKitAudiencesReportLoaded ||
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

						const {
							audienceName,
							audienceSlug,
							visitors,
							prevVisitors,
							visitsPerVisitors,
							prevVisitsPerVisitors,
							pagesPerVisit,
							prevPagesPerVisit,
							pageviews,
							prevPageviews,
							topCities,
							topContent,
							topContentTitles,
							isZeroData,
							isPartialData,
						} = getAudienceTileData( audienceResourceName, index );

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
