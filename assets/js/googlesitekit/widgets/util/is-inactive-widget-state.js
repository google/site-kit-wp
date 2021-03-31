/**
 * Is inactive widget utility.
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
import Null from '../../../components/Null';

/**
 * Combines consecutive widgets with similar states within the same row.
 *
 * @since 1.28.0
 *
 * @param {Object|null} widgetState Widget state (either an object with `Component` and `metadata`, or `null`).
 * @return {boolean} True if widget is inactive, otherwise false.
 */
export function isInactiveWidgetState( widgetState ) {
	return !! widgetState && widgetState.Component === Null;
}
