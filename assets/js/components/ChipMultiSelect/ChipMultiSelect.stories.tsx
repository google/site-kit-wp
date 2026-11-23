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
 * External dependencies
 */
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Story } from '@/js/types/Story';
import ChipMultiSelect from './ChipMultiSelect';
import ChipMultiSelectItem from './ChipMultiSelectItem';

interface StoryArgs {
	initialSelectedChips?: Record< string, boolean >;
}

function Template( { initialSelectedChips = {} }: StoryArgs ) {
	const [ selectedChips, setSelectedChips ] =
		useState< Record< string, boolean > >( initialSelectedChips );

	return (
		<ChipMultiSelect
			onToggleChip={ ( id, isSelected ) => {
				global.console.log( 'onToggleChip', id, isSelected );

				setSelectedChips( { ...selectedChips, [ id ]: isSelected } );
			} }
		>
			<ChipMultiSelectItem id="posts" selected={ selectedChips.posts }>
				Posts
			</ChipMultiSelectItem>
			<ChipMultiSelectItem id="pages" selected={ selectedChips.pages }>
				Pages
			</ChipMultiSelectItem>
			<ChipMultiSelectItem
				id="customPostType"
				selected={ selectedChips.customPostType }
			>
				Custom Post Type
			</ChipMultiSelectItem>
		</ChipMultiSelect>
	);
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.scenario = {};

export const WithSelectedChips = Template.bind( {} ) as Story< StoryArgs >;
WithSelectedChips.storyName = 'With Selected Chips';
WithSelectedChips.args = {
	initialSelectedChips: {
		posts: true,
		pages: false,
		customPostType: true,
	},
};
WithSelectedChips.scenario = {};

export default {
	title: 'Components/ChipMultiSelect',
	component: ChipMultiSelect,
	decorators: [
		( StoryComponent: ElementType ) => (
			<div className="googlesitekit-layout" style={ { padding: '24px' } }>
				<StoryComponent />
			</div>
		),
	],
};
