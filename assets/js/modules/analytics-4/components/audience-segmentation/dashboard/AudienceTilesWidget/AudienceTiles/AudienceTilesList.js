import PropTypes from 'prop-types';
import { Fragment } from '@wordpress/element';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import AudienceTileLoading from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTile/AudienceTileLoading';
import AudienceTileError from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTile/AudienceTileError';
import AudienceTile from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTile';
import AudienceTooltipMessage from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTooltipMessage';
import { reportRowsWithSetValues } from '@/js/modules/analytics-4/utils/report-rows-with-set-values';

function AudienceTilesList( props ) {
	const {
		activeTileIndex,
		visibleAudiences,
		loading,
		topCitiesReportsLoaded,
		topContentReportsLoaded,
		topContentPageTitlesReportsLoaded,
		individualTileErrors,
		totalPageviews,
		hasInvalidCustomDimensionError,
		Widget,
		getAudienceTileData,
		handleDismiss,
	} = props;

	// Determine tabbed breakpoint locally to reduce prop drilling.
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	return (
		<Fragment>
			{ visibleAudiences.map( ( audienceResourceName, index ) => {
				// Respect tabbed breakpoint visibility rules.
				if ( isTabbedBreakpoint && index !== activeTileIndex ) {
					return null;
				}

				const tileData = getAudienceTileData(
					audienceResourceName,
					index
				);
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
				} = tileData;

				// While reports or zero/partial flags are still undefined, show loading state.
				const reportsNotReady =
					loading ||
					! topCitiesReportsLoaded?.[ audienceResourceName ] ||
					! topContentReportsLoaded?.[ audienceResourceName ] ||
					! topContentPageTitlesReportsLoaded?.[
						audienceResourceName
					] ||
					isZeroData === undefined ||
					isPartialData === undefined;

				if ( reportsNotReady ) {
					return (
						<Widget key={ audienceResourceName } noPadding>
							<AudienceTileLoading />
						</Widget>
					);
				}

				// Show per-tile error component if errors exist.
				const perTileErrors =
					individualTileErrors?.[ audienceResourceName ];
				if ( perTileErrors?.length > 0 ) {
					return (
						<AudienceTileError
							key={ audienceResourceName }
							audienceSlug={ audienceSlug }
							errors={ perTileErrors }
						/>
					);
				}

				// Filter out rows with unset values for top cities.
				const filteredTopCitiesRows = topCities?.rows
					? reportRowsWithSetValues( topCities.rows )
					: [];

				// Build top cities structure (limit to first 3 entries).
				const topCitiesProp = {
					dimensionValues: [
						filteredTopCitiesRows?.[ 0 ]?.dimensionValues?.[ 0 ],
						filteredTopCitiesRows?.[ 1 ]?.dimensionValues?.[ 0 ],
						filteredTopCitiesRows?.[ 2 ]?.dimensionValues?.[ 0 ],
					],
					metricValues: [
						filteredTopCitiesRows?.[ 0 ]?.metricValues?.[ 0 ],
						filteredTopCitiesRows?.[ 1 ]?.metricValues?.[ 0 ],
						filteredTopCitiesRows?.[ 2 ]?.metricValues?.[ 0 ],
					],
					total: visitors,
				};

				// Build top content structure (limit to first 3 rows).
				const topContentProp = {
					dimensionValues: [
						topContent?.rows?.[ 0 ]?.dimensionValues?.[ 0 ],
						topContent?.rows?.[ 1 ]?.dimensionValues?.[ 0 ],
						topContent?.rows?.[ 2 ]?.dimensionValues?.[ 0 ],
					],
					metricValues: [
						topContent?.rows?.[ 0 ]?.metricValues?.[ 0 ],
						topContent?.rows?.[ 1 ]?.metricValues?.[ 0 ],
						topContent?.rows?.[ 2 ]?.metricValues?.[ 0 ],
					],
				};

				return (
					<AudienceTile
						key={ audienceResourceName }
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
						topCities={ topCitiesProp }
						topContent={ topContentProp }
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
		</Fragment>
	);
}

AudienceTilesList.propTypes = {
	activeTileIndex: PropTypes.number.isRequired,
	visibleAudiences: PropTypes.array.isRequired,
	loading: PropTypes.bool.isRequired,
	topCitiesReportsLoaded: PropTypes.object.isRequired,
	topContentReportsLoaded: PropTypes.object.isRequired,
	topContentPageTitlesReportsLoaded: PropTypes.object.isRequired,
	individualTileErrors: PropTypes.object.isRequired,
	totalPageviews: PropTypes.number.isRequired,
	hasInvalidCustomDimensionError: PropTypes.bool.isRequired,
	Widget: PropTypes.elementType.isRequired,
	getAudienceTileData: PropTypes.func.isRequired,
	handleDismiss: PropTypes.func.isRequired,
};

export default AudienceTilesList;
