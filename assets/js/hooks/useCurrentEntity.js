/**
 * `useCurrentEntity` hook.
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
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import CurrentEntityContext from '../components/CurrentEntityContext';

/**
 * Entity typedef.
 *
 * @since n.e.x.t
 *
 * @typedef {Object} Entity
 * @property {number} id    Entity ID.
 * @property {string} type  Entity type.
 * @property {string} url   Entity URL.
 * @property {string} title Entity title.
 */

/**
 * Gets the current entity.
 *
 * @since n.e.x.t
 *
 * @return {Entity} The current entity.
 */
function useCurrentEntity() {
	return useContext( CurrentEntityContext );
}

export default useCurrentEntity;
