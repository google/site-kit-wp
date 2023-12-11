/**
 * Geometry related utility functions.
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
 * Checks if one element overlaps another.
 *
 * @since 1.114.0
 *
 * @param {Element} element1 The first element.
 * @param {Element} element2 The second element.
 * @return {boolean} Returns if the first and second elements overlap each other.
 */
export const elementsOverlap = ( element1, element2 ) => {
	const rect1 = element1.getBoundingClientRect();
	const rect2 = element2.getBoundingClientRect();

	if (
		rect1.bottom < rect2.top ||
		rect2.bottom < rect1.top ||
		rect1.right < rect2.left ||
		rect2.right < rect1.left
	) {
		return false;
	}

	return true;
};
