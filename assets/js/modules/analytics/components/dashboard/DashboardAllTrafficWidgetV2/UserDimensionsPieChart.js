/**
 * UserDimensionsPieChart component
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME } from '../../../datastore/constants';
import { extractAnalyticsDataForTrafficChart } from '../../../util';
import GoogleChart from '../../../../../components/GoogleChart';
const { useSelect } = Data;

export default function UserDimensionsPieChart( { dimensionName } ) {
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );

	const args = {
		dateRange,
		metrics: [ { expression: 'ga:users' } ],
		dimensions: [ dimensionName ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 4,
	};

	if ( url ) {
		args.url = url;
	}

	const loaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] ) );
	const report = useSelect( ( select ) => select( STORE_NAME ).getReport( args ) );

	if ( ! loaded ) {
		return null;
	}

	if ( error ) {
		return null;
	}

	const dataMap = extractAnalyticsDataForTrafficChart( report, 0, true );
	const options = {
		chartArea: {
			width: '100%',
			height: '80%',
		},
		backgroundColor: 'transparent',
		height: 250,
		legend: {
			alignment: 'center',
			position: 'bottom',
			textStyle: {
				color: 'black',
				fontSize: 12,
			},
		},
		pieHole: 0.6,
		pieSliceTextStyle: {
			color: 'black',
			fontSize: 12,
		},
		slices: {
			0: { color: '#ffcd33' },
			1: { color: '#c196ff' },
			2: { color: '#9de3fe' },
			3: { color: '#ff7fc6' },
			4: { color: '#ff886b' },
		},
		title: null,
		width: '100%',
	};

	return (
		<GoogleChart
			chartType="pie"
			options={ options }
			data={ dataMap }
			loadHeight={ 205 }
		/>
	);
}

UserDimensionsPieChart.propTypes = {
	dimensionName: PropTypes.string,
};

UserDimensionsPieChart.defaultProps = {
	dimensionName: 'ga:channelGrouping',
};
