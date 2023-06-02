/**
 * Optimize module initialization.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SupportLink from '../../components/SupportLink';
import { SetupMain } from './components/setup';
import { SettingsEdit, SettingsView } from './components/settings';
import OptimizeIcon from '../../../svg/graphics/optimize.svg';
import { MODULES_OPTIMIZE } from './datastore/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'optimize', {
		storeName: MODULES_OPTIMIZE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		Icon: OptimizeIcon,
		features: [
			__( 'A/B or multivariate testing', 'google-site-kit' ),
			__( 'Improvement tracking', 'google-site-kit' ),
			__( 'Probability and confidence calculations', 'google-site-kit' ),
		],
		checkRequirements() {
			throw {
				message: (
					<div>
						{ createInterpolateElement(
							__(
								'Optimize will no longer work after September 30, 2023. <a>Learn more</a>',
								'google-site-kit'
							),
							{
								a: (
									<SupportLink
										path="/optimize/answer/12979939"
										external
									/>
								),
							}
						) }
					</div>
				),
				canActivate: true,
			};
		},
	} );
};
