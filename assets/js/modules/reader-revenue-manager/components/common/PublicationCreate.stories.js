/**
 * Reader Revenue Manager PublicationCreate component stories.
 *
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
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import PublicationCreate from './PublicationCreate';

function Template() {
	return <PublicationCreate onCompleteSetup={ () => {} } />;
}

export const WithoutPublication = Template.bind( {} );
WithoutPublication.storyName = 'WithoutPublication';

export const WithPublications = Template.bind( {} );
WithPublications.storyName = 'WithPublications';
WithPublications.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	},
};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/PublicationCreate',
	component: PublicationCreate,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [] );

				args?.setupRegistry?.( registry );
			}

			return (
				<div className="googlesitekit-setup">
					<section className="googlesitekit-setup__wrapper">
						<div className="googlesitekit-setup-module">
							<div
								style={ {
									padding: '20px',
								} }
							>
								<WithRegistrySetup func={ setupRegistry }>
									<Story />
								</WithRegistrySetup>
							</div>
						</div>
					</section>
				</div>
			);
		},
	],
};
