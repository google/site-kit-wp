/**
 * ModulePopularKeywordsWidget component.
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
	MODULES_SEARCH_CONSOLE,
	DATE_RANGE_OFFSET,
} from '../../../datastore/constants';
import { numFmt } from '../../../../../util';
import { isZeroReport, generateDateRangeArgs } from '../../../util';
import PreviewTable from '../../../../../components/PreviewTable';
import Link from '../../../../../components/Link';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import ReportTable from '../../../../../components/ReportTable';
import { ZeroDataMessage } from '../../common';
import { useFeature } from '../../../../../hooks/useFeature';
import Header from './Header';
import Footer from './Footer';
const { useSelect, useInViewSelect } = Data;

export default function ModulePopularKeywordsWidget( props ) {
	const { Widget, WidgetReportZero, WidgetReportError } = props;

	const zeroDataStates = useFeature( 'zeroDataStates' );

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportArgs = {
		startDate,
		endDate,
		dimensions: 'query',
		limit: 10,
	};

	const { isLoading, error } = useSelect( ( select ) => {
		return {
			isLoading: ! select(
				MODULES_SEARCH_CONSOLE
			).hasFinishedResolution( 'getReport', [ reportArgs ] ),
			error: select(
				MODULES_SEARCH_CONSOLE
			).getErrorForSelector( 'getReport', [ reportArgs ] ),
		};
	} );

	const data = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs )
	);

	if ( isLoading || isGatheringData === undefined ) {
		return (
			<Widget noPadding Header={ Header } Footer={ Footer }>
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportError
					moduleSlug="search-console"
					error={ error }
				/>
			</Widget>
		);
	}

	if ( ! zeroDataStates && isGatheringData && isZeroReport( data ) ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportZero moduleSlug="search-console" />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: __( 'Keyword', 'google-site-kit' ),
			description: __(
				'Most searched for keywords related to your content',
				'google-site-kit'
			),
			primary: true,
			field: 'keys.0',
			Component: ( { fieldValue } ) => {
				const searchAnalyticsURL = useSelect( ( select ) => {
					return select( MODULES_SEARCH_CONSOLE ).getServiceReportURL(
						{
							...generateDateRangeArgs( { startDate, endDate } ),
							query: `!${ fieldValue }`,
						}
					);
				} );

				return (
					<Link href={ searchAnalyticsURL } external>
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
			Component: ( { row } ) => (
				<span>{ numFmt( row.clicks, { style: 'decimal' } ) }</span>
			),
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			description: __(
				'Counted each time your content appears in search results',
				'google-site-kit'
			),
			Component: ( { row } ) => (
				<span>{ numFmt( row.impressions, { style: 'decimal' } ) }</span>
			),
		},
	];

	return (
		<Widget noPadding Header={ Header } Footer={ Footer }>
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

ModulePopularKeywordsWidget.propTypes = {
	Widget: PropTypes.func.isRequired,
	WidgetReportZero: PropTypes.func.isRequired,
	WidgetReportError: PropTypes.func.isRequired,
};
