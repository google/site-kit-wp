/**
 * Audience Segmentation utilities.
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
 * Gets the data from various report's rows to be passed to components.
 *
 * @since n.e.x.t
 *
 * @param {Object} param0                            Report rows object.
 * @param {Object} param0.reportRow                  Rows from the report for current date selection.
 * @param {Object} param0.previousReportRow          Comparison rows from the report.
 * @param {Object} param0.topCitiesReportRows        Top cities data rows.
 * @param {Object} param0.topContentReportRows       Top content data rows.
 * @param {Object} param0.topContentTitlesReportRows Top content title data rows.
 * @param {number} param0.totalPageViews             Total page views.
 * @return {Object} Data to be passed to AudienceTile component.
 */
export function getDataFromRows( {
	reportRow,
	previousReportRow,
	topCitiesReportRows,
	topContentReportRows,
	topContentTitlesReportRows,
	totalPageViews,
} ) {
	const visitors = Number( reportRow?.metricValues?.[ 0 ]?.value ) || 0;
	const prevVisitors =
		Number( previousReportRow?.metricValues?.[ 0 ]?.value ) || 0;

	const visitsPerVisitors =
		Number( reportRow?.metricValues?.[ 1 ]?.value ) || 0;
	const prevVisitsPerVisitors =
		Number( previousReportRow?.metricValues?.[ 1 ]?.value ) || 0;

	const pagesPerVisit = Number( reportRow?.metricValues?.[ 2 ]?.value ) || 0;
	const prevPagesPerVisit =
		Number( previousReportRow?.metricValues?.[ 2 ]?.value ) || 0;

	const pageviews = Number( reportRow?.metricValues?.[ 3 ]?.value ) || 0;
	const prevPageviews =
		Number( previousReportRow?.metricValues?.[ 3 ]?.value ) || 0;

	const percentageOfTotalPageViews =
		totalPageViews !== 0 ? pageviews / totalPageViews : 0;

	const topCities = {
		dimensionValues: [
			topCitiesReportRows?.[ 0 ]?.dimensionValues?.[ 0 ]?.value,
			topCitiesReportRows?.[ 1 ]?.dimensionValues?.[ 0 ]?.value,
			topCitiesReportRows?.[ 2 ]?.dimensionValues?.[ 0 ]?.value,
		],
		metricValues: [
			topCitiesReportRows?.[ 0 ]?.metricValues?.[ 0 ]?.value,
			topCitiesReportRows?.[ 1 ]?.metricValues?.[ 0 ]?.value,
			topCitiesReportRows?.[ 2 ]?.metricValues?.[ 0 ]?.value,
		],
		total: visitors,
	};

	const topContent = {
		dimensionValues: [
			topContentReportRows?.[ 0 ]?.dimensionValues?.[ 0 ]?.value,
			topContentReportRows?.[ 1 ]?.dimensionValues?.[ 0 ]?.value,
			topContentReportRows?.[ 2 ]?.dimensionValues?.[ 0 ]?.value,
		],
		metricValues: [
			topContentReportRows?.[ 0 ]?.metricValues?.[ 0 ]?.value,
			topContentReportRows?.[ 1 ]?.metricValues?.[ 0 ]?.value,
			topContentReportRows?.[ 2 ]?.metricValues?.[ 0 ]?.value,
		],
	};

	const topContentTitles = topContentTitlesReportRows?.reduce(
		( acc, row ) => ( {
			...acc,
			[ row.dimensionValues[ 0 ].value ]: row.dimensionValues[ 1 ].value,
		} ),
		{}
	);

	return {
		visitors: {
			currentValue: visitors,
			previousValue: prevVisitors,
		},
		visitsPerVisitor: {
			currentValue: visitsPerVisitors,
			previousValue: prevVisitsPerVisitors,
		},
		pagesPerVisit: {
			currentValue: pagesPerVisit,
			previousValue: prevPagesPerVisit,
		},
		pageviews: {
			currentValue: pageviews,
			previousValue: prevPageviews,
		},
		percentageOfTotalPageViews,
		topCities,
		topContent,
		topContentTitles,
	};
}

/**
 * Gets the rows for the relevant audience from the report.
 *
 * @since n.e.x.t
 *
 * @param {string} audienceResourceName Audience reource name.
 * @param {Object} reportRows           Report rows object.
 * @param {number} index                Index for lookup.
 * @return {Object} Report rows for the relevant audience.
 */
export const collectAudienceRows = (
	audienceResourceName,
	reportRows,
	index = 1
) => {
	if ( ! reportRows ) {
		return [];
	}
	return reportRows.filter( ( row ) => {
		return audienceResourceName === row?.dimensionValues?.[ index ]?.value;
	} );
};
