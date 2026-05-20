/**
 * Site Goals Goal Drivers shared types.
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
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import { GOAL_DRIVER_IDS, GOAL_TYPES } from './constants';

export type GoalDriverID =
	typeof GOAL_DRIVER_IDS[ keyof typeof GOAL_DRIVER_IDS ];
export type GoalType = typeof GOAL_TYPES[ keyof typeof GOAL_TYPES ];
export type GoalDriverSelectionState = Record< GoalType, GoalDriverID[] >;

export interface GoalDriverRow {
	label: string;
	value: string | number;
	pagePath?: string;
	url?: string;
}

export interface GoalDriverComponentProps {
	title?: string;
	rows?: GoalDriverRow[];
	totalRows?: number;
	loading?: boolean;
	error?: unknown;
	limit?: number;
	goalType: GoalType;
	primaryEvent?: string | string[];
	onExpandableRowsChange?: (
		id: GoalDriverID,
		hasExpandableRows: boolean
	) => void;
}

export interface GoalDriverData {
	id: GoalDriverID;
	rows: GoalDriverRow[];
	totalRows: number;
	loading: boolean;
	error?: unknown;
}

export interface GoalDriverContent {
	title: string;
	description: string;
}

export interface GoalDriverCatalogEntry {
	id: GoalDriverID;
	order: number;
	defaultEnabled: boolean;
	copyByGoalType: Partial< Record< GoalType, GoalDriverContent > >;
	Component: ComponentType< GoalDriverComponentProps >;
}

export type GoalDriverCatalog = Record< GoalDriverID, GoalDriverCatalogEntry >;

/**
 * Driver shape consumed by GoalDriverTiles.
 *
 * This can come from registry entries or story/test fixtures, and may also be
 * partially hydrated while filtering unknown/invalid IDs, so metadata props
 * remain optional by design.
 */
export interface GoalDriverTilesDriver {
	id: GoalDriverID;
	title?: string;
	Component?: ComponentType< GoalDriverComponentProps >;
	rows?: GoalDriverRow[];
	totalRows?: number;
	loading?: boolean;
	error?: unknown;
	order?: number;
	defaultEnabled?: boolean;
}
export interface GoalDriverOption {
	id: GoalDriverID;
	order: number;
	title: string;
	description: string;
}
