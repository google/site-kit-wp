/**
 * ModulePopularPagesWidget component.
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
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../../datastore/constants';
import { numFmt } from '../../../../../util';
import whenActive from '../../../../../util/when-active';
import { generateDateRangeArgs } from '../../../util/report-date-range-args';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import DetailsPermaLinks from '../../../../../components/DetailsPermaLinks';
import ReportTable from '../../../../../components/ReportTable';
import PreviewTable from '../../../../../components/PreviewTable';
import UACutoffWarning from '../../common/UACutoffWarning';
import { ZeroDataMessage } from '../../common';
import Header from './Header';
import Footer from './Footer';
import useViewOnly from '../../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect } = Data;

function ModulePopularPagesWidget( props ) {
	const { Widget, WidgetReportError } = props;

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const viewOnlyDashboard = useViewOnly();

	const args = {
		...dates,
		dimensions: [ 'ga:pagePath' ],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
			{
				expression: 'ga:uniquePageviews',
				alias: 'Unique Pageviews',
			},
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce rate',
			},
			{
				expression: 'ga:avgSessionDuration',
				alias: 'Session Duration',
			},
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	};

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] )
	);

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	const titles = useInViewSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS ).getPageTitles( report, args )
			: undefined
	);

	const loaded = useSelect( ( select ) => {
		const reportLoaded = select( MODULES_ANALYTICS ).hasFinishedResolution(
			'getReport',
			[ args ]
		);

		return undefined !== error || ( reportLoaded && undefined !== titles );
	} );

	if ( ! loaded || isGatheringData === undefined ) {
		return (
			<Widget Header={ Header } Footer={ Footer } noPadding>
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics" error={ error } />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component( { row } ) {
				const [ title, url ] = row.dimensions;
				const serviceURL = useSelect( ( select ) => {
					if ( viewOnlyDashboard ) {
						return null;
					}

					return select( MODULES_ANALYTICS ).getServiceReportURL(
						'content-drilldown',
						{
							'explorer-table.plotKeys': '[]',
							'_r.drilldown': `analytics.pagePath:${ url }`,
							...generateDateRangeArgs( dates ),
						}
					);
				} );

				return (
					<DetailsPermaLinks
						title={ title }
						path={ url }
						serviceURL={ serviceURL }
					/>
				);
			},
		},
		{
			title: __( 'Pageviews', 'google-site-kit' ),
			description: __( 'Pageviews', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component( { fieldValue } ) {
				return (
					<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			title: __( 'Unique Pageviews', 'google-site-kit' ),
			description: __( 'Unique Pageviews', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.1',
			Component( { fieldValue } ) {
				return (
					<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			title: __( 'Bounce Rate', 'google-site-kit' ),
			description: __( 'Bounce Rate', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.2',
			Component( { fieldValue } ) {
				return (
					<span>{ numFmt( Number( fieldValue ) / 100, '%' ) }</span>
				);
			},
		},
		{
			title: __( 'Session Duration', 'google-site-kit' ),
			description: __( 'Session Duration', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.3',
			Component( { fieldValue } ) {
				return <span>{ numFmt( fieldValue, 's' ) }</span>;
			},
		},
	];

	const rows = report?.[ 0 ]?.data?.rows?.length
		? cloneDeep( report[ 0 ].data.rows )
		: [];
	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensions[ 0 ];
		row.dimensions.unshift( titles[ url ] ); // We always have an entry for titles[url].
	} );

	return (
		<Widget Header={ Header } Footer={ Footer } noPadding>
			<UACutoffWarning />
			<TableOverflowContainer>
				<ReportTable
					rows={ rows }
					columns={ tableColumns }
					zeroState={ ZeroDataMessage }
					gatheringData={ isGatheringData }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

ModulePopularPagesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics' } )(
	ModulePopularPagesWidget
);
