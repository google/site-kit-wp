/**
 * DashboardPopularKeywordsWidget component.
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
import {
	DATE_RANGE_OFFSET,
	MODULES_SEARCH_CONSOLE,
} from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import { generateDateRangeArgs } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
import { numFmt } from '../../../../util';
import { ZeroDataMessage } from '../common';
import useViewOnly from '../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect } = Data;

export default function DashboardPopularKeywordsWidget( props ) {
	const { Widget, WidgetReportError } = props;

	const viewOnlyDashboard = useViewOnly();

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const dateRangeDates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportArgs = {
		...dateRangeDates,
		dimensions: 'query',
		limit: 10,
	};

	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);
	if ( url ) {
		reportArgs.url = url;
	}

	const data = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs )
	);
	const error = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);
	const loading = useSelect(
		( select ) =>
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ reportArgs ]
			)
	);
	const baseServiceURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}

		return select( MODULES_SEARCH_CONSOLE ).getServiceReportURL( {
			...generateDateRangeArgs( dateRangeDates ),
			page: url ? `!${ url }` : undefined,
		} );
	} );

	function Footer() {
		return (
			<SourceLink
				className="googlesitekit-data-block__source"
				name={ _x(
					'Search Console',
					'Service name',
					'google-site-kit'
				) }
				href={ baseServiceURL }
				external
			/>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportError
					moduleSlug="search-console"
					error={ error }
				/>
			</Widget>
		);
	}

	if ( loading || isGatheringData === undefined ) {
		return (
			<Widget noPadding Footer={ Footer }>
				<PreviewTable padding />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: url
				? __( 'Top search queries for your page', 'google-site-kit' )
				: __( 'Top search queries for your site', 'google-site-kit' ),
			description: __(
				'Most searched for keywords related to your content',
				'google-site-kit'
			),
			primary: true,
			field: 'keys.0',
			Component( { fieldValue } ) {
				const searchAnalyticsURL = useSelect( ( select ) => {
					if ( viewOnlyDashboard ) {
						return null;
					}
					const dates = select( CORE_USER ).getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );
					const entityURL = select( CORE_SITE ).getCurrentEntityURL();
					return select( MODULES_SEARCH_CONSOLE ).getServiceReportURL(
						{
							...generateDateRangeArgs( dates ),
							query: `!${ fieldValue }`,
							page: entityURL ? `!${ entityURL }` : undefined,
						}
					);
				} );

				if ( viewOnlyDashboard ) {
					return <span>{ fieldValue }</span>;
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
			title: __( 'Clicks', 'google-site-kit' ),
			description: __(
				'Number of times users clicked on your content in search results',
				'google-site-kit'
			),
			Component( { row } ) {
				return (
					<span>{ numFmt( row.clicks, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			description: __(
				'Counted each time your content appears in search results',
				'google-site-kit'
			),
			Component( { row } ) {
				return (
					<span>
						{ numFmt( row.impressions, { style: 'decimal' } ) }
					</span>
				);
			},
		},
	];

	return (
		<Widget noPadding Footer={ Footer }>
			<TableOverflowContainer>
				<ReportTable
					rows={ data }
					columns={ tableColumns }
					zeroState={ ZeroDataMessage }
					gatheringData={ isGatheringData }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}
