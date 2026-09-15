/**
 * Shared MetricTileTable columns for the "Selling products" goal driver tile widgets.
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
 * Internal dependencies
 */
import { MetricTileTablePlainText } from '@/js/components/KeyMetrics';

export interface GoalDriverTileColumnProps {
	row: Record< string, unknown >;
	fieldValue?: unknown;
}

/**
 * The `value` column shared by every "Selling products" list tile, including
 * `TopPagesDrivingSalesWidget` (whose `label` column links to the page's
 * Analytics report instead of rendering plain text, so it isn't shared here).
 *
 * @since n.e.x.t
 */
export const goalDriverValueColumn = {
	field: 'value',
	Component( { fieldValue }: GoalDriverTileColumnProps ) {
		return <strong>{ fieldValue as string }</strong>;
	},
};

/**
 * The `label`/`value` column pair shared by every "Selling products" list
 * tile except `TopPagesDrivingSalesWidget`.
 *
 * @since n.e.x.t
 */
export const goalDriverTileColumns = [
	{
		field: 'label',
		Component( { fieldValue }: GoalDriverTileColumnProps ) {
			return (
				<MetricTileTablePlainText content={ fieldValue as string } />
			);
		},
	},
	goalDriverValueColumn,
];
