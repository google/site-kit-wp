/**
 * DataBlocks component for SearchFunnelWidgetGA4/Overview.
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
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import { Cell } from '../../../../../../material-components';
import { extractSearchConsoleDashboardData } from '../../../../util';
import DataBlock from '../../../../../../components/DataBlock';
import DataBlockGroup from '../../../../../../components/DataBlockGroup';
import NewBadge from '../../../../../../components/NewBadge';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../../../analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../../datastore/constants';
import {
	DASHBOARD_TYPE_ENTITY,
	DASHBOARD_TYPE_MAIN,
} from '../../../../../../hooks/useDashboardType';
import { getCellProps, getDatapointAndChange } from './utils';

export default function DataBlocks( {
	ga4Data,
	ga4VisitorsData,
	searchConsoleData,
	selectedStats,
	handleStatsSelection,
	dateRangeLength,
	showGA4,
	dashboardType,
	showConversionsCTA,
	engagementRateLearnMoreURL,
	onGA4NewBadgeLearnMoreClick,
} ) {
	const ga4ModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const isGA4GatheringData = useInViewSelect(
		( select ) =>
			ga4ModuleConnected
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: false,
		[ ga4ModuleConnected ]
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const {
		totalClicks,
		totalImpressions,
		totalClicksChange,
		totalImpressionsChange,
	} = extractSearchConsoleDashboardData( searchConsoleData, dateRangeLength );

	let ga4ConversionsChange = null;
	let ga4ConversionsDatapoint = null;
	let ga4EngagementRateDatapoint = null;
	let ga4EngagementRateChange = null;
	let ga4VisitorsDatapoint = null;
	let ga4VisitorsChange = null;

	if (
		ga4ModuleActive &&
		isPlainObject( ga4Data ) &&
		isPlainObject( ga4VisitorsData )
	) {
		( { change: ga4ConversionsChange } = getDatapointAndChange(
			ga4Data,
			0,
			100
		) );
		ga4ConversionsDatapoint =
			ga4Data?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;

		( {
			datapoint: ga4EngagementRateDatapoint,
			change: ga4EngagementRateChange,
		} = getDatapointAndChange( ga4Data, 1 ) );

		ga4VisitorsDatapoint =
			ga4VisitorsData?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;
		( { change: ga4VisitorsChange } = getDatapointAndChange(
			ga4VisitorsData,
			0,
			100
		) );
	}

	const {
		quarterCellProps,
		halfCellProps,
		oneThirdCellProps,
		threeQuartersCellProps,
		fullCellProps,
	} = getCellProps( showConversionsCTA );

	// Collection of all the data blocks to be displayed.
	const dataBlocks = [
		{
			id: 'impressions',
			stat: 0,
			title: __( 'Total Impressions', 'google-site-kit' ),
			datapoint: totalImpressions,
			change: totalImpressionsChange,
			isGatheringData: isSearchConsoleGatheringData,
		},
		{
			id: 'clicks',
			stat: 1,
			title: __( 'Total Clicks', 'google-site-kit' ),
			datapoint: totalClicks,
			change: totalClicksChange,
			isGatheringData: isSearchConsoleGatheringData,
		},
		...( showGA4
			? [
					{
						id: 'visitors',
						stat: 2,
						title: __(
							'Unique Visitors from Search',
							'google-site-kit'
						),
						datapoint: ga4VisitorsDatapoint,
						change: ga4VisitorsChange,
						isGatheringData: isGA4GatheringData,
					},
			  ]
			: [] ),
		...( showGA4 &&
		dashboardType === DASHBOARD_TYPE_MAIN &&
		! showConversionsCTA
			? [
					{
						id: 'conversions',
						stat: 3,
						title: __( 'Conversions', 'google-site-kit' ),
						datapoint: ga4ConversionsDatapoint,
						change: ga4ConversionsChange,
						isGatheringData: isGA4GatheringData,
					},
			  ]
			: [] ),
		...( showGA4 && dashboardType === DASHBOARD_TYPE_ENTITY
			? [
					{
						id: 'engagement-rate',
						stat: 4,
						title: __( 'Engagement Rate', 'google-site-kit' ),
						datapoint: ga4EngagementRateDatapoint,
						datapointUnit: '%',
						change: ga4EngagementRateChange,
						isGatheringData: isGA4GatheringData,
						badge: (
							<NewBadge
								tooltipTitle={ __(
									'Sessions which lasted 10 seconds or longer, had 1 or more conversion events, or 2 or more page views.',
									'google-site-kit'
								) }
								learnMoreLink={ engagementRateLearnMoreURL }
								onLearnMoreClick={ onGA4NewBadgeLearnMoreClick }
							/>
						),
					},
			  ]
			: [] ),
	];

	const dataBlockWrapperCellProps = {
		2: halfCellProps,
		3: threeQuartersCellProps,
		4: fullCellProps,
	};

	const dataBlockCellProps = {
		2: {
			...halfCellProps,
			smSize: 2,
		},
		3: oneThirdCellProps,
		4: quarterCellProps,
	};

	return (
		<Cell { ...dataBlockWrapperCellProps[ dataBlocks.length ] }>
			<DataBlockGroup className="mdc-layout-grid__inner">
				{ dataBlocks.map( ( dataBlock, index ) => (
					<Cell
						key={ dataBlock.id }
						{ ...dataBlockCellProps[ dataBlocks.length ] }
					>
						<DataBlock
							stat={ dataBlock.stat }
							className={ `googlesitekit-data-block--${
								dataBlock.id
							} googlesitekit-data-block--button-${ index + 1 }` }
							title={ dataBlock.title }
							datapoint={ dataBlock.datapoint }
							datapointUnit={
								dataBlock.datapointUnit
									? dataBlock.datapointUnit
									: undefined
							}
							change={ dataBlock.change }
							changeDataUnit="%"
							context="button"
							selected={ selectedStats === dataBlock.stat }
							handleStatSelection={ handleStatsSelection }
							gatheringData={ dataBlock.isGatheringData }
						/>
					</Cell>
				) ) }
			</DataBlockGroup>
		</Cell>
	);
}

DataBlocks.propTypes = {
	ga4Data: PropTypes.object,
	ga4VisitorsData: PropTypes.object,
	searchConsoleData: PropTypes.arrayOf( PropTypes.object ),
	selectedStats: PropTypes.number.isRequired,
	handleStatsSelection: PropTypes.func.isRequired,
	dateRangeLength: PropTypes.number.isRequired,
	showGA4: PropTypes.bool,
	dashboardType: PropTypes.string,
	showConversionsCTA: PropTypes.bool,
	isGA4GatheringData: PropTypes.bool,
	isSearchConsoleGatheringData: PropTypes.bool,
	engagementRateLearnMoreURL: PropTypes.string,
	onGA4NewBadgeLearnMoreClick: PropTypes.func.isRequired,
};
