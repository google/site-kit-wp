/**
 * DashboardSummaryWidget component.
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
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { isZeroReport, reduceAdSenseData } from '../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

function DashboardSummaryWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		error,
		loading,
		today,
		period,
		daily,
		rpmReportURL,
		earningsURL,
		impressionsURL,
	} = useSelect( ( select ) => {
		const referenceDate = select( CORE_USER ).getReferenceDate();
		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const periodArgs = {
			startDate,
			endDate,
			metrics: [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ],
		};

		const todayArgs = {
			...periodArgs,
			startDate: referenceDate,
			endDate: referenceDate,
		};

		const dailyArgs = {
			...periodArgs,
			dimensions: [ 'DATE' ],
		};

		const dateRangeArgs = generateDateRangeArgs( { startDate, endDate } );

		return {
			today: select( STORE_NAME ).getReport( todayArgs ),
			period: select( STORE_NAME ).getReport( periodArgs ),
			daily: select( STORE_NAME ).getReport( dailyArgs ),
			loading: ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ todayArgs ] ) ||
				! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ periodArgs ] ) ||
				! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ dailyArgs ] ),
			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ todayArgs ] ) ||
				select( STORE_NAME ).getErrorForSelector( 'getReport', [ periodArgs ] ) ||
				select( STORE_NAME ).getErrorForSelector( 'getReport', [ dailyArgs ] ),
			rpmReportURL: select( STORE_NAME ).getServiceReportURL( {
				...dateRangeArgs,
				gm: 'pageViewsRpm',
			} ),
			earningsURL: select( STORE_NAME ).getServiceReportURL( {
				...dateRangeArgs,
				gm: 'earnings',
			} ),
			impressionsURL: select( STORE_NAME ).getServiceReportURL( {
				...dateRangeArgs,
				gm: 'monetizableImpressions',
			} ),
		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="276px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="adsense" error={ error } />;
	}

	if ( isZeroReport( today ) && isZeroReport( period ) && isZeroReport( daily ) ) {
		return <WidgetReportZero moduleSlug="adsense" />;
	}

	const processedData = reduceAdSenseData( daily.rows );

	const currencyHeader = period.headers.find( ( header ) => null !== header.currency && 0 < header.currency.length );
	const currencyCode = currencyHeader ? currencyHeader.currency : false;

	return (
		<Widget className="googlesitekit-dashboard-adsense-stats mdc-layout-grid">
			<div className="mdc-layout-grid__inner">
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					<DataBlock
						className="overview-adsense-rpm"
						title={ __( 'RPM', 'google-site-kit' ) }
						datapoint={ period.totals[ 1 ] }
						datapointUnit={ currencyCode }
						source={ {
							name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
							link: rpmReportURL,
							external: true,
						} }
						sparkline={ daily &&
							<Sparkline
								data={ extractForSparkline( processedData.dataMap, 2 ) }
								change={ 1 }
							/>
						}
						context="compact"
					/>
				</div>

				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					<DataBlock
						className="overview-adsense-earnings"
						title={ __( 'Total Earnings', 'google-site-kit' ) }
						datapoint={ period.totals[ 0 ] }
						datapointUnit={ currencyCode }
						source={ {
							name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
							link: earningsURL,
							external: true,
						} }
						change={ today.totals[ 0 ] }
						changeDataUnit={ currencyCode }
						sparkline={ daily &&
							<Sparkline
								data={ extractForSparkline( processedData.dataMap, 1 ) }
								change={ 1 }
							/>
						}
						context="compact"
					/>
				</div>

				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					<DataBlock
						className="overview-adsense-impressions"
						title={ __( 'Ad Impressions', 'google-site-kit' ) }
						datapoint={ period.totals[ 2 ] }
						source={ {
							name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
							link: impressionsURL,
							external: true,
						} }
						sparkline={ daily &&
							<Sparkline
								data={ extractForSparkline( processedData.dataMap, 3 ) }
								change={ 1 }
							/>
						}
						context="compact"
					/>
				</div>
			</div>
		</Widget>
	);
}

export default whenActive( { moduleName: 'adsense' } )( DashboardSummaryWidget );
