/**
 * PopularKeywordsWidget component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_SEARCH_CONSOLE,
} from '../../datastore/constants';
import { generateDateRangeArgs } from '../../util';
import { numFmt } from '../../../../util';
import Link from '../../../../components/Link';
import useViewOnly from '../../../../hooks/useViewOnly';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import { ZeroDataMessage } from '../common';

const { useSelect, useInViewSelect } = Data;

export default function PopularKeywordsWidget( { Widget } ) {
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: 'query',
		limit: 100,
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getReport( reportOptions )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
			reportOptions,
		] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const keywordsDateRangeArgs = generateDateRangeArgs( dates );

	const columns = [
		{
			field: 'keys.0',
			Component: ( { fieldValue } ) => {
				const searchAnalyticsURL = useSelect( ( select ) => {
					return ! viewOnlyDashboard
						? select( MODULES_SEARCH_CONSOLE ).getServiceReportURL(
								{
									...keywordsDateRangeArgs,
									// The exclamation mark at the beginning of the query specifies that the term
									// should be treated as an exact match on the SC search results page.
									query: `!${ fieldValue }`,
								}
						  )
						: null;
				} );

				if ( viewOnlyDashboard ) {
					return <MetricTileTablePlainText content={ fieldValue } />;
				}

				return (
					<Link
						href={ searchAnalyticsURL }
						external
						hideExternalIndicator
					>
						{ fieldValue }
					</Link>
				);
			},
		},
		{
			field: 'ctr',
			Component: ( { fieldValue } ) => (
				<strong>
					{ sprintf(
						/* translators: %s: clickthrough rate value */
						__( '%s CTR', 'google-site-kit' ),
						numFmt( fieldValue, '%' )
					) }
				</strong>
			),
		},
	];

	const rows = ( report || [] ).sort(
		( { ctr: ctrA = 0 }, { ctr: ctrB = 0 } ) => ctrB - ctrA
	);

	return (
		<MetricTileTable
			Widget={ Widget }
			title={ __( 'Top performing keywords', 'google-site-kit' ) }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			limit={ 3 }
			error={ error }
			moduleSlug="search-console"
		/>
	);
}

PopularKeywordsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
