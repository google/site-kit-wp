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
import AudienceTileLoading from './AudienceTile/AudienceTileLoading';
import MaybePlaceholderTile from './MaybePlaceholderTile';
import useAudienceTilesReports from '../../../../hooks/useAudienceTilesReports';
import { isInvalidCustomDimensionError } from '../../../../utils/custom-dimensions';
import useViewContext from '../../../../../../hooks/useViewContext';
import useViewOnly from '../../../../../../hooks/useViewOnly';
import { trackEvent } from '../../../../../../util';
import { reportRowsWithSetValues } from '../../../../utils/report-rows-with-set-values';

const hasZeroDataForAudience = ( report, dimensionName ) => {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === dimensionName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
};

export default function AudienceTiles( { Widget, widgetLoading } ) {
	const viewContext = useViewContext();
	const isViewOnly = useViewOnly();
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
	const [ siteKitAudiences, otherAudiences ] = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredSiteKitAndOtherAudiences()
	) || [ [], [] ];
	const isSiteKitAudiencePartialData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasAudiencePartialData( siteKitAudiences )
	);

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
	} = useAudienceTilesReports( {
		isSiteKitAudiencePartialData,
		siteKitAudiences,
		otherAudiences,
	} );

	const getAudienceTileMetrics = ( audienceResourceName ) => {
		const isSiteKitAudience = siteKitAudiences.some(
			( audience ) => audience.name === audienceResourceName
		);

		// Get the audience slug (e.g., 'new-visitors', 'returning-visitors').
		const audienceSlug = siteKitAudiences.find(
			( audience ) => audience.name === audienceResourceName
		)?.audienceSlug;

		const findMetricsForDateRange = ( dateRange ) => {
			let row;

			if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
				// Determine the dimension value ('new' or 'returning') for Site Kit audiences.
				const dimensionValue =
					audienceSlug === 'new-visitors' ? 'new' : 'returning';

				row = siteKitAudiencesReport?.rows?.find(
					( { dimensionValues } ) =>
						dimensionValues?.[ 0 ]?.value === dimensionValue &&
						dimensionValues?.[ 1 ]?.value === dateRange
				);
			} else {
				row = report?.rows?.find(
					( { dimensionValues } ) =>
						dimensionValues?.[ 0 ]?.value ===
							audienceResourceName &&
						dimensionValues?.[ 1 ]?.value === dateRange
				);
			}

			return [
				Number( row?.metricValues?.[ 0 ]?.value || 0 ), // totalUsers
				Number( row?.metricValues?.[ 1 ]?.value || 0 ), // sessionsPerUser
				Number( row?.metricValues?.[ 2 ]?.value || 0 ), // screenPageViewsPerSession
				Number( row?.metricValues?.[ 3 ]?.value || 0 ), // screenPageViews
			];
		};

		const currentMetrics = findMetricsForDateRange( 'date_range_0' );
		const previousMetrics = findMetricsForDateRange( 'date_range_1' );

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

		const visitors = current[ 0 ];
		const prevVisitors = previous[ 0 ];

		const visitsPerVisitors = current[ 1 ];
		const prevVisitsPerVisitors = previous[ 1 ];

		const pagesPerVisit = current[ 2 ];
		const prevPagesPerVisit = previous[ 2 ];

		const pageviews = current[ 3 ];
		const prevPageviews = previous[ 3 ];

		const topCities = topCitiesReport?.[ audienceIndex ];

		const topContent = topContentReport?.[ audienceIndex ];

		const topContentTitles =
			topContentPageTitlesReport?.[ audienceIndex ]?.rows?.reduce(
				( acc, row ) => {
					acc[ row.dimensionValues[ 0 ].value ] =
						row.dimensionValues[ 1 ].value;

					return acc;
				},
				{}
			) || {};

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
		const isPartialData = isSiteKitAudience
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

				// Filter out invalid custom dimension errors which only relate to the "Top content" metric area,
				// as we still want to show the tile in this case.
				if ( error && ! isInvalidCustomDimensionError( error ) ) {
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
		const mainReportErrors = [];
		if ( report ) {
			mainReportErrors.push( reportError );
		}
		if ( siteKitAudiencesReport ) {
			mainReportErrors.push( siteKitAudiencesReportError );
		}
		if ( mainReportErrors.every( Boolean ) || totalPageviewsReportError ) {
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

	// Sync available custom dimensions if there is a custom dimension error.
	const isSyncingAvailableCustomDimensions = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isFetchingSyncAvailableCustomDimensions()
	);

	const { fetchSyncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );

	const hasInvalidCustomDimensionError =
		Object.values( topContentReportErrors ).some(
			isInvalidCustomDimensionError
		) ||
		Object.values( topContentPageTitlesReportErrors ).some(
			isInvalidCustomDimensionError
		);

	useEffect( () => {
		if ( ! isViewOnly && hasInvalidCustomDimensionError ) {
			fetchSyncAvailableCustomDimensions();
		}
	}, [
		fetchSyncAvailableCustomDimensions,
		hasInvalidCustomDimensionError,
		isViewOnly,
	] );

	// Ensure the active tile is always correctly selected.
	const [ activeTile, setActiveTile ] = useState( visibleAudiences[ 0 ] );

	const getAudienceTileIndex = useCallback(
		( audienceResourceName ) => {
			const index = visibleAudiences.indexOf( audienceResourceName );
			return index === -1 ? 0 : index;
		},
		[ visibleAudiences ]
	);

	useEffect( () => {
		if ( ! visibleAudiences.includes( activeTile ) ) {
			setActiveTile( visibleAudiences[ 0 ] );
		}
	}, [ activeTile, visibleAudiences ] );

	const activeTileIndex = getAudienceTileIndex( activeTile );

	// Determine loading state.
	const loading =
		widgetLoading ||
		! reportLoaded ||
		! siteKitAudiencesReportLoaded ||
		! totalPageviewsReportLoaded ||
		! topCitiesReportLoaded ||
		! topContentReportLoaded ||
		! topContentPageTitlesReportLoaded ||
		isSyncingAvailableCustomDimensions;

	// TODO: The variable `audienceTileNumber` is part of a temporary workaround to ensure `AudienceErrorModal` is only rendered once
	// within `AudienceTilesWidget`. This should be removed once the `AudienceErrorModal` render is extracted
	// from `AudienceTilePagesMetric` and it's rendered once at a higher level instead. See https://github.com/google/site-kit-wp/issues/9543.
	let audienceTileNumber = 0;

	return (
		<Widget className="googlesitekit-widget-audience-tiles" noPadding>
			{ allTilesError === false &&
				! loading &&
				isTabbedBreakpoint &&
				visibleAudiences.length > 0 && (
					<TabBar
						// Force re-render when the number of audiences change, this is a workaround for a bug in TabBar which maintains an internal list of tabs but doesn't update it when the number of tabs is reduced.
						key={ visibleAudiences.length }
						className="googlesitekit-widget-audience-tiles__tabs googlesitekit-tab-bar--start-aligned-high-contrast"
						activeIndex={ activeTileIndex }
						handleActiveIndexUpdate={ ( index ) =>
							setActiveTile( visibleAudiences[ index ] )
						}
					>
						{ visibleAudiences.map(
							( audienceResourceName, index ) => {
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
										// It's a bit counterintuitive, but we need to use `index` as the key here due to how the internal implementation of TabBar works.
										// Specifically, how it maintains an internal list of tabs and pushes new tabs onto the end of the list when it sees a new child. See the use of pushToTabList in renderTab:
										// https://github.com/material-components/material-components-web-react/blob/04ecb80383e49ff0dea765d5fc0d14a442a73c92/packages/tab-bar/index.tsx#L202-L212
										// If we use `audienceResourceName` as the key, and the list of audiences changes, the TabBar's internal list of tabs may go out of sync with the rendered list
										// and the wrong tab will be selected when switching between audiences.
										key={ index }
										aria-label={ audienceName }
									>
										{ audienceName }
										<InfoTooltip
											title={ tooltipMessage }
											tooltipClassName="googlesitekit-info-tooltip__content--audience"
											onOpen={ () => {
												trackEvent(
													`${ viewContext }_audiences-tile`,
													'view_tile_tooltip',
													audienceSlug
												);
											} }
										/>
									</Tab>
								);
							}
						) }
					</TabBar>
				) }
			<div className="googlesitekit-widget-audience-tiles__body">
				{ allTilesError && ! loading && (
					<AudienceSegmentationErrorWidget
						Widget={ Widget }
						errors={ [
							...Object.values( individualTileErrors ).flat( 2 ),
							reportError,
							totalPageviewsReportError,
						] }
					/>
				) }
				{ ( allTilesError === false || loading ) &&
					visibleAudiences.map( ( audienceResourceName, index ) => {
						// Conditionally render only the selected audience tile on mobile.
						if ( isTabbedBreakpoint && index !== activeTileIndex ) {
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

						// Filter (not set) value from the top countries report if present.
						const filteredTopCitiesRows = topCities?.rows
							? reportRowsWithSetValues( topCities.rows )
							: {};

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
									audienceSlug={ audienceSlug }
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
								audienceTileNumber={ audienceTileNumber++ }
								audienceSlug={ audienceSlug }
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
										filteredTopCitiesRows?.[ 0 ]
											?.dimensionValues?.[ 0 ],
										filteredTopCitiesRows?.[ 1 ]
											?.dimensionValues?.[ 0 ],
										filteredTopCitiesRows?.[ 2 ]
											?.dimensionValues?.[ 0 ],
									],
									metricValues: [
										filteredTopCitiesRows?.[ 0 ]
											?.metricValues?.[ 0 ],
										filteredTopCitiesRows?.[ 1 ]
											?.metricValues?.[ 0 ],
										filteredTopCitiesRows?.[ 2 ]
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
								hasInvalidCustomDimensionError={
									hasInvalidCustomDimensionError
								}
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
				{ ! isTabbedBreakpoint && (
					<MaybePlaceholderTile
						Widget={ Widget }
						loading={ loading }
						allTilesError={ allTilesError }
						visibleAudienceCount={ visibleAudiences.length }
					/>
				) }
			</div>
		</Widget>
	);
}

AudienceTiles.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	widgetLoading: PropTypes.bool.isRequired,
};
