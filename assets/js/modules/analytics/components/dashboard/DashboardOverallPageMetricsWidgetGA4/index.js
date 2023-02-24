/**
 * DashboardOverallPageMetricsWidgetGA4 component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
import PreviewBlock from '../../../../../components/PreviewBlock';
import DataBlock from '../../../../../components/DataBlock';
import Sparkline from '../../../../../components/Sparkline';
import SourceLink from '../../../../../components/SourceLink';
import whenActive from '../../../../../util/when-active';
import WidgetHeaderTitle from '../../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import { useOverallPageMetricsReport } from './hooks/useOverallPageMetricsReport';
import { calculateOverallPageMetricsData } from './utils';
const { useSelect, useInViewSelect } = Data;

function DashboardOverallPageMetricsWidgetGA4( { Widget, WidgetReportError } ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const { report, dates, serviceURL, isLoading, error } =
		useOverallPageMetricsReport();

	const currentDayCount = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	const Header = () => (
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

	const Footer = () => (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			href={ serviceURL }
			external
		/>
	);

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

	const data = calculateOverallPageMetricsData( report, dates.startDate );

	return (
		<Widget Header={ Header } Footer={ Footer }>
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
	DashboardOverallPageMetricsWidgetGA4
);
