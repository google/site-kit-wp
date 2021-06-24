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
DefaultSetup.storyName = 'Set up form';
DefaultSetup.parameters = { features };
DefaultSetup.decorators = [
	( Story ) => {
		const setupRegistry = () => {

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
