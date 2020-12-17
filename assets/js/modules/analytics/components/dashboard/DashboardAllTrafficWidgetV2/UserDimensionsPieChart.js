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
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME } from '../../../datastore/constants';
import { sanitizeHTML } from '../../../../../util';
import { extractAnalyticsDataForTrafficChart } from '../../../util';
import GoogleChart from '../../../../../components/GoogleChart';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
const { useSelect } = Data;

export default function UserDimensionsPieChart( { dimensionName } ) {
	const [ chartLoaded, setChartLoaded ] = useState( false );
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

	const onReady = useCallback( () => {
		setChartLoaded( true );
	}, [] );

	const loaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] ) );
	const report = useSelect( ( select ) => select( STORE_NAME ).getReport( args ) );

	if ( ! loaded ) {
		return <PreviewBlock width="282px" height="282px" shape="circular" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	const dataMap = extractAnalyticsDataForTrafficChart( report, 0, true );

	const labels = {
		'ga:channelGrouping': __( '<span>By</span> channels', 'google-site-kit' ),
		'ga:country': __( '<span>By</span> locations', 'google-site-kit' ),
		'ga:deviceCategory': __( '<span>By</span> devices', 'google-site-kit' ),
	};

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'span' ],
		ALLOWED_ATTR: [],
	};

	const title = chartLoaded
		? sanitizeHTML( labels[ dimensionName ] || '', sanitizeArgs )
		: { __html: '' };

	return (
		<GoogleChart
			chartType="pie"
			options={ UserDimensionsPieChart.chartOptions }
			data={ dataMap }
			loadHeight={ 205 }
			onReady={ onReady }
		>
			<div
				className="googlesitekit-line-chart__title"
				dangerouslySetInnerHTML={ title }
			/>
		</GoogleChart>
	);
}

UserDimensionsPieChart.propTypes = {
	dimensionName: PropTypes.string.isRequired,
};

UserDimensionsPieChart.defaultProps = {
	dimensionName: 'ga:channelGrouping',
};

UserDimensionsPieChart.chartOptions = {
	chartArea: {
		left: 0,
		height: 300,
		top: 50,
		width: '100%',
	},
	backgroundColor: 'transparent',
	fontName: 'Roboto',
	fontSize: 12,
	height: 410,
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
		fontName: 'Roboto',
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
