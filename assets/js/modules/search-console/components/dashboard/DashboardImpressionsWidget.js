/**
 * DashboardImpressionsWidget component.
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
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { changeToPercent, readableLargeNumber, untrailingslashit } from '../../../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import { trackEvent } from '../../../../util/tracking';
import whenActive from '../../../../util/when-active';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/Sparkline';
import PreviewBlock from '../../../../components/PreviewBlock';
import ReportError from '../../../../components/ReportError';
import ReportZero from '../../../../components/ReportZero';
import sumObjectListValue from '../../../../util/sum-object-list-value';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';

const { useSelect } = Data;

function DashboardImpressionsWidget() {
	const { data, error, loading, serviceURL } = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const propertyID = store.getPropertyID();
		const url = select( CORE_SITE ).getCurrentEntityURL();
		const isDomainProperty = select( STORE_NAME ).isDomainProperty();
		const referenceSiteURL = untrailingslashit( select( CORE_SITE ).getReferenceSiteURL() );

		const args = {
			dimensions: 'date',
			compareDateRanges: true,
			dateRange: select( CORE_USER ).getDateRange(),
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
			loading: store.isResolving( 'getReport', [ args ] ),
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

	if ( ! data || ! data.length ) {
		return <ReportZero moduleSlug="search-console" />;
	}

	// Split the data in two chunks.
	const half = Math.floor( data.length / 2 );
	const latestData = data.slice( half );
	const olderData = data.slice( 0, half );

	const totalImpressions = sumObjectListValue( latestData, 'impressions' );
	const totalOlderImpressions = sumObjectListValue( olderData, 'impressions' );
	const totalImpressionsChange = changeToPercent( totalOlderImpressions, totalImpressions );

	const sparklineData = [
		[
			{ type: 'string', label: 'Day' },
			{ type: 'number', label: 'Clicks' },
		],
		...extractForSparkline( latestData, 'impressions', 'keys.0' ).map( ( row ) => {
			const date = new Date( row[ 0 ] );
			// Sparkline data needs headers and dates formatted as MM/DD
			return [ date.getMonth() + 1 + '/' + date.getUTCDate(), row[ 1 ] ];
		} ),
	];

	return (
		<div className="mdc-layout-grid__cell mdc-layout-grid__cell--align-bottom mdc-layout-grid__cell--span-2-phone mdc-layout-grid__cell--span-2-tablet mdc-layout-grid__cell--span-3-desktop">
			<DataBlock
				className="overview-total-impressions"
				title={ __( 'Impressions', 'google-site-kit' ) }
				datapoint={ readableLargeNumber( totalImpressions ) }
				change={ totalImpressionsChange }
				changeDataUnit="%"
				source={ {
					name: _x( 'Search Console', 'Service name', 'google-site-kit' ),
					link: serviceURL,
					external: true,
				} }
				sparkline={
					<Sparkline
						data={ sparklineData }
						change={ totalImpressionsChange }
					/>
				}
			/>
		</div>
	);
}

export default whenActive( { moduleName: 'search-console' } )( DashboardImpressionsWidget );
