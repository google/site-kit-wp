/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { MODULES_SIGN_IN_WITH_GOOGLE } from './datastore/constants';
import Icon from '../../../svg/graphics/sign-in-with-google.svg';
import SetupMain from './components/setup/SetupMain';

export { registerStore } from './datastore';

export function registerModule( modules ) {
	modules.registerModule( 'sign-in-with-google', {
		storeName: MODULES_SIGN_IN_WITH_GOOGLE,
		SettingsEditComponent() {
			return null;
		},
		SettingsViewComponent() {
			return null;
		},
		SetupComponent: SetupMain,
		onCompleteSetup: async ( registry, finishSetup ) => {
			const { submitChanges } = registry.dispatch(
				MODULES_SIGN_IN_WITH_GOOGLE
			);

			const response = await submitChanges();
			if ( ! response.error ) {
				finishSetup();
			}
		},
		Icon,
	} );
}
