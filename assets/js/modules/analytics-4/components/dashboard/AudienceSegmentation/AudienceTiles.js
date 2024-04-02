/**
 * AudienceTiles component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import AudienceTile from './AudienceTile';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import { Tab, TabBar } from 'googlesitekit-components';
import InfoTooltip from '../../../../../components/InfoTooltip';
import Link from '../../../../../components/Link';

const { useSelect } = Data;

export default function AudienceTiles( { Widget } ) {
	const [ activeTile, setActiveTile ] = useState( 0 );
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	const audienceToolTip = ( audienceName ) => {
		switch ( audienceName ) {
			// TODO: The link must be updated here to the correct support URL once written.
			case 'New visitors':
				return createInterpolateElement(
					sprintf(
						/* translators: %s: is the audience name */
						__(
							'%s are people who visited your site for the first time. Note that under some circumstances it\'s possible for a visitor to be counted in both the "new" and "returning" groups. <link>Learn more</link>',
							'google-site-kit'
						),
						'<strong>New visitors</strong>'
					),
					{
						strong: <strong />,
						link: (
							<Link
								href="https://sitekit.withgoogle.com/documentation/"
								external
							/>
						),
					}
				);
			case 'Returning visitors':
				return createInterpolateElement(
					sprintf(
						/* translators: %s: is the audience name */
						__(
							'%s are people who have visited your site at least once before. Note that under some circumstances it\'s possible for a visitor to be counted in both the "new" and "returning" groups. <link>Learn more</link>',
							'google-site-kit'
						),
						'<strong>Returning visitors</strong>'
					),
					{
						strong: <strong />,
						link: (
							<Link
								href="https://sitekit.withgoogle.com/documentation/"
								external
							/>
						),
					}
				);
			default:
				return createInterpolateElement(
					sprintf(
						/* translators: %s: is the audience name */
						__(
							"%s is an audience that already exists in your Analytics property. Note that it's possible for a visitor to be counted in more than one group. <link>Learn more</link>",
							'google-site-kit'
						),
						<strong>${ audienceName }</strong>
					),
					{
						strong: <strong />,
						link: (
							<Link
								href="https://sitekit.withgoogle.com/documentation/"
								external
							/>
						),
					}
				);
		}
	};

	// An array of audience entity names.
	const configuredAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);
	const audiencesDimensionFilter = {
		filter: {
			fieldName: 'audienceResourceName',
			inListFilter: {
				values: configuredAudiences,
			},
		},
	};
	const audiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAudiences()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilter: audiencesDimensionFilter,
		metrics: [
			{ name: 'totalUsers' },
			{ name: 'sessionsPerUser' },
			{ name: 'screenPageViewsPerSession' },
			{ name: 'screenPageViews' },
		],
	};

	const report = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );

	const { rows = [] } = report || {};

	const totalPageviewsReportOptions = {
		startDate: dates?.startDate,
		endDate: dates?.endDate,
		metrics: [ { name: 'screenPageViews' } ],
	};

	const totalPageviewsReport = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport(
			totalPageviewsReportOptions
		);
	} );

	const totalPageviews =
		totalPageviewsReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value || 0;

	return (
		<Widget className="googlesitekit-widget__audience-tiles">
			{ isTabbedBreakpoint && (
				<TabBar
					className="googlesitekit-widget__audience-tiles-tabs"
					activeIndex={ activeTile }
					handleActiveIndexUpdate={ ( index ) =>
						setActiveTile( index )
					}
				>
					{ audiences.map( ( { displayName }, index ) => {
						const toolTipMessage = audienceToolTip( displayName );

						return (
							<Tab
								key={ `google-sitekit-audience-segment-tab-${ index }` }
								aria-label={ displayName }
							>
								{ displayName }
								<InfoTooltip title={ toolTipMessage } />
							</Tab>
						);
					} ) }
				</TabBar>
			) }
			<div className="googlesitekit-widget__audience-tiles__body">
				{ configuredAudiences.map( ( audienceResourceName, index ) => {
					// Conditionally render only the selected audience tile on mobile.
					if ( isTabbedBreakpoint && index !== activeTile ) {
						return null;
					}

					// On desktop prevent > 3 tiles from rendering.
					if ( ! isTabbedBreakpoint && index > 2 ) {
						return null;
					}

					const metricIndexBase = index * 2;

					const audienceName =
						audiences?.filter(
							( { name } ) => name === audienceResourceName
						)?.[ 0 ]?.displayName || '';

					const toolTipMessage = audienceToolTip( audienceName );

					const visitors =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 0 ]?.value
						) || 0;
					const prevVisitors =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 0 ]
								?.value
						) || 0;

					const visitsPerVisitors =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 1 ]?.value
						) || 0;
					const prevVisitsPerVisitors =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 1 ]
								?.value
						) || 0;

					const pagesPerVisit =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 2 ]?.value
						) || 0;
					const prevPagesPerVisit =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 2 ]
								?.value
						) || 0;

					const pageviews =
						Number(
							rows[ metricIndexBase ]?.metricValues?.[ 3 ]?.value
						) || 0;
					const prevPageviews =
						Number(
							rows[ metricIndexBase + 1 ]?.metricValues?.[ 3 ]
								?.value
						) || 0;

					return (
						<AudienceTile
							key={ audienceResourceName }
							title={ audienceName }
							infoTooltip={ toolTipMessage }
							visitors={ {
								currentValue: visitors,
								previousValue: prevVisitors,
							} }
							visitsPerVisitor={ {
								currentValue: visitsPerVisitors,
								previousValue: prevVisitsPerVisitors,
							} }
							pagesPerVisit={ {
								currentValue: pagesPerVisit,
								previousValue: prevPagesPerVisit,
							} }
							pageviews={ {
								currentValue: pageviews,
								previousValue: prevPageviews,
							} }
							percentageOfTotalPageViews={
								pageviews / totalPageviews
							}
							// TODO: update the top cities and top content queries to use pivot report to get all the required report rows for each audience.
							topCities={ {
								dimensionValues: [
									{
										value: 'Dublin',
									},
									{
										value: 'London',
									},
									{
										value: 'New York',
									},
								],
								metricValues: [
									{
										value: 0.388,
									},
									{
										value: 0.126,
									},
									{
										value: 0.094,
									},
								],
								total: 0.608,
							} }
							topContent={ {
								dimensionValues: [
									{
										value: '/en/test-post-1/',
									},
									{
										value: '/en/test-post-2/',
									},
									{
										value: '/en/test-post-3/',
									},
								],
								metricValues: [
									{
										value: 847,
									},
									{
										value: 596,
									},
									{
										value: 325,
									},
								],
								total: 1768,
							} }
							topContentTitles={ {
								'/en/test-post-1/': 'Test Post 1',
								'/en/test-post-2/': 'Test Post 2',
								'/en/test-post-3/': 'Test Post 3',
							} }
							Widget={ Widget }
						/>
					);
				} ) }
			</div>
		</Widget>
	);
}

AudienceTiles.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
