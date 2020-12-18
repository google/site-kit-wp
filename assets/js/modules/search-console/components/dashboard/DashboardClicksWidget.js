/**
 * DashboardClicksWidget component.
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
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import { untrailingslashit, changeToPercent, readableLargeNumber } from '../../../../util';
import { trackEvent } from '../../../../util/tracking';
import { isZeroReport } from '../../util';
import whenActive from '../../../../util/when-active';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/Sparkline';
import PreviewBlock from '../../../../components/PreviewBlock';
import ReportError from '../../../../components/ReportError';
import ReportZero from '../../../../components/ReportZero';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import sumObjectListValue from '../../../../util/sum-object-list-value';

const { useSelect } = Data;

function DashboardClicksWidget() {
	const { data, error, loading, serviceURL } = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const propertyID = store.getPropertyID();
		const url = select( CORE_SITE ).getCurrentEntityURL();
		const isDomainProperty = select( STORE_NAME ).isDomainProperty();
		const referenceSiteURL = untrailingslashit( select( CORE_SITE ).getReferenceSiteURL() );

		const { compareStartDate, endDate } = select( CORE_USER ).getDateRangeDates( { compare: true, offsetDays: DATE_RANGE_OFFSET } );
		const args = {
			dimensions: 'date',
			// Combine both date ranges into one single date range.
			startDate: compareStartDate,
			endDate,
		};
		const serviceBaseURLArgs = {
			resource_id: propertyID,
			num_of_days: getCurrentDateRangeDayCount( args.dateRange ),
		};

		if ( url ) {
			args.url = url;
			serviceBaseURLArgs.page = `!${ url }`;
		} else if ( isDomainProperty && referenceSiteURL ) {
			serviceBaseURLArgs.page = `*${ referenceSiteURL }`;
		}

		return {
			data: store.getReport( args ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
			loading: ! store.hasFinishedResolution( 'getReport', [ args ] ),
			serviceURL: store.getServiceURL( { path: '/performance/search-analytics', query: serviceBaseURLArgs } ),
		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		trackEvent( 'plugin_setup', 'search_console_error', error.message );
		return <ReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <ReportZero moduleSlug="search-console" />;
	}
	// Split the data in two chunks.
	const half = Math.floor( data.length / 2 );
	const latestData = data.slice( half );
	const olderData = data.slice( 0, half );

	const totalClicks = sumObjectListValue( latestData, 'clicks' );
	const totalOlderClicks = sumObjectListValue( olderData, 'clicks' );
	const totalClicksChange = changeToPercent( totalOlderClicks, totalClicks );

	const sparklineData = [
		[
			{ type: 'string', label: 'Day' },
			{ type: 'number', label: 'Clicks' },
		],
		...extractForSparkline( latestData, 'clicks', 'keys.0' ).map( ( row ) => {
			const date = new Date( row[ 0 ] );
			// Sparkline data needs headers and dates formatted as MM/DD
			return [ `${ date.getMonth() + 1 }/${ date.getUTCDate() }`, row[ 1 ] ];
		} ),
	];

	return (
		<div className="mdc-layout-grid__cell mdc-layout-grid__cell--align-bottom mdc-layout-grid__cell--span-2-phone mdc-layout-grid__cell--span-2-tablet mdc-layout-grid__cell--span-3-desktop">
			<DataBlock
				className="overview-total-clicks"
				title={ __( 'Clicks', 'google-site-kit' ) }
				datapoint={ readableLargeNumber( totalClicks ) }
				change={ totalClicksChange }
				changeDataUnit="%"
				source={ {
					name: _x( 'Search Console', 'Service name', 'google-site-kit' ),
					link: serviceURL,
					external: true,
				} }
				sparkline={
					<Sparkline
						data={ sparklineData }
						change={ totalClicksChange }
					/>
				}
			/>
		</div>
	);
}

export default whenActive( { moduleName: 'search-console' } )( DashboardClicksWidget );
