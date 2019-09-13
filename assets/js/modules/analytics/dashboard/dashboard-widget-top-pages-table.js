/**
 * AnalyticsDashboardWidgetTopPagesTable component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import { getTimeInSeconds, numberFormat } from 'GoogleUtil';
import { getDataTableFromData, TableOverflowContainer } from 'GoogleComponents/data-table';
import PreviewTable from 'GoogleComponents/preview-table';
import PropTypes from 'prop-types';
/**
 * Internal dependencies
 */
import { getTopPagesReportDataDefaults } from '../util';

const { __ } = wp.i18n;
const { map } = lodash;
const { Component, Fragment } = wp.element;

class AnalyticsDashboardWidgetTopPagesTable extends Component {
	/**
	 * Add a deep link to Google Analytics Dashboard.
	 *
	 * @param {string} url to be used in the deep link.
	 */
	static addDeepLink( url ) {
		const {
			accountId,
			internalWebPropertyId,
			profileId,
		} = googlesitekit.modules.analytics.settings;

		if ( ! accountId ) {
			return 'https://analytics.google.com/analytics/web/';
		}

		// The pagePath param requires / to be replaced by ~2F.
		return `https://analytics.google.com/analytics/web/#/report/content-drilldown/a${ accountId }w${ internalWebPropertyId }p${ profileId }/explorer-table.plotKeys=%5B%5D&_r.drilldown=analytics.pagePath:${ encodeURIComponent( url.replace( /\//g, '~2F' ) ) }`;
	}

	render() {
		const { data, colspan } = this.props;
		if ( ! data || ! data.length ) {
			return null;
		}

		const headers = [
			{
				title: __( 'Title', 'google-site-kit' ),
				tooltip: __( 'Page Title', 'google-site-kit' ),
			},
			{
				title: __( 'Pageviews', 'google-site-kit' ),
				tooltip: __( 'Pageviews', 'google-site-kit' ),
			},
			{
				title: __( 'Unique Pageviews', 'google-site-kit' ),
				tooltip: __( 'Unique Pageviews', 'google-site-kit' ),
			},
			{
				title: __( 'Bounce Rate', 'google-site-kit' ),
				tooltip: __( 'Bounce Rate', 'google-site-kit' ),
			},
		];

		const links = [];
		const dataMapped = map( data[ 0 ].data.rows, ( row, i ) => {
			const percent = Number( row.metrics[ 0 ].values[ 2 ] );
			const url = row.dimensions[ 0 ];
			const title = row.dimensions[ 1 ];
			links[ i ] = AnalyticsDashboardWidgetTopPagesTable.addDeepLink( url );
			return [
				title,
				numberFormat( row.metrics[ 0 ].values[ 0 ] ),
				numberFormat( row.metrics[ 0 ].values[ 1 ] ),
				<Fragment key={ 'minichart-' + i }><div className="googlesitekit-table__body-item-chart-wrap">{ `${ percent.toFixed( 2 ) }%` }</div></Fragment>,
			];
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
			links,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			<div className={ `mdc-layout-grid__cell mdc-layout-grid__cell--span-${ colspan }` }>
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			</div>

		);
	}
}

AnalyticsDashboardWidgetTopPagesTable.propTypes = {
	data: PropTypes.array,
	colspan: PropTypes.number,
};

AnalyticsDashboardWidgetTopPagesTable.defaultProps = {
	data: null,
	colspan: 12,
};

export default withData(
	AnalyticsDashboardWidgetTopPagesTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: getTopPagesReportDataDefaults(),
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	<PreviewTable padding />,
	{ createGrid: true }
);
