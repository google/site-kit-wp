/**
 * Preview Block Component Stories.
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
import PoweredBy from '@/js/components/PoweredBy';
import ReaderRevenueManagerIcon from '@/svg/graphics/reader-revenue-manager.svg';

function Template( args ) {
	return <PoweredBy { ...args } />;
}

export const ReaderRevenueManager = Template.bind( {} );
ReaderRevenueManager.storyName = 'Powered by Reader Revenue Manager';
ReaderRevenueManager.args = {
	Icon: ReaderRevenueManagerIcon,
	text: 'Powered by Reader Revenue Manager',
};

export default {
	title: 'Components/PoweredBy',
	component: PoweredBy,
};
