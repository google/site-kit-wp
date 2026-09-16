/**
 * ScrollableTabs component stories.
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
import { Tab, TabBar } from 'googlesitekit-components';
import { Story } from '@/js/types/Story';
import ScrollableTabs from './ScrollableTabs';

const TAB_LABELS = [
	'Newsletter signup',
	'Contact - about page',
	'Volunteer submission form',
	'Contact via email',
	'Customer support',
	'Quote request',
	'Event registration',
	'Feedback form',
];

function Template() {
	return (
		<div
			style={ {
				backgroundColor: 'white',
				maxWidth: '600px',
				padding: '20px',
			} }
		>
			<ScrollableTabs>
				<TabBar activeIndex={ 0 } handleActiveIndexUpdate={ () => {} }>
					{ TAB_LABELS.map( ( label ) => (
						<Tab
							key={ label }
							className="mdc-tab--min-width"
							focusOnActivate={ false }
						>
							<span className="mdc-tab__text-label">
								{ label }
							</span>
						</Tab>
					) ) }
				</TabBar>
			</ScrollableTabs>
		</div>
	);
}

export const OverflowingTabs = Template.bind( {} ) as Story;
OverflowingTabs.storyName = 'Overflowing Tabs';
OverflowingTabs.scenario = {};

export default {
	title: 'Components/ScrollableTabs',
	component: ScrollableTabs,
};
