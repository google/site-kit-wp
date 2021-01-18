/**
 * DashboardAllTrafficWidget component.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import { calculateChange } from '../../../../util';
import { getURLPath } from '../../../../util/getURLPath';
import ReportError from '../../../../components/ReportError';
import parseDimensionStringToDate from '../../util/parseDimensionStringToDate';
import { isZeroReport } from '../../util';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

function DashboardBounceRateWidget( { WidgetReportZero } ) {
	const {
		data,
		error,
		loading,
		serviceURL,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const {
			compareStartDate,
			compareEndDate,
			startDate,
			endDate,
		} = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
			weekdayAlign: true,
		} );

		const args = {
			compareStartDate,
			compareEndDate,
			startDate,
			endDate,
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:bounceRate',
					alias: 'Bounce Rate',
				},
			],
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
		if ( url ) {
			args.url = url;
		}
		return {
			data: store.getReport( args ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
			loading: ! store.hasFinishedResolution( 'getReport', [ args ] ),
			serviceURL: store.getServiceReportURL( 'visitors-overview', {
				'_r.drilldown': url ? `analytics.pagePath:${ getURLPath( url ) }` : undefined,
				...generateDateRangeArgs( { startDate, endDate, compareStartDate, compareEndDate } ),
			} ),
		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const sparkLineData = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Bounce Rate' },
		],
	];

	const dataRows = data[ 0 ].data.rows;
	// We only want half the date range, having `multiDateRange` in the query doubles the range.
	for ( let i = Math.ceil( dataRows.length / 2 ); i < dataRows.length; i++ ) {
		const { values } = dataRows[ i ].metrics[ 0 ];
		const dateString = dataRows[ i ].dimensions[ 0 ];
		const date = parseDimensionStringToDate( dateString );
		sparkLineData.push( [
			date,
			values[ 0 ],
		] );
	}

	const { totals } = data[ 0 ].data;
	const bounceRate = totals[ 0 ].values[ 0 ] / 100.0;
	const previousBounceRate = totals[ 1 ].values[ 0 ] / 100.0;
	const bounceRateChange = calculateChange( previousBounceRate, bounceRate );

	return (
		<DataBlock
			className="overview-bounce-rate"
			title={ __( 'Bounce Rate', 'google-site-kit' ) }
			datapoint={ bounceRate }
			datapointUnit="%"
			change={ bounceRateChange }
			changeDataUnit="%"
			invertChangeColor
			source={ {
				name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
				link: serviceURL,
				external: true,
			} }
			sparkline={
				sparkLineData &&
					<Sparkline
						data={ sparkLineData }
						change={ bounceRateChange }
					/>
			}
		/>
	);
}

export default whenActive( {
	moduleName: 'analytics',
	FallbackComponent: ( { WidgetActivateModuleCTA } ) => <WidgetActivateModuleCTA moduleSlug="analytics" />,
	IncompleteComponent: ( { WidgetCompleteModuleActivationCTA } ) => <WidgetCompleteModuleActivationCTA moduleSlug="analytics" />,
} )( DashboardBounceRateWidget );
