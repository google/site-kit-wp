/**
 * PopularContentWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { MetricTileTable } from '../../../../components/KeyMetrics';
import Link from '../../../../components/Link';
import { ZeroDataMessage } from '../../../analytics/components/common';
import { getFullURL, numFmt } from '../../../../util';
const { useSelect, useInViewSelect } = Data;

export default function PopularContentWidget( { Widget, WidgetNull } ) {
	const isGA4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'pageTitle', 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: 3,
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
	);

	const loading = useInViewSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	if ( ! isGA4ModuleConnected ) {
		return <WidgetNull />;
	}

	const { rows = [] } = report || {};

	const columns = [
		{
			field: 'dimensionValues',
			Component: ( { fieldValue } ) => {
				const [ title, url ] = fieldValue;
				const permaLink = getFullURL( siteURL, url.value );

				return (
					<Link
						href={ permaLink }
						title={ title.value }
						external
						hideExternalIndicator
					>
						{ title.value }
					</Link>
				);
			},
		},
		{
			field: 'metricValues.0.value',
			Component: ( { fieldValue } ) => (
				<strong>{ numFmt( fieldValue ) }</strong>
			),
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			title={ __(
				'Most popular content by pageviews',
				'google-site-kit'
			) }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			zeroState={ ZeroDataMessage }
		/>
	);
}

PopularContentWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
