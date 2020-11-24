/**
 * DashboardAllTrafficWidget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Widgets from 'googlesitekit-widgets';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import PreviewBlock from '../../../../components/PreviewBlock';
import PreviewTable from '../../../../components/PreviewTable';
import ReportZero from '../../../../components/ReportZero';
import ReportError from '../../../../components/ReportError';
import AcquisitionPieChart from '../common/AcquisitionPieChart';
import AcquisitionSources from '../common/AcquisitionSources';
import { Cell, Grid, Row } from '../../../../material-components';
import { isZeroReport } from '../../util';
const { useSelect } = Data;
const { Widget } = Widgets.components;

export default function DashboardAllTrafficWidget() {
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	const args = {
		dateRange,
		dimensions: 'ga:channelGrouping',
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 10,
	};

	if ( url ) {
		args.url = url;
		args.metrics = [
			{
				expression: 'ga:sessions',
				alias: 'Sessions',
			},
			{
				expression: 'ga:users',
				alias: 'Users',
			},
			{
				expression: 'ga:newUsers',
				alias: 'New Users',
			},
		];
	} else {
		args.metrics = [
			{
				expression: 'ga:users',
				alias: 'Users',
			},
		];
	}

	const resolvedReport = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );
	const { report, error } = useSelect( ( select ) => ( {
		report: select( STORE_NAME ).getReport( args ),
		error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] ),
	} ) );

	if ( resolvedReport && error ) {
		return (
			<Cell size={ 12 }>
				<ReportError moduleSlug="analytics" error={ error } />
			</Cell>
		);
	}

	if ( resolvedReport && isZeroReport( report ) ) {
		return (
			<Cell size={ 12 }>
				<ReportZero moduleSlug="analytics" />;
			</Cell>
		);
	}

	return (
		<Widget slug="analyticsAllTraffic" noPadding>
			<Grid>
				<Row>
					<Cell lgSize={ 4 } mdSize={ 4 } smSize={ 4 }>
						{ ! resolvedReport
							? <PreviewBlock width="282px" height="282px" shape="circular" />
							: <AcquisitionPieChart data={ report } args={ args } source />
						}
					</Cell>
					<Cell lgSize={ 8 } mdSize={ 4 } smSize={ 4 }>
						{ ! resolvedReport
							? <PreviewTable rows={ 3 } rowHeight={ 50 } />
							: <AcquisitionSources data={ report } args={ args } />
						}
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}
