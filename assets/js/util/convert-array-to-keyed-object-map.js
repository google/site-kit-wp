/**
 * `convertArrayListToKeyedObjectMap` utility function.
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
 * Converts an array of objects into an object map containing objects.
 *
 * @since 1.13.0
 *
 * @param {Array}  arrayData   Array data to be converted to an `Object`.
 * @param {string} propertyKey Object property to be used for the property name in the main object.
 * @return {Array} An object containing objects.
 */
export function convertArrayListToKeyedObjectMap( arrayData, propertyKey ) {
	return arrayData.reduce( ( acc, item ) => {
		return { ...acc, [ item[ propertyKey ] ]: item };
	}, {} );
}
