/**
 * DashboardSummaryWidget component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { isZeroReport, reduceAdSenseData } from '../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import whenActive from '../../../../util/when-active';
import { Cell, Grid, Row } from '../../../../material-components';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import AdBlockerWarning from '../common/AdBlockerWarning';
const { useSelect, useInViewSelect } = Data;

function DashboardSummaryWidget( {
	Widget,
	WidgetReportZero,
	WidgetReportError,
} ) {
	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} )
	);

	const previousPeriodArgs = {
		startDate: compareStartDate,
		endDate: compareEndDate,
		metrics: [ 'ESTIMATED_EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ],
	};

	const periodArgs = {
		startDate,
		endDate,
		metrics: [ 'ESTIMATED_EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ],
	};

	const dailyArgs = {
		...periodArgs,
		dimensions: [ 'DATE' ],
	};

	const dateRangeArgs = generateDateRangeArgs( { startDate, endDate } );

	const {
		error,
		loading,
		rpmReportURL,
		earningsURL,
		impressionsURL,
		isAdblockerActive,
	} = useSelect( ( select ) => {
		return {
			loading:
				! select( MODULES_ADSENSE ).hasFinishedResolution(
					'getReport',
					[ periodArgs ]
				) ||
				! select( MODULES_ADSENSE ).hasFinishedResolution(
					'getReport',
					[ previousPeriodArgs ]
				) ||
				! select( MODULES_ADSENSE ).hasFinishedResolution(
					'getReport',
					[ dailyArgs ]
				),
			error:
				select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
					periodArgs,
				] ) ||
				select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
					previousPeriodArgs,
				] ) ||
				select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
					dailyArgs,
				] ),
			rpmReportURL: select( MODULES_ADSENSE ).getServiceReportURL( {
				...dateRangeArgs,
				gm: 'pageViewsRpm',
			} ),
			earningsURL: select( MODULES_ADSENSE ).getServiceReportURL( {
				...dateRangeArgs,
				gm: 'earnings',
			} ),
			impressionsURL: select( MODULES_ADSENSE ).getServiceReportURL( {
				...dateRangeArgs,
				gm: 'monetizableImpressions',
			} ),
			isAdblockerActive: select( MODULES_ADSENSE ).isAdBlockerActive(),
		};
	} );

	const period = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( periodArgs )
	);

	const previousPeriod = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( previousPeriodArgs )
	);

	const daily = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( dailyArgs )
	);

	if ( isAdblockerActive ) {
		return (
			<Widget>
				<AdBlockerWarning />
			</Widget>
		);
	}

	if ( loading ) {
		return (
			<Widget>
				<PreviewBlock width="100%" height="276px" />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget>
				<WidgetReportError moduleSlug="adsense" error={ error } />
			</Widget>
		);
	}

	if (
		isZeroReport( previousPeriod ) &&
		isZeroReport( period ) &&
		isZeroReport( daily )
	) {
		return (
			<Widget>
				<WidgetReportZero moduleSlug="adsense" />
			</Widget>
		);
	}

	const processedData = reduceAdSenseData( daily?.rows || [] );

	const currencyHeader = period.headers.find(
		( header ) =>
			null !== header.currencyCode && 0 < header.currencyCode.length
	);
	const currencyCode = currencyHeader ? currencyHeader.currencyCode : false;

	return (
		<Widget className="googlesitekit-dashboard-adsense-stats" noPadding>
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<DataBlock
							className="overview-adsense-rpm"
							title={ __( 'Page RPM', 'google-site-kit' ) }
							datapoint={ period.totals?.cells[ 1 ].value || 0 }
							datapointUnit={ currencyCode }
							change={
								period.totals?.cells[ 1 ].value ||
								0 - previousPeriod.totals?.cells[ 1 ].value ||
								0
							}
							changeDataUnit={ currencyCode }
							source={ {
								name: _x(
									'AdSense',
									'Service name',
									'google-site-kit'
								),
								link: rpmReportURL,
								external: true,
							} }
							sparkline={
								daily && (
									<Sparkline
										data={ extractForSparkline(
											processedData.dataMap,
											2
										) }
										change={ 1 }
									/>
								)
							}
							context="compact"
						/>
					</Cell>

					<Cell size={ 12 }>
						<DataBlock
							className="overview-adsense-earnings"
							title={ __( 'Total Earnings', 'google-site-kit' ) }
							datapoint={ period.totals?.cells[ 0 ].value || 0 }
							datapointUnit={ currencyCode }
							source={ {
								name: _x(
									'AdSense',
									'Service name',
									'google-site-kit'
								),
								link: earningsURL,
								external: true,
							} }
							change={
								period.totals?.cells[ 0 ].value ||
								0 - previousPeriod.totals?.cells[ 0 ].value ||
								0
							}
							changeDataUnit={ currencyCode }
							sparkline={
								daily && (
									<Sparkline
										data={ extractForSparkline(
											processedData.dataMap,
											1
										) }
										change={ 1 }
									/>
								)
							}
							context="compact"
						/>
					</Cell>

					<Cell size={ 12 }>
						<DataBlock
							className="overview-adsense-impressions"
							title={ __( 'Ad Impressions', 'google-site-kit' ) }
							datapoint={ period.totals?.cells[ 2 ].value || 0 }
							change={
								period.totals?.cells[ 2 ].value ||
								0 - previousPeriod.totals?.cells[ 2 ].value ||
								0
							}
							changeDataUnit
							source={ {
								name: _x(
									'AdSense',
									'Service name',
									'google-site-kit'
								),
								link: impressionsURL,
								external: true,
							} }
							sparkline={
								daily && (
									<Sparkline
										data={ extractForSparkline(
											processedData.dataMap,
											3
										) }
										change={ 1 }
									/>
								)
							}
							context="compact"
						/>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}

export default whenActive( { moduleName: 'adsense' } )(
	DashboardSummaryWidget
);
