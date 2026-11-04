/**
 * DraggableListItem component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { DragHandleContext } from './DragHandleContext';
import { HandleProps, ItemProps } from './useDraggableList';

interface DraggableListItemProps {
	children: ReactNode;
	itemProps: ItemProps;
	handleProps: HandleProps;
	isDragging: boolean;
	isInsertingAfter: boolean;
	isInsertingBefore: boolean;
}

const DraggableListItem: FC< DraggableListItemProps > = ( {
	children,
	handleProps,
	isDragging,
	isInsertingAfter,
	isInsertingBefore,
	itemProps,
} ) => (
	<li
		{ ...itemProps }
		className={ classnames(
			'googlesitekit-draggable-list__item',
			{
				'googlesitekit-draggable-list__item--dragging': isDragging,
				'googlesitekit-draggable-list__item--inserting-after':
					isInsertingAfter,
				'googlesitekit-draggable-list__item--inserting-before':
					isInsertingBefore,
			},
			itemProps.className
		) }
	>
		<DragHandleContext.Provider value={ handleProps }>
			{ children }
		</DragHandleContext.Provider>
	</li>
);

export default DraggableListItem;
