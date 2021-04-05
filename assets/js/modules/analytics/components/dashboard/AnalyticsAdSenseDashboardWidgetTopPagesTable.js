/**
 * AnalyticsAdSenseDashboardWidgetTopPagesTable component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { getTimeInSeconds, numFmt } from '../../../../util';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import PreviewTable from '../../../../components/PreviewTable';
import ctaWrapper from '../../../../components/legacy-notifications/cta-wrapper';
import AdSenseLinkCTA from '../common/AdSenseLinkCTA';
import { analyticsAdsenseReportDataDefaults, isDataZeroForReporting } from '../../util';
import { STORE_NAME } from '../../datastore/constants';
import AnalyticsAdSenseDashboardWidgetLayout from './AnalyticsAdSenseDashboardWidgetLayout';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import Link from '../../../../components/Link';
import ReportTable from '../../../../components/ReportTable';
const { useSelect } = Data;

const AnalyticsAdSenseDashboardWidgetTopPagesTable = ( { data } ) => {
	// Do not return zero data callout here since it will already be
	// present on the page from other sources.
	if ( isDataZeroForReporting( data ) ) {
		return null;
	}

	const { rows } = data?.[ 0 ]?.data || {};
	if ( ! Array.isArray( rows ) ) {
		return null;
	}

	return (
		<AnalyticsAdSenseDashboardWidgetLayout>
			<TableOverflowContainer>
				<ReportTable
					rows={ rows }
					columns={ tableColumns }
				/>
			</TableOverflowContainer>
		</AnalyticsAdSenseDashboardWidgetLayout>
	);
};

const tableColumns = [
	{
		title: __( 'Page Title', 'google-site-kit' ),
		description: __( 'Page Title', 'google-site-kit' ),
		primary: true,
		Component: ( { row } ) => {
			const [ title, url ] = row.dimensions;
			const serviceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'content-pages', {
				'explorer-table.plotKeys': '[]',
				'_r.drilldown': `analytics.pagePath:${ url }`,
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
		Component: ( { fieldValue } ) => numFmt(
			fieldValue,
			{
				style: 'decimal',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}
		),
	},
	{
		title: __( 'Page RPM', 'google-site-kit' ),
		description: __( 'Page RPM', 'google-site-kit' ),
		field: 'metrics.0.values.1',
		Component: ( { fieldValue } ) => numFmt(
			fieldValue,
			{
				style: 'decimal',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}
		),
	},
	{
		title: __( 'Impressions', 'google-site-kit' ),
		description: __( 'Impressions', 'google-site-kit' ),
		field: 'metrics.0.values.2',
		Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
	},
];

/**
 * Checks error data response, and handle the INVALID_ARGUMENT specifically.
 *
 * @since 1.0.0
 *
 * @param {Object} data Response data.
 * @return {(string|boolean|null)}  Returns a string with an error message if there is an error. Returns `false` when there is no data and no error message. Will return `null` when arguments are invalid.
 *                            string   data error message if it exists or unidentified error.
 *                            false    if no data and no error message
 *                            null     if invalid argument
 *
 */
const getDataError = ( data ) => {
	if ( data.code && data.message && data.data && data.data.status ) {
		// Specifically looking for string "badRequest"
		if ( 'badRequest' === data.data.reason ) {
			return (
				<AnalyticsAdSenseDashboardWidgetLayout>
					{ ctaWrapper( <AdSenseLinkCTA />, false, false, true ) }
				</AnalyticsAdSenseDashboardWidgetLayout>
			);
		}

		return data.message;
	}

	// Legacy errors? Maybe this is never reached but better be safe than sorry.
	if ( data.error ) {
		if ( data.error.message ) {
			return data.error.message;
		}

		if ( data.error.errors && data.error.errors[ 0 ] && data.error.errors[ 0 ].message ) {
			return data.error.errors[ 0 ].message;
		}

		return __( 'Unidentified error', 'google-site-kit' );
	}

	return false;
};

export default withData(
	AnalyticsAdSenseDashboardWidgetTopPagesTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: analyticsAdsenseReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Single',
		},
	],
	<AnalyticsAdSenseDashboardWidgetLayout>
		<PreviewTable padding />
	</AnalyticsAdSenseDashboardWidgetLayout>,
	{ createGrid: true },
	// Force isDataZero to false since it is handled within the component.
	() => false,
	getDataError
);
