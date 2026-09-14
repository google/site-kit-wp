/**
 * CitiesGoalDriver component.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import TableTile from '@/js/modules/analytics-4/components/site-goals/components/TableTile';
import { GOAL_DRIVER_IDS } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import useGoalDriverReport from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useGoalDriverReport';
import {
	buildCitiesReportOptions,
	mapCitiesRows,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/cities';
import { GoalDriverComponentProps } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

const CitiesGoalDriver: FC< GoalDriverComponentProps > = ( props ) => {
	const { title = '', limit } = props;
	const { rows, loading, error, noDataMetricLabel } = useGoalDriverReport( {
		...props,
		id: GOAL_DRIVER_IDS.CITIES,
		buildReportOptions: buildCitiesReportOptions,
		mapRows: mapCitiesRows,
	} );

	return (
		<TableTile
			title={ title }
			rows={ rows }
			loading={ loading }
			error={ error }
			limit={ limit }
			noDataMetricLabel={ noDataMetricLabel }
		/>
	);
};

export default CitiesGoalDriver;
