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
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import PreviewTable from '../../../../components/PreviewTable';
import ReportZero from '../../../../components/ReportZero';
import ReportError from '../../../../components/ReportError';
import AcquisitionPieChart from '../common/AcquisitionPieChart';
import AcquisitionSources from '../common/AcquisitionSources';
import { isZeroReport } from '../../util';
const { useSelect } = Data;
const { Widget } = Widgets.components;

function DashboardAllTrafficWidget() {
	const {
		loading,
		report,
		reportArgs,
		error,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
			dimensions: 'ga:channelGrouping',
			orderby: {
				fieldName: 'ga:users',
				sortOrder: 'DESCENDING',
			},
			limit: 10,
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
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

		return {
			loading: store.isResolving( 'getReport', [ args ] ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
			report: store.getReport( args ),
			reportArgs: args,
		};
	} );

	if ( ! loading && error ) {
		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-12
			">
				<ReportError moduleSlug="analytics" error={ error } />
			</div>
		);
	}

	if ( isZeroReport( report ) ) {
		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-12
			">
				<ReportZero moduleSlug="analytics" />;
			</div>
		);
	}

	if ( ! report ) {
		return null;
	}

	return (
		<Widget
			slug="analyticsAllTraffic"
			noPadding
		>
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-4-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
						{ loading
							? <PreviewBlock width="282px" height="282px" shape="circular" />
							: <AcquisitionPieChart data={ report } args={ reportArgs } source />
						}
					</div>
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-8-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
						{ loading
							? <PreviewTable rows={ 3 } rowHeight={ 50 } />
							: <AcquisitionSources data={ report } args={ reportArgs } />
						}
					</div>
				</div>
			</div>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardAllTrafficWidget );
