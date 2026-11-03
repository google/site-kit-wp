/**
 * DraggableList component.
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
import { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisuallyHidden from '@/js/components/VisuallyHidden';
import DraggableListItem from './DraggableListItem';
import DragHandle from './DragHandle';
import useDraggableList, { UseDraggableListOptions } from './useDraggableList';

export interface DraggableListRenderOptions< Item > {
	item: Item;
	DragHandle: typeof DragHandle;
}

export interface DraggableListProps< Item >
	extends UseDraggableListOptions< Item > {
	className?: string;
	renderItem: (
		options: DraggableListRenderOptions< Item >,
		index: number
	) => ReactNode;
	showHandle?: boolean;
}

function DraggableList< Item >( {
	className,
	getItemID,
	items,
	onChange,
	renderItem,
	showHandle = false,
}: DraggableListProps< Item > ) {
	const {
		listProps,
		getItemProps,
		getHandleProps,
		draggedItemID,
		destinationIndex,
		instructionText,
		instructionProps,
		announcementText,
		announcementProps,
	} = useDraggableList( { items, getItemID, onChange } );

	const draggedIndex = items.findIndex(
		( item ) => getItemID( item ) === draggedItemID
	);

	return (
		<Fragment>
			<ol
				{ ...listProps }
				className={ classnames(
					'googlesitekit-draggable-list',
					className
				) }
			>
				{ items.map( ( item, index ) => {
					const itemID = getItemID( item );

					const isDestination =
						draggedIndex !== -1 &&
						destinationIndex === index &&
						draggedIndex !== index;

					const isInsertingBefore =
						isDestination && index < draggedIndex;

					const isInsertingAfter =
						isDestination && index > draggedIndex;

					return (
						<DraggableListItem
							itemProps={ getItemProps( itemID ) }
							handleProps={ getHandleProps( itemID ) }
							isDragging={ draggedItemID === itemID }
							isInsertingAfter={ isInsertingAfter }
							isInsertingBefore={ isInsertingBefore }
							key={ itemID }
						>
							{ showHandle && (
								<DragHandle
									label={ sprintf(
										/* translators: %d: Item position. */
										__( 'Move item %d', 'google-site-kit' ),
										index + 1
									) }
								/>
							) }

							{ renderItem( { item, DragHandle }, index ) }
						</DraggableListItem>
					);
				} ) }
			</ol>

			<VisuallyHidden { ...instructionProps }>
				{ instructionText }
			</VisuallyHidden>

			<VisuallyHidden { ...announcementProps }>
				<span>{ announcementText }</span>
			</VisuallyHidden>
		</Fragment>
	);
}

export default DraggableList;
