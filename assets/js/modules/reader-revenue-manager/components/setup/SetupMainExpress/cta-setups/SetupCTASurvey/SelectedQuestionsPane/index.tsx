/**
 * SelectedQuestionsPane component.
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
import { FC, RefCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DraggableList from '@/js/components/DraggableList/DraggableList';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_SMALL,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import SurveyQuestionRow from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/SurveyQuestionRow';
import EmptyStateGraphic from '@/svg/graphics/rrm-survey-selected-questions-empty.svg';
import { SelectedSurveyQuestion } from './types';

export interface SelectedQuestionsPaneProps {
	questions: SelectedSurveyQuestion[];
	highlightedQuestionID?: string;
	onRemove: ( questionID: string ) => void;
	onReorder: ( questions: SelectedSurveyQuestion[] ) => void;
}

interface PendingRemoval {
	questionID: string;
	index: number;
}

const SelectedQuestionsPane: FC< SelectedQuestionsPaneProps > = ( {
	questions,
	highlightedQuestionID,
	onRemove,
	onReorder,
} ) => {
	const titleID = useInstanceId(
		SelectedQuestionsPane,
		'googlesitekit-rrm-selected-questions-pane-title'
	) as string;

	// These refs store the remove buttons and their stable callback refs, keyed by question ID.
	const actionElementsRef = useRef( new Map< string, HTMLButtonElement >() );
	const actionRefCallbacksRef = useRef(
		new Map< string, RefCallback< HTMLButtonElement > >()
	);
	const pendingRemovalRef = useRef< PendingRemoval | null >( null );

	function getActionRef( questionID: string ) {
		let actionRef = actionRefCallbacksRef.current.get( questionID );

		if ( ! actionRef ) {
			actionRef = ( element ) => {
				if ( element ) {
					actionElementsRef.current.set( questionID, element );
				} else {
					actionElementsRef.current.delete( questionID );
				}
			};

			actionRefCallbacksRef.current.set( questionID, actionRef );
		}

		return actionRef;
	}

	function handleRemove( questionID: string, index: number ) {
		pendingRemovalRef.current = { questionID, index };
		onRemove( questionID );
	}

	// Once the parent supplies questions without the removed one, move focus
	// to the remove action now at its position, or to the title when empty.
	useEffect( () => {
		const pendingRemoval = pendingRemovalRef.current;

		if (
			! pendingRemoval ||
			questions.some( ( { id } ) => id === pendingRemoval.questionID )
		) {
			return;
		}

		pendingRemovalRef.current = null;
		actionRefCallbacksRef.current.delete( pendingRemoval.questionID );

		if ( ! questions.length ) {
			document.getElementById( titleID )?.focus();
			return;
		}

		const nextIndex = Math.min(
			pendingRemoval.index,
			questions.length - 1
		);

		actionElementsRef.current.get( questions[ nextIndex ].id )?.focus();
	}, [ questions, titleID ] );

	return (
		<section
			aria-labelledby={ titleID }
			className="googlesitekit-rrm-selected-questions-pane"
		>
			<div className="googlesitekit-rrm-selected-questions-pane__header">
				<Typography
					as="h3"
					className="googlesitekit-rrm-selected-questions-pane__title"
					id={ titleID }
					size={ SIZE_LARGE }
					tabIndex={ -1 }
					type={ TYPE_LABEL }
				>
					{ __( 'Selected questions', 'google-site-kit' ) }
				</Typography>

				<P
					className="googlesitekit-rrm-selected-questions-pane__description"
					size={ SIZE_SMALL }
				>
					{ __(
						'You can remove or reorder your questions here',
						'google-site-kit'
					) }
				</P>
			</div>

			{ questions.length ? (
				<DraggableList
					className="googlesitekit-rrm-selected-questions-pane__list"
					getItemID={ ( { id } ) => id }
					items={ questions }
					onChange={ onReorder }
					renderItem={ ( { item, DragHandle }, index ) => (
						<SurveyQuestionRow
							actionRef={ getActionRef( item.id ) }
							isExpanded={ item.id === highlightedQuestionID }
							leadingElement={
								<DragHandle
									label={ sprintf(
										/* translators: %d: Position of the question in the survey. */
										__(
											'Move question %d',
											'google-site-kit'
										),
										index + 1
									) }
								/>
							}
							onRemove={ () => handleRemove( item.id, index ) }
							question={ item.question }
							isAdded
						/>
					) }
				/>
			) : (
				<div className="googlesitekit-rrm-selected-questions-pane__empty">
					<EmptyStateGraphic
						aria-hidden="true"
						focusable="false"
						height={ 147 }
						width={ 147 }
					/>
				</div>
			) }
		</section>
	);
};

export default SelectedQuestionsPane;
