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
import { useDispatch, useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../../hooks/useBreakpoint';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../../datastore/constants';
import Body from './Body';
import Header from './Header';
import useAudienceTilesReports from '../../../../../hooks/useAudienceTilesReports';
import { isInvalidCustomDimensionError } from '../../../../../utils/custom-dimensions';

const hasZeroDataForAudience = ( report, dimensionName ) => {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === dimensionName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
};

export default function AudienceTiles( { Widget, widgetLoading } ) {
	const breakpoint = useBreakpoint();

	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	// An array of audience resource names.
	const configuredAudiences = useInViewSelect(
		( select ) => select( CORE_USER ).getConfiguredAudiences(),
		[]
	);
	const audiences = useInViewSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getOrSyncAvailableAudiences();
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
		totalPageviewsReportLoaded,
		totalPageviewsReportError,
		topCitiesReportLoaded,
		topCitiesReportErrors,
		topContentReportLoaded,
		topContentReportErrors,
		topContentPageTitlesReportLoaded,
		topContentPageTitlesReportErrors,
	} = useAudienceTilesReports( {
		isSiteKitAudiencePartialData,
		siteKitAudiences,
		otherAudiences,
	} );

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

	return (
		<Widget className="googlesitekit-widget-audience-tiles" noPadding>
			{ allTilesError === false &&
				! loading &&
				isTabbedBreakpoint &&
				visibleAudiences.length > 0 && (
					<Header
						activeTileIndex={ activeTileIndex }
						setActiveTile={ setActiveTile }
						visibleAudiences={ visibleAudiences }
					/>
				) }
			<Body
				activeTileIndex={ activeTileIndex }
				allTilesError={ allTilesError }
				individualTileErrors={ individualTileErrors }
				loading={ loading }
				visibleAudiences={ visibleAudiences }
				Widget={ Widget }
			/>
		</Widget>
	);
}

AudienceTiles.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	widgetLoading: PropTypes.bool.isRequired,
};
