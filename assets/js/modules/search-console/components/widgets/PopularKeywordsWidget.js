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
import MetricTileTable from '../../../../components/KeyMetrics/MetricTileTable';
import useViewOnly from '../../../../hooks/useViewOnly';

const { useSelect, useInViewSelect } = Data;

export default function PopularKeywordsWidget( props ) {
	const { Widget, WidgetNull } = props;

	const viewOnlyDashboard = useViewOnly();

	const keyMetricsWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isKeyMetricsWidgetHidden()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	// One combined select hook is used to prevent unnecessary selects
	// if the key metrics widget is hidden.
	const [ report, loading ] =
		useInViewSelect( ( select ) => {
			if ( keyMetricsWidgetHidden !== false ) {
				return [];
			}

			const { getReport, hasFinishedResolution } = select(
				MODULES_SEARCH_CONSOLE
			);

			const reportOptions = {
				...dates,
				dimensions: 'query',
				limit: 3,
			};

			return [
				getReport( reportOptions ),
				! hasFinishedResolution( 'getReport', [ reportOptions ] ),
			];
		} ) || [];

	if ( keyMetricsWidgetHidden !== false ) {
		return <WidgetNull />;
	}

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
									query: `!${ fieldValue }`,
								}
						  )
						: null;
				} );

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
						/* translators: %s: click through rate value */
						__( '%s CTR', 'google-site-kit' ),
						numFmt( fieldValue, '%' )
					) }
				</strong>
			),
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			title={ __( 'Top performing keywords', 'google-site-kit' ) }
			loading={ loading }
			rows={ report || [] }
			columns={ columns }
		/>
	);
}

PopularKeywordsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
