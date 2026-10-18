/**
 * DraggableList.stories.
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
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TextField } from 'googlesitekit-components';
import { Story } from '@/js/types/Story';
import DraggableList from './DraggableList';

interface TemplateProps {
	showHandle?: boolean;
	withFields?: boolean;
}

function Template( { showHandle, withFields }: TemplateProps ) {
	const [ items, setItems ] = useState( [
		{ id: 'first', label: 'First answer' },
		{ id: 'second', label: 'Second answer' },
		{ id: 'third', label: 'Third answer' },
	] );

	return (
		<DraggableList
			items={ items }
			getItemID={ ( item ) => item.id }
			onChange={ setItems }
			showHandle={ showHandle }
			renderItem={ ( { item, DragHandle }, index ) => {
				const handle = (
					<DragHandle aria-label={ `Move Answer ${ index + 1 }` } />
				);

				return (
					<Fragment>
						{ ! showHandle && handle }
						{ withFields ? (
							<TextField
								label={ `Answer ${ index + 1 }` }
								maxLength={ 100 }
								onChange={ ( event ) =>
									setItems(
										items.map( ( entry ) =>
											entry.id === item.id
												? {
														...entry,
														label: event.target
															.value,
												  }
												: entry
										)
									)
								}
								value={ item.label }
								outlined
								showCharacterCounter
							/>
						) : (
							item.label
						) }
					</Fragment>
				);
			} }
		/>
	);
}

export const Default = Template.bind( {} ) as Story< TemplateProps >;
Default.args = { showHandle: true };

export const HandleInItem = Template.bind( {} ) as Story< TemplateProps >;
HandleInItem.storyName = 'Handle in Item';
HandleInItem.args = { showHandle: false };

export const TextFields = Template.bind( {} ) as Story< TemplateProps >;
TextFields.args = { withFields: true };

export default {
	title: 'Components/DraggableList',
	component: DraggableList,
};
