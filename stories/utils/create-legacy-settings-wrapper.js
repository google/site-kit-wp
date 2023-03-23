/**
 * Legacy Settings Storybook component wrapper.
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
import SettingsActiveModule from '../../assets/js/components/settings/SettingsActiveModule';
import SettingsModules from '../../assets/js/components/settings/SettingsModules';
import { provideModules, WithTestRegistry } from '../../tests/js/utils';

/**
 * Creates a legacy settings wrapper component for the given module.
 *
 * @since 1.12.0
 * @since 1.20.0 Removed `moduleComponent` argument (now provided via module registration).
 * @since 1.31.0 Reworked to support new setting components.
 * @private
 *
 * @param {string} moduleSlug The module's slug.
 * @return {Function} Legacy settings component.
 */
export default function createLegacySettingsWrapper( moduleSlug ) {
	return function SettingsLegacy( props ) {
		const { registry, callback, route, features, skipModulesProvide } =
			props;

		if ( ! skipModulesProvide ) {
			// HACK: This removes Search Console from appearing in stories for
			// individual module's settings screens. It's a bit of a hack because
			// Search Console _should_ also be enabled, but works for now.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: false,
					connected: true,
				},
				{
					slug: moduleSlug,
					active: true,
					connected: true,
				},
			] );
		}

		return (
			<WithTestRegistry
				registry={ registry }
				callback={ callback }
				route={ route }
				features={ features }
			>
				<div style={ { background: 'white' } }>
					<SettingsModules>
						<SettingsActiveModule slug={ moduleSlug } />
					</SettingsModules>
				</div>
			</WithTestRegistry>
		);
	};
}
