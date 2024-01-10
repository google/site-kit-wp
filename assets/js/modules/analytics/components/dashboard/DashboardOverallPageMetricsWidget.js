/**
 * OverallPageMetricsWidget component.
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
import { _x, sprintf, _n } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { Grid, Row, Cell } from '../../../../material-components/layout';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import SourceLink from '../../../../components/SourceLink';
import UACutoffWarning from '../common/UACutoffWarning';
import whenActive from '../../../../util/when-active';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import { calculateOverallPageMetricsData } from '../../util/overall-page-metrics';
import { getURLPath } from '../../../../util';
import WidgetHeaderTitle from '../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import useViewOnly from '../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect } = Data;

function DashboardOverallPageMetricsWidget( { Widget, WidgetReportError } ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const args = {
		...dates,
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
			{
				expression: 'ga:uniquePageviews',
				alias: 'Unique Pageviews',
			},
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce Rate',
			},
			{
				expression: 'ga:avgSessionDuration',
				alias: 'Session Duration',
			},
		],
		url,
	};

	const reportArgs = generateDateRangeArgs( dates );

	if ( isURL( url ) ) {
		reportArgs[ 'explorer-table.plotKeys' ] = '[]';
		reportArgs[ '_r.drilldown' ] = `analytics.pagePath:${ getURLPath(
			url
		) }`;
	}

	const isLoading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				args,
			] )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] )
	);

	const serviceURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}

		return select( MODULES_ANALYTICS ).getServiceReportURL(
			'visitors-overview',
			reportArgs
		);
	} );

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	const currentDayCount = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	function Header() {
		return (
			<WidgetHeaderTitle
				title={ sprintf(
					/* translators: %s: number of days */
					_n(
						'Overall page metrics over the last %s day',
						'Overall page metrics over the last %s days',
						currentDayCount,
						'google-site-kit'
					),
					currentDayCount
				) }
			/>
		);
	}

	function Footer() {
		return (
			<SourceLink
				className="googlesitekit-data-block__source"
				name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
				href={ serviceURL }
				external
			/>
		);
	}

	if ( isLoading || isGatheringData === undefined ) {
		return (
			<Widget Footer={ Footer }>
				<PreviewBlock width="100%" height="222px" />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics" error={ error } />
			</Widget>
		);
	}

	const data = calculateOverallPageMetricsData( report );

	return (
		<Widget Header={ Header } Footer={ Footer }>
			<UACutoffWarning className="googlesitekit-ua-cutoff-warning--overall-page-metrics" />
			<Grid>
				<Row>
					{ data.map(
						( {
							metric,
							title,
							sparkLineData,
							datapointUnit,
							total,
							change,
						} ) => (
							<Cell key={ metric } smSize={ 2 } lgSize={ 3 }>
								<DataBlock
									title={ title }
									datapoint={ total }
									datapointUnit={ datapointUnit }
									change={ change }
									changeDataUnit="%"
									gatheringData={ isGatheringData }
									sparkline={
										<Sparkline
											data={ sparkLineData }
											change={ change }
											gatheringData={ isGatheringData }
										/>
									}
								/>
							</Cell>
						)
					) }
				</Row>
			</Grid>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics' } )(
	DashboardOverallPageMetricsWidget
);
