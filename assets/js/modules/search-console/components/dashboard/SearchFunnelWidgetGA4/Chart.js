/**
 * SearchFunnelWidgetGA4 Chart component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import { identity } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { numFmt } from '../../../../../util';
import SearchConsoleStats from './SearchConsoleStats';
import { ActivateAnalyticsCTA, AnalyticsStats } from '../../common';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { Grid, Row, Cell } from '../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';

export default function Chart( {
	canViewSharedAnalytics4,
	dateRangeLength,
	ga4StatsData,
	ga4VisitorsOverviewAndStatsData,
	isGA4GatheringData,
	isSearchConsoleGatheringData,
	metrics,
	searchConsoleData,
	selectedStats,
} ) {
	const breakpoint = useBreakpoint();

	const isGA4Active = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	return (
		<Fragment>
			{ ( selectedStats === 0 || selectedStats === 1 ) && (
				<SearchConsoleStats
					data={ searchConsoleData }
					dateRangeLength={ dateRangeLength }
					selectedStats={ selectedStats }
					metrics={ metrics }
					gatheringData={ isSearchConsoleGatheringData }
				/>
			) }

			{ canViewSharedAnalytics4 &&
				( ! isGA4Active || ! isGA4Connected ) &&
				BREAKPOINT_SMALL === breakpoint && (
					<Grid>
						<Row>
							<Cell>
								<ActivateAnalyticsCTA
									title={ __(
										'Conversions completed',
										'google-site-kit'
									) }
								/>
							</Cell>
						</Row>
					</Grid>
				) }

			{ selectedStats === 2 && (
				<AnalyticsStats
					data={ ga4VisitorsOverviewAndStatsData }
					dateRangeLength={ dateRangeLength }
					selectedStats={ 0 }
					metrics={ metrics }
					dataLabels={ [
						__( 'Unique Visitors', 'google-site-kit' ),
					] }
					tooltipDataFormats={ [
						( x ) => parseFloat( x ).toLocaleString(),
					] }
					statsColor={ metrics[ selectedStats ].color }
					gatheringData={ isGA4GatheringData }
					moduleSlug="analytics-4"
				/>
			) }

			{ canViewSharedAnalytics4 &&
				( selectedStats === 3 || selectedStats === 4 ) && (
					<AnalyticsStats
						data={ ga4StatsData }
						dateRangeLength={ dateRangeLength }
						// The selected stats order defined in the parent component does not match the order from the API.
						selectedStats={ selectedStats - 3 }
						metrics={ metrics }
						dataLabels={ [
							__( 'Conversions', 'google-site-kit' ),
							__( 'Engagement Rate %', 'google-site-kit' ),
						] }
						tooltipDataFormats={ [
							( x ) => parseFloat( x ).toLocaleString(),
							( x ) =>
								numFmt( x / 100, {
									style: 'percent',
									signDisplay: 'never',
									maximumFractionDigits: 2,
								} ),
						] }
						chartDataFormats={ [ identity, ( x ) => x * 100 ] }
						statsColor={ metrics[ selectedStats ].color }
						gatheringData={ isGA4GatheringData }
						moduleSlug="analytics-4"
					/>
				) }
		</Fragment>
	);
}

Chart.propTypes = {
	canViewSharedAnalytics4: PropTypes.bool,
	dateRangeLength: PropTypes.number.isRequired,
	ga4StatsData: PropTypes.object,
	ga4VisitorsOverviewAndStatsData: PropTypes.object,
	isGA4GatheringData: PropTypes.bool,
	isSearchConsoleGatheringData: PropTypes.bool,
	metrics: PropTypes.array.isRequired,
	searchConsoleData: PropTypes.array,
	selectedStats: PropTypes.number.isRequired,
	showRecoverableAnalytics: PropTypes.bool,
};
