/**
 * Negation utils.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Negates a defined value.
 *
 * @since 1.99.0
 *
 * @param {*} value The value to negate.
 * @return {(boolean|undefined)} The negated value, if defined.
 */
export function negateDefined( value ) {
	if ( value === undefined ) {
		return undefined;
	}

	return ! value;
}
