/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Analytics 4 report options.
 *
 * @since 1.179.0
 */
export type ReportOptions = {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
	metrics: Array< string | { name: string; expression?: string } >;
	dimensions?: Array< string | { name: string } >;
	dimensionFilters?: Record<
		string,
		string | string[] | { filterType?: string; value?: string | string[] }
	>;
	metricFilters?: Record<
		string,
		string | { filterType?: string; value?: string | number }
	>;
	orderby?: Array< {
		metric?: { metricName: string };
		dimension?: { dimensionName: string };
		desc?: boolean;
	} >;
	url?: string;
	limit?: number;
	reportID?: string;
};

/**
 * A dimension or metric value in a report row.
 *
 * @since 1.179.0
 */
export type DimensionOrMetricValue = {
	value: string;
};

/**
 * A single row in an Analytics 4 report.
 *
 * @since 1.179.0
 */
export type ReportRow = {
	dimensionValues?: DimensionOrMetricValue[];
	metricValues?: DimensionOrMetricValue[];
};

/**
 * Header information for dimensions in a report.
 *
 * @since 1.179.0
 */
export type DimensionHeader = {
	name: string;
};

/**
 * Header information for metrics in a report.
 *
 * @since 1.179.0
 */
export type MetricHeader = {
	name: string;
	type?: string;
};

/**
 * A complete Analytics 4 report response.
 *
 * @since 1.179.0
 */
export type Report = {
	rowCount?: number;
	dimensionHeaders?: DimensionHeader[];
	metricHeaders?: MetricHeader[];
	rows?: ReportRow[];
	totals?: ReportRow[];
	maximums?: ReportRow[];
	minimums?: ReportRow[];
};
