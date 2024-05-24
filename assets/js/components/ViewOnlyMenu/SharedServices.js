/**
 * ViewOnlyMenu > SharedServices component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import Service from './Service';

export default function SharedServices() {
	const viewableModules = useSelect( ( select ) =>
		select( CORE_USER ).getViewableModules()
	);

	if ( viewableModules === undefined ) {
		return null;
	}

	return (
		<li className="googlesitekit-view-only-menu__list-item">
			<h4>{ __( 'Shared services', 'google-site-kit' ) }</h4>
			<ul>
				{ viewableModules.map( ( moduleSlug ) => (
					<Service key={ moduleSlug } module={ moduleSlug } />
				) ) }
			</ul>
		</li>
	);
}
