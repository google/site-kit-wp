/**
 * Menu Component Stories.
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
import { Menu } from 'googlesitekit-components';

function Template() {
	return (
		<div>
			<div className="mdc-menu-surface--anchor">
				<p>Menu</p>
				<Menu
					menuItems={ [
						'Item 1',
						'Item 2',
						'Item 3',
						'Item 4',
						'Item 5',
					] }
					onSelected={ ( index ) => {
						global.console.log( index );
					} }
					id="googlesitekit-menu"
					menuOpen
				/>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export default {
	title: 'Components/Menu',
	component: Menu,
};
