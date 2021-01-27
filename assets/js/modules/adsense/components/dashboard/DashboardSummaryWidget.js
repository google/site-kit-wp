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
import Widgets from 'googlesitekit-widgets';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { isZeroReport, reduceAdSenseData } from '../../util';
import { getSiteKitAdminURL } from '../../../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import ReportError from '../../../../components/ReportError';
import { getDateString } from '../../../../googlesitekit/datastore/user/utils/get-date-string';

const { useSelect } = Data;
const { Widget } = Widgets.components;

function DashboardSummaryWidget( { WidgetReportZero } ) {
	const {
		error,
		loading,
		today,
		period,
		daily,
	} = useSelect( ( select ) => {
		const metrics = [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ];

		const referenceDate = select( CORE_USER ).getReferenceDate();

		const todayArgs = {
			startDate: referenceDate,
			endDate: referenceDate,
			metrics,
		};

		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const periodArgs = {
			startDate,
			endDate,
			metrics,
		};

		// Get the first day of the month as an ISO 8601 date string without the time.
		const startOfMonth = getDateString( new Date(
			new Date( referenceDate ).getFullYear(),
			new Date( referenceDate ).getMonth(),
			1
		) );

		const dailyArgs = {
			startDate: startOfMonth,
			endDate: referenceDate,
			metrics,
			dimensions: [ 'DATE' ],
		};

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
		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="276px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="adsense" error={ error } />;
	}

	if ( isZeroReport( today ) && isZeroReport( period ) && isZeroReport( daily ) ) {
		return <WidgetReportZero moduleSlug="adsense" />;
	}

	const processedData = reduceAdSenseData( daily.rows );
	const href = getSiteKitAdminURL( 'googlesitekit-module-adsense', {} );

	const currencyHeader = period.headers.find( ( header ) => null !== header.currency && 0 < header.currency.length );
	const currencyCode = currencyHeader ? currencyHeader.currency : false;

	return (
		<Widget
			slug="adsenseSummary"
			className="googlesitekit-dashboard-adsense-stats mdc-layout-grid"
		>
			<div className="mdc-layout-grid__inner">
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					<DataBlock
						className="overview-adsense-rpm"
						title={ __( 'RPM', 'google-site-kit' ) }
						datapoint={ period.totals[ 1 ] }
						datapointUnit={ currencyCode }
						source={ {
							name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
							link: href,
						} }
						sparkline={ daily &&
							<Sparkline
								data={ extractForSparkline( processedData.dataMap, 2 ) }
								change={ 1 }
								loadSmall={ false }
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
							link: href,
						} }
						change={ today.totals[ 0 ] }
						changeDataUnit={ currencyCode }
						sparkline={ daily &&
							<Sparkline
								data={ extractForSparkline( processedData.dataMap, 1 ) }
								change={ 1 }
								loadSmall={ false }
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
							link: href,
						} }
						sparkline={ daily &&
							<Sparkline
								data={ extractForSparkline( processedData.dataMap, 3 ) }
								change={ 1 }
								loadSmall={ false }
							/>
						}
						context="compact"
					/>
				</div>
			</div>
		</Widget>
	);
}

// export default DashboardSummaryWidget;
export default whenActive( { moduleName: 'adsense' } )( DashboardSummaryWidget );
