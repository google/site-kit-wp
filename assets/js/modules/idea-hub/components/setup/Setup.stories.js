/**
 * Idea Hub setup component stories.
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
import { STORE_NAME } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import SetupMain from './SetupMain';

const features = [ 'ideaHubModule' ];

function Template() {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className=" mdc-layout-grid__cell mdc-layout-grid__cell--span-12 ">
							<SetupMain />
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

export const DefaultSetup = Template.bind( null );
DefaultSetup.storyName = 'Setup form';
DefaultSetup.parameters = { features };
DefaultSetup.decorators = [
	( Story ) => {
		const moduleFixture = [ {
			slug: 'idea-hub',
			name: 'Idea Hub',
			description: "Idea Hub suggests what you can write about next, based on searches that haven't been answered yet",
			homepage: 'https://www.google.com/webmasters/verification/home',
			internal: true,
			order: 0,
			active: false,
			connected: false,
			dependencies: [],
			dependants: [],
			owner: null,
			forceActive: true,
		} ];

		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_MODULES ).receiveGetModules( moduleFixture );
			registry.dispatch( STORE_NAME ).receiveGetSettings( { tosAccepted: false } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Idea Hub/Setup',
};
