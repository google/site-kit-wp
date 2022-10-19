/**
 * `useDashboardType` hook.
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
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import useViewContext from './useViewContext';

export const DASHBOARD_TYPE_MAIN = VIEW_CONTEXT_MAIN_DASHBOARD;
export const DASHBOARD_TYPE_ENTITY = VIEW_CONTEXT_ENTITY_DASHBOARD;

/**
 * Determines dashboard type from the view context.
 *
 * @since 1.45.0
 *
 * @return {string|null} The type of dashboard (either `DASHBOARD_TYPE_MAIN` or `DASHBOARD_TYPE_ENTITY`; `null` if not a Unified Dashboard page).
 */
export default function useDashboardType() {
	const viewContext = useViewContext();

	if (
		viewContext === VIEW_CONTEXT_MAIN_DASHBOARD ||
		viewContext === VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
	) {
		return DASHBOARD_TYPE_MAIN;
	}

	if (
		viewContext === VIEW_CONTEXT_ENTITY_DASHBOARD ||
		viewContext === VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY
	) {
		return DASHBOARD_TYPE_ENTITY;
	}

	return null;
}
