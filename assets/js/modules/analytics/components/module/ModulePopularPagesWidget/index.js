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
import { generateDateRangeArgs } from '../../../util/report-date-range-args';
import { isZeroReport } from '../../../util';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import DetailsPermaLinks from '../../../../../components/DetailsPermaLinks';
import ReportTable from '../../../../../components/ReportTable';
import PreviewTable from '../../../../../components/PreviewTable';
import Header from './Header';
import Footer from './Footer';
const { useSelect } = Data;

export default function ModulePopularPagesWidget( {
	Widget,
	WidgetReportError,
	WidgetReportZero,
} ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

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
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	};

	const { report, titles, loaded, error } = useSelect( ( select ) => {
		const data = {
			report: select( MODULES_ANALYTICS ).getReport( args ),
			loaded: false,
			error: select( MODULES_ANALYTICS ).getErrorForSelector(
				'getReport',
				[ args ]
			),
			titles: undefined,
		};
		const reportLoaded = select(
			MODULES_ANALYTICS
		).hasFinishedResolution( 'getReport', [ args ] );
		let hasLoadedPageTitles = true;
		if ( reportLoaded ) {
			const pageTitlesArgs = {
				...dates,
			};
			let pagePaths = [];
			( report?.[ 0 ]?.data?.rows || [] ).forEach( ( { dimensions } ) => {
				pagePaths = pagePaths.concat(
					dimensions.filter( ( url ) => ! pagePaths.includes( url ) )
				);
			} );
			pageTitlesArgs.pagePaths = pagePaths;
			data.titles = select( MODULES_ANALYTICS ).getPageTitles(
				pageTitlesArgs
			);
			hasLoadedPageTitles =
				!! data.titles && !! Object.keys( data.titles ).length;
		}
		data.loaded = reportLoaded && hasLoadedPageTitles;
		return data;
	} );

	if ( ! loaded ) {
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

	if ( isZeroReport( report ) ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportZero moduleSlug="analytics" />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ title, url ] = row.dimensions;
				const serviceURL = useSelect( ( select ) =>
					select( MODULES_ANALYTICS ).getServiceReportURL(
						'content-drilldown',
						{
							'explorer-table.plotKeys': '[]',
							'_r.drilldown': `analytics.pagePath:${ url }`,
							...generateDateRangeArgs( dates ),
						}
					)
				);

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
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
			),
		},
		{
			title: __( 'Unique Pageviews', 'google-site-kit' ),
			description: __( 'Unique Pageviews', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
			),
		},
		{
			title: __( 'Bounce Rate', 'google-site-kit' ),
			description: __( 'Bounce Rate', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.2',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( Number( fieldValue ) / 100, '%' ) }</span>
			),
		},
	];

	const rows = cloneDeep( report[ 0 ].data.rows );
	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensions[ 0 ];
		if ( titles[ url ] ) {
			row.dimensions.unshift( titles[ url ] );
		}
	} );

	return (
		<Widget Header={ Header } Footer={ Footer } noPadding>
			<TableOverflowContainer>
				<ReportTable rows={ rows } columns={ tableColumns } />
			</TableOverflowContainer>
		</Widget>
	);
}

ModulePopularPagesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
};
