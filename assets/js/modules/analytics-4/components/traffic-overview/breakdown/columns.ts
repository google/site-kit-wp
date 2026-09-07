/**
 * Traffic Overview breakdown columns.
 *
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BreakdownReportDescriptor,
	CHANNELS_BREAKDOWN_REPORT_ID,
	DEVICES_BREAKDOWN_REPORT_ID,
	LOCATIONS_BREAKDOWN_REPORT_ID,
} from '@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/reportOptions';

export interface TrafficBreakdownColumnDescriptor
	extends BreakdownReportDescriptor {
	/** The key for this column's report in the `breakdownReports` map, such as `channels`. */
	id: string;
	/** The column's heading, which also names it for a screen reader. */
	heading: string;
}

/** The breakdown columns the Traffic Overview panel shows, in the order given. */
export const TRAFFIC_BREAKDOWN_COLUMNS: TrafficBreakdownColumnDescriptor[] = [
	{
		id: 'channels',
		heading: __( 'Visitors by channels', 'google-site-kit' ),
		dimensionName: 'sessionDefaultChannelGrouping',
		reportID: CHANNELS_BREAKDOWN_REPORT_ID,
	},
	{
		id: 'locations',
		heading: __( 'Visitors by locations', 'google-site-kit' ),
		dimensionName: 'country',
		reportID: LOCATIONS_BREAKDOWN_REPORT_ID,
	},
	{
		id: 'devices',
		heading: __( 'Visitors by devices', 'google-site-kit' ),
		dimensionName: 'deviceCategory',
		reportID: DEVICES_BREAKDOWN_REPORT_ID,
	},
];
