/**
 * DashboardSummaryWidget component.
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
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import ErrorText from '../../../../components/error-text';
const { useSelect } = Data;

function DashboardSummaryWidget() {
	const { error } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
		};

		return {
			report: store.getReport( args ),
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

	return 'DashboardSummaryWidget';
}

export default whenActive( { moduleName: 'adsence' } )( DashboardSummaryWidget );
