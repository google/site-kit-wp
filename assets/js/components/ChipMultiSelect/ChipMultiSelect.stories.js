/**
 * ChipMultiSelect Component Stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ChipMultiSelect from './ChipMultiSelect';
import ChipMultiSelectItem from './ChipMultiSelectItem';

function Template( { initialSelectedChips = {} } ) {
	const [ selectedChips, setSelectedChips ] =
		useState( initialSelectedChips );

	return (
		<ChipMultiSelect
			onToggleChip={ ( id, isSelected ) => {
				global.console.log( 'onToggleChip', id, isSelected );

				const newSelectedChips = selectedChips[ id ]
					? { ...selectedChips, [ id ]: ! selectedChips[ id ] }
					: { ...selectedChips, [ id ]: true };

				setSelectedChips( newSelectedChips );
			} }
		>
			<ChipMultiSelectItem id="posts" selected={ selectedChips.posts }>
				Posts
			</ChipMultiSelectItem>
			<ChipMultiSelectItem id="pages" selected={ selectedChips.pages }>
				Pages
			</ChipMultiSelectItem>
			<ChipMultiSelectItem
				id="custom-post-type"
				selected={ selectedChips[ 'custom-post-type' ] }
			>
				Custom Post Type
			</ChipMultiSelectItem>
		</ChipMultiSelect>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithSelectedChips = Template.bind( {} );
WithSelectedChips.storyName = 'With Selected Chips';
WithSelectedChips.args = {
	initialSelectedChips: {
		posts: true,
		pages: false,
		'custom-post-type': true,
	},
};
WithSelectedChips.scenario = {};

export default {
	title: 'Components/ChipMultiSelect',
	component: ChipMultiSelect,
	decorators: [
		( Story ) => (
			<div className="googlesitekit-layout" style={ { padding: '24px' } }>
				<Story />
			</div>
		),
	],
};
