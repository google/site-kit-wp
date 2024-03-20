/**
 * InfoNotice Component Stories.
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
import InfoNotice from './InfoNotice';

function Template( args ) {
	return <InfoNotice { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

Default.args = {
	content:
		'The higher the portion of new visitors you have, the more your audience is growing. Looking at what content brings them to your site may give you insights on how to reach even more people.',
	dismissLabel: 'Got it',
};
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/InfoNotice/Default',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/InfoNotice',
};
