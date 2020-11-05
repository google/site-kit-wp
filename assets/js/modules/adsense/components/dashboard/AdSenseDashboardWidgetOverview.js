/**
 * AdSenseDashboardWidgetOverview component.
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
// import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { Grid, Row } from '../../../../material-components';
import PreviewBlock from '../../../../components/PreviewBlock';
import getDataErrorComponent from '../../../../components/notifications/data-error';
const { useSelect } = Data;

export default function AdSenseDashboardWidgetOverview() {
	const {
		// currentRangeData,
		currentRangeError,
		currentRangeLoading,
	} = useSelect( ( select ) => {
		const {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} = select( CORE_USER ).getDateRangeDates( { compare: true } );

		const metrics = [
			'EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		];

		const currentRangeArgs = {
			metrics,
			startDate,
			endDate,
		};

		const prevRangeArgs = {
			metrics,
			startDate: compareStartDate,
			endDate: compareEndDate,
		};

		return {
			currentRangeData: select( STORE_NAME ).getReport( currentRangeArgs ),
			currentRangeLoading: select( STORE_NAME ).isResolving( 'getReport', [ currentRangeArgs ] ),
			currentRangeError: select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ),
			prevRangeData: select( STORE_NAME ).getReport( prevRangeArgs ),
			prevRangeLoading: select( STORE_NAME ).isResolving( 'getReport', [ prevRangeArgs ] ),
			prevRangeError: select( STORE_NAME ).getErrorForSelector( 'getReport', [ prevRangeArgs ] ),
		};
	} );

	if ( currentRangeLoading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( currentRangeError ) {
		return getDataErrorComponent( 'adsense', currentRangeError.message, false, false, false, currentRangeError );
	}

	return (
		<Grid>
			<Row>
				AdSenseDashboardWidgetOverview
			</Row>
		</Grid>
	);
}
