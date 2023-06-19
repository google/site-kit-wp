/**
 * AdBlockingRecoveryApp Component Stories.
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
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { provideModules } from '../../../../../../../tests/js/utils';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import AdBlockingRecoveryApp from '.';

const Template = () => <AdBlockingRecoveryApp />;

export const Setup = Template.bind( {} );
Setup.storyName = 'Setup';
Setup.scenario = {
	label: 'Global/AdBlockingRecoveryApp/Setup',
	delay: 250,
};

export default {
	title: 'Modules/AdSense/Settings/AdBlockingRecoveryApp',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
				] );

				registry
					.dispatch( MODULES_ADSENSE )
					.receiveIsAdBlockerActive( false );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
