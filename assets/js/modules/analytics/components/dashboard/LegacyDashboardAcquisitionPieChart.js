/**
 * LegacyDashboardAcquisitionPieChart component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { getTimeInSeconds, getURLPath } from '../../../../util';
import GoogleChart from '../../../../components/GoogleChart';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import Link from '../../../../components/Link';
import PreviewBlock from '../../../../components/PreviewBlock';
import {
	extractAnalyticsDataForPieChart,
	getAnalyticsErrorMessageFromData,
	trafficSourcesReportDataDefaults,
	isDataZeroForReporting,
} from '../../util';

const { useSelect } = Data;

const LegacyDashboardAcquisitionPieChart = ( { data, source } ) => {
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	const sourceURI = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'trafficsources-overview', {
		'_r.drilldown': url ? `analytics.pagePath:${ getURLPath( url ) }` : undefined,
	} ) );

	if ( ! data || data.error || ! data.length ) {
		return null;
	}

	const processedData = extractAnalyticsDataForPieChart( data, { keyColumnIndex: 1 } );
	const options = {
		chartArea: {
			width: '100%',
			height: '100%',
		},
		backgroundColor: 'transparent',
		height: 250,
		legend: {
			alignment: 'center',
			textStyle: {
				color: '#5b5b61',
				fontSize: 12,
			},
		},
		slices: {
			0: { color: '#178EC5' },
			1: { color: '#54B23B' },
			2: { color: '#EB5729' },
			3: { color: '#ECED33' },
			4: { color: '#34CBE3' },
			5: { color: '#82E88E' },
		},
		title: null,
		width: '100%',
	};

	return (
		<div className="googlesitekit-chart googlesitekit-chart--pie">
			<GoogleChart
				chartType="PieChart"
				data={ processedData }
				loadingHeight="205px"
				loadingWidth="205px"
				options={ options }
			/>
			{ source &&
				<div className="googlesitekit-chart__source">
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: source link */
							__( 'Source: %s', 'google-site-kit' ),
							`<a>${ _x( 'Analytics', 'Service name', 'google-site-kit' ) }</a>`
						),
						{
							a: <Link
								key="link"
								href={ sourceURI }
								inherit
								external
							/>,
						}
					) }
				</div>
			}
		</div>
	);
};

LegacyDashboardAcquisitionPieChart.defaultProps = {
	source: false,
};

LegacyDashboardAcquisitionPieChart.propTypes = {
	source: PropTypes.bool,
};

export default withData(
	LegacyDashboardAcquisitionPieChart,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...trafficSourcesReportDataDefaults,
				url: global._googlesitekitLegacyData.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Dashboard', 'Single' ],
		},
	],
	<PreviewBlock width="282px" height="282px" shape="circular" />,
	{},
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData
);
