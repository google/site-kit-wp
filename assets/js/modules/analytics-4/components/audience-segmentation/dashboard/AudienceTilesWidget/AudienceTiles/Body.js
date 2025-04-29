/**
 * AudienceTilesWidget Body component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../../datastore/constants';
import { isInvalidCustomDimensionError } from '../../../../../utils/custom-dimensions';
import { reportRowsWithSetValues } from '../../../../../utils/report-rows-with-set-values';
import useAudienceTilesReports from '../../../../../hooks/useAudienceTilesReports';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../../hooks/useBreakpoint';
import useViewOnly from '../../../../../../../hooks/useViewOnly';
import AudienceSegmentationErrorWidget from '../../AudienceSegmentationErrorWidget';
import AudienceTileLoading from '../AudienceTile/AudienceTileLoading';
import AudienceTileError from '../AudienceTile/AudienceTileError';
import AudienceTile from '../AudienceTile';
import AudienceTooltipMessage from '../AudienceTooltipMessage';
import MaybePlaceholderTile from '../MaybePlaceholderTile';

const hasZeroDataForAudience = ( report, dimensionName ) => {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === dimensionName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
};

export default function Body( {
	activeTileIndex,
	allTilesError,
	individualTileErrors,
	loading,
	visibleAudiences,
	Widget,
} ) {
	const breakpoint = useBreakpoint();
	const isViewOnly = useViewOnly();

	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	const audiences = useInViewSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getOrSyncAvailableAudiences();
	}, [] );

	// An array of audience resource names.
	const configuredAudiences = useInViewSelect(
		( select ) => select( CORE_USER ).getConfiguredAudiences(),
		[]
	);

	const [ siteKitAudiences, otherAudiences ] = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredSiteKitAndOtherAudiences()
	) || [ [], [] ];

	const isSiteKitAudiencePartialData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasAudiencePartialData( siteKitAudiences )
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

	const {
		report,
		reportError,
		siteKitAudiencesReport,
		totalPageviews,
		totalPageviewsReportError,
		topCitiesReport,
		topContentReport,
		topContentReportErrors,
		topContentPageTitlesReport,
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

	const hasInvalidCustomDimensionError =
		Object.values( topContentReportErrors ).some(
			isInvalidCustomDimensionError
		) ||
		Object.values( topContentPageTitlesReportErrors ).some(
			isInvalidCustomDimensionError
		);

	const { dismissItem } = useDispatch( CORE_USER );
	const { fetchSyncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleDismiss = useCallback(
		( audienceResourceName ) => {
			dismissItem( `audience-tile-${ audienceResourceName }` );
		},
		[ dismissItem ]
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

	// TODO: The variable `audienceTileNumber` is part of a temporary workaround to ensure `AudienceErrorModal` is only rendered once
	// within `AudienceTilesWidget`. This should be removed once the `AudienceErrorModal` render is extracted
	// from `AudienceTilePagesMetric` and it's rendered once at a higher level instead. See https://github.com/google/site-kit-wp/issues/9543.
	let audienceTileNumber = 0;

	return (
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
						: [];

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
						individualTileErrors[ audienceResourceName ].length > 0
					) {
						return (
							<AudienceTileError
								key={ audienceResourceName }
								audienceSlug={ audienceSlug }
								errors={
									individualTileErrors[ audienceResourceName ]
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
	);
}
