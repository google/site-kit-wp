/**
 * SettingsApp stories.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Layout from '../layout/Layout';
import SettingsApp from './SettingsApp';

function Template() {
	return (
		<Layout>
			<TabBar activeIndex={ 0 } handleActiveIndexUpdate={ null }>
				<Tab>
					<span className="mdc-tab__text-label">
						{ __( 'Connected Services', 'google-site-kit' ) }
					</span>
				</Tab>
				<Tab>
					<span className="mdc-tab__text-label">
						{ __( 'Connect More Services', 'google-site-kit' ) }
					</span>
				</Tab>
				<Tab>
					<span className="mdc-tab__text-label">
						{ __( 'Admin Settings', 'google-site-kit' ) }
					</span>
				</Tab>
			</TabBar>
		</Layout>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	delay: 3000,
};

export default {
	title: 'Components/SettingsApp',
	component: SettingsApp,
};
