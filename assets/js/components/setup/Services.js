/**
 * Services component.
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
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

export default function Services() {
	const services = useSelect( ( select ) => {
		const viewableModules = select( CORE_USER ).getViewableModules();

		if ( viewableModules === undefined ) {
			return undefined;
		}

		return viewableModules
			.map( ( moduleSlug ) => {
				const module = select( CORE_MODULES ).getModule( moduleSlug );

				if ( ! module ) {
					return null;
				}

				const Icon = select( CORE_MODULES ).getModuleIcon( moduleSlug );

				return {
					slug: moduleSlug,
					name: module.name,
					order: module.order,
					Icon,
				};
			} )
			.filter( Boolean )
			.sort(
				( firstModule, secondModule ) =>
					firstModule.order - secondModule.order
			);
	} );

	if ( ! services?.length ) {
		return null;
	}

	return (
		<ul className="googlesitekit-setup__services-list">
			{ services.map( ( { slug, name, Icon } ) => (
				<li
					key={ slug }
					className="googlesitekit-setup__services-list-item"
				>
					{ Icon && (
						<span className="googlesitekit-setup__services-list-item-icon">
							<Icon width={ 24 } height={ 24 } />
						</span>
					) }
					<span className="googlesitekit-setup__services-list-item-name">
						{ name }
					</span>
				</li>
			) ) }
		</ul>
	);
}
