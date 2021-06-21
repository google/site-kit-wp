/**
 * Widgets layout constants.
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
import { WIDGET_WIDTHS } from '../datastore/constants';
import ReportZero from '../../../components/ReportZero';
import CompleteModuleActivationCTA from '../../../components/CompleteModuleActivationCTA';
import ActivateModuleCTA from '../../../components/ActivateModuleCTA';

export const WIDTH_GRID_COUNTER_MAP = {
	[ WIDGET_WIDTHS.QUARTER ]: 3,
	[ WIDGET_WIDTHS.HALF ]: 6,
	[ WIDGET_WIDTHS.FULL ]: 12,
};

export const HIDDEN_CLASS = 'googlesitekit-hidden';
export const SPECIAL_WIDGET_STATES = [
	ActivateModuleCTA,
	CompleteModuleActivationCTA,
	ReportZero,
];
