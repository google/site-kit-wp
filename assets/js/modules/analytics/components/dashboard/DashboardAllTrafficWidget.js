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
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import ErrorText from '../../../../components/error-text';
import PreviewBlock from '../../../../components/preview-block';
import PreviewTable from '../../../../components/preview-table';
import AcquisitionPieChart from '../common/AcquisitionPieChart';
import AcquisitionSources from '../common/AcquisitionSources';
const { useSelect } = Data;

function DashboardAllTrafficWidget() {
	const {
		report,
		loading,
		error,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
			dimensions: 'ga:channelGrouping',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Users',
				},
			],
			orderby: {
				fieldName: 'ga:users',
				sortOrder: 'DESCENDING',
			},
			limit: 10,
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
		if ( url ) {
			args.url = url;
		}

		return {
			report: store.getReport( args ),
			loading: store.isResolving( 'getReport', [ args ] ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
		};
	} );

	if ( error ) {
		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				<ErrorText message={ error.message } />
			</div>
		);
	}

	return (
		<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
			<div className="mdc-layout-grid__inner">
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-4-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
					{ loading
						? <PreviewBlock width="282px" height="282px" shape="circular" />
						: <AcquisitionPieChart data={ report } source />
					}
				</div>
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-8-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
					{ loading
						? <PreviewTable rows={ 3 } rowHeight={ 50 } />
						: <AcquisitionSources data={ report } />
					}
				</div>
			</div>
		</div>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardAllTrafficWidget );
