/**
 * LegacyAdSenseDashboardWidgetTopPagesTableSmall component.
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
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { MODULES_ADSENSE } from '../../../adsense/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import PreviewTable from '../../../../components/PreviewTable';
import Layout from '../../../../components/layout/Layout';
import AdSenseLinkCTA from '../common/AdSenseLinkCTA';
import {
	analyticsAdsenseReportDataDefaults,
	isDataZeroForReporting,
} from '../../util';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import { getTimeInSeconds, numFmt } from '../../../../util';
import { getCurrencyFormat } from '../../../adsense/util/currency';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
const { useSelect } = Data;

function renderLayout( component ) {
	return (
		<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-6-desktop
				mdc-layout-grid__cell--span-4-tablet
			">
			<Layout
				className="googlesitekit-top-earnings-pages"
				footer
				footerCTALabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
				footerCTALink="http://analytics.google.com"
				fill
			>
				{ component }
			</Layout>
		</div>
	);
}

const LegacyAdSenseDashboardWidgetTopPagesTableSmall = ( { data } ) => {
	const currencyFormat = useSelect( ( select ) => {
		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const adsenseData = select( MODULES_ADSENSE ).getReport( {
			startDate,
			endDate,
			metrics: 'TOTAL_EARNINGS',
		} );

		return getCurrencyFormat( adsenseData );
	} );

	if ( ! data || ! data.length ) {
		return null;
	}
	const { rows } = data?.[ 0 ]?.data || {};
	if ( ! Array.isArray( rows ) ) {
		return null;
	}

	const tableColumns = [
		{
			title: __( 'Top Earning Pages', 'google-site-kit' ),
			tooltip: __( 'Top Earning Pages', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ title, url ] = row.dimensions;
				const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
					offsetDays: DATE_RANGE_OFFSET,
				} ) );
				const serviceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'content-pages', {
					'explorer-table.plotKeys': '[]',
					'_r.drilldown': `analytics.pagePath:${ url }`,
					...generateDateRangeArgs( dateRange ),
				} ) );
				return (
					<Link
						href={ serviceURL }
						external
						inherit
					>
						{ title }
					</Link>
				);
			},
		},
		{
			title: __( 'Earnings', 'google-site-kit' ),
			description: __( 'Earnings', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, currencyFormat ) }
				</span>
			),
		},
	];

	// Before ReportTable, this originally used
	// the DataTable's `cap` prop
	const firstFiveRows = rows.slice( 0, 5 );

	return renderLayout(
		<TableOverflowContainer>
			<ReportTable
				rows={ firstFiveRows }
				columns={ tableColumns }
			/>
		</TableOverflowContainer>
	);
};

/**
 * Checks error data response.
 *
 * @since 1.0.0
 *
 * @param {Object} data Response error data.
 * @return {(HTMLElement|null)} Returns HTML element markup with error message if it exists.
 */
const getDataError = ( data ) => {
	if ( data.code && data.message && data.data && data.data.status ) {
		// Specifically looking for string "badRequest"
		if ( 'badRequest' === data.data.reason ) {
			return (
				<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--span-6-desktop
						mdc-layout-grid__cell--span-4-tablet
					">
					<Layout
						className="googlesitekit-top-earnings-pages"
						fill
					>
						<AdSenseLinkCTA />
					</Layout>
				</div>
			);
		}

		return data.message;
	}

	// Legacy errors? Maybe this is never reached but better be safe than sorry.
	if ( data && data.errors ) {
		const errors = Object.values( data.errors );
		if ( errors[ 0 ] && errors[ 0 ][ 0 ] ) {
			return errors[ 0 ][ 0 ];
		}
	}

	// No error.
	return false;
};

export default withData(
	LegacyAdSenseDashboardWidgetTopPagesTableSmall,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: analyticsAdsenseReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		},
	],
	renderLayout(
		<PreviewTable rows={ 5 } padding />
	),
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroForReporting,
	getDataError,
);
