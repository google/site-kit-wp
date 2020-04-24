/**
 * calculateOverviewData
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import { changeToPercent } from '../../../util';

/**
 * Calculate the report data
 *
 * @param {Array} reports Report data.
 *
 * @return {Object} Report data
 */
const calculateOverviewData = ( reports ) => {
	if ( ! reports || ! reports.length ) {
		return false;
	}

	const { totals } = reports[ 0 ].data;
	const lastMonth = totals[ 0 ].values;
	const previousMonth = totals[ 1 ].values;

	const totalUsers = lastMonth[ 0 ];
	const totalSessions = lastMonth[ 1 ];
	const averageBounceRate = lastMonth[ 2 ];
	const averageSessionDuration = lastMonth[ 3 ];
	const goalCompletions = lastMonth[ 4 ];
	const totalPageViews = lastMonth[ 5 ];
	const totalUsersChange = changeToPercent( previousMonth[ 0 ], lastMonth[ 0 ] );
	const totalSessionsChange = changeToPercent( previousMonth[ 1 ], lastMonth[ 1 ] );
	const averageBounceRateChange = changeToPercent( previousMonth[ 2 ], lastMonth[ 2 ] );
	const averageSessionDurationChange = changeToPercent( previousMonth[ 3 ], lastMonth[ 3 ] );
	const goalCompletionsChange = changeToPercent( previousMonth[ 4 ], lastMonth[ 4 ] );
	const totalPageViewsChange = changeToPercent( previousMonth[ 5 ], lastMonth[ 5 ] );
	return {
		totalUsers,
		totalSessions,
		averageBounceRate,
		averageSessionDuration,
		totalUsersChange,
		totalSessionsChange,
		averageBounceRateChange,
		averageSessionDurationChange,
		goalCompletions,
		goalCompletionsChange,
		totalPageViews,
		totalPageViewsChange,
	};
};

export default calculateOverviewData;
