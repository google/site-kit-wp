/**
 * Idea component
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import IdeaActivityButton from './IdeaActivityButton';
import {
	MODULES_IDEA_HUB,
	IDEA_HUB_BUTTON_CREATE,
	IDEA_HUB_BUTTON_PIN,
	IDEA_HUB_BUTTON_UNPIN,
	IDEA_HUB_BUTTON_DELETE,
	IDEA_HUB_BUTTON_VIEW,
	IDEA_HUB_ACTIVITY_CREATING_DRAFT,
	IDEA_HUB_ACTIVITY_DRAFT_CREATED,
	IDEA_HUB_ACTIVITY_DELETED,
	IDEA_HUB_ACTIVITY_PINNED,
	IDEA_HUB_ACTIVITY_UNPINNED,
} from '../../../datastore/constants';
import { waitForActivity, noticesMap } from './utils';
import { trackEvent } from '../../../../../util';
import useViewContext from '../../../../../hooks/useViewContext';

const { useDispatch, useSelect } = Data;

export default function Idea( props ) {
	const { postEditURL, name, text, topics, buttons } = props;

	const viewContext = useViewContext();

	const isDraft = buttons.includes( IDEA_HUB_BUTTON_VIEW );

	const {
		createIdeaDraftPost,
		saveIdea,
		unsaveIdea,
		dismissIdea,
		setActivity,
		removeActivity,
		removeIdeaFromNewIdeas,
		removeIdeaFromNewAndSavedIdeas,
		moveIdeaFromSavedIdeasToNewIdeas,
		moveIdeaFromNewIdeasToSavedIdeas,
	} = useDispatch( MODULES_IDEA_HUB );

	const activity = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getActivity( name )
	);

	const handleDelete = useCallback( async () => {
		await dismissIdea( name );

		trackEvent( `${ viewContext }_idea-hub-widget`, 'dismiss_idea' );

		await waitForActivity();
		removeActivity( name );
		removeIdeaFromNewIdeas( name );
	}, [
		name,
		dismissIdea,
		removeActivity,
		removeIdeaFromNewIdeas,
		viewContext,
	] );

	const handlePin = useCallback( async () => {
		await saveIdea( name );

		trackEvent( `${ viewContext }_idea-hub-widget`, 'save_idea' );

		await waitForActivity();
		removeActivity( name );
		moveIdeaFromNewIdeasToSavedIdeas( name );
	}, [
		name,
		saveIdea,
		moveIdeaFromNewIdeasToSavedIdeas,
		removeActivity,
		viewContext,
	] );

	const handleUnpin = useCallback( async () => {
		await unsaveIdea( name );

		trackEvent( `${ viewContext }_idea-hub-widget`, 'unsave_idea' );

		await waitForActivity();
		removeActivity( name );
		moveIdeaFromSavedIdeasToNewIdeas( name );
	}, [
		name,
		unsaveIdea,
		moveIdeaFromSavedIdeasToNewIdeas,
		removeActivity,
		viewContext,
	] );

	const handleCreate = useCallback( async () => {
		setActivity( name, IDEA_HUB_ACTIVITY_CREATING_DRAFT );
		await createIdeaDraftPost( { name, text, topics } );
		setActivity( name, IDEA_HUB_ACTIVITY_DRAFT_CREATED );

		trackEvent( `${ viewContext }_idea-hub-widget`, 'start_draft' );

		await waitForActivity();
		removeActivity( name );
		removeIdeaFromNewAndSavedIdeas( name );
	}, [
		removeIdeaFromNewAndSavedIdeas,
		createIdeaDraftPost,
		name,
		text,
		topics,
		setActivity,
		removeActivity,
		viewContext,
	] );

	const showNotice =
		( activity === IDEA_HUB_ACTIVITY_DRAFT_CREATED && ! isDraft ) ||
		activity === IDEA_HUB_ACTIVITY_UNPINNED ||
		activity === IDEA_HUB_ACTIVITY_PINNED ||
		activity === IDEA_HUB_ACTIVITY_DELETED;

	const handleView = useCallback( async () => {
		await trackEvent( `${ viewContext }_idea-hub-widget`, 'view_draft' );
	}, [ viewContext ] );

	return (
		<div
			className={ classnames( 'googlesitekit-idea-hub__idea--single', {
				'googlesitekit-idea-hub__idea--is-processing': !! activity,
			} ) }
		>
			<div className="googlesitekit-idea-hub__idea--details">
				<div className="googlesitekit-idea-hub__idea--topics">
					{ topics.map( ( topic, key ) => (
						<span
							className="googlesitekit-idea-hub__idea--topic"
							key={ key }
						>
							{ topic.displayName }
						</span>
					) ) }
				</div>

				<p className="googlesitekit-idea-hub__idea--text">{ text }</p>
			</div>
			<div className="googlesitekit-idea-hub__idea--actions">
				{ showNotice && (
					<div className="googlesitekit-idea-hub__loading-notice">
						<p>{ noticesMap[ activity ] }</p>
					</div>
				) }

				{ ! showNotice && (
					<Fragment>
						{ buttons.includes( IDEA_HUB_BUTTON_DELETE ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_DELETE }
								name={ name }
								onClick={ handleDelete }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_PIN ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_PIN }
								name={ name }
								onClick={ handlePin }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_UNPIN ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_UNPIN }
								name={ name }
								onClick={ handleUnpin }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_CREATE ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_CREATE }
								name={ name }
								onClick={ handleCreate }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_VIEW ) &&
							postEditURL && (
								<IdeaActivityButton
									activity={ IDEA_HUB_BUTTON_VIEW }
									href={ postEditURL }
									name={ name }
									onClick={ handleView }
								/>
							) }
					</Fragment>
				) }
			</div>
		</div>
	);
}

Idea.propTypes = {
	postID: PropTypes.number,
	postEditURL: PropTypes.string,
	postURL: PropTypes.string,
	name: PropTypes.string.isRequired,
	text: PropTypes.string.isRequired,
	topics: PropTypes.arrayOf(
		PropTypes.shape( {
			displayName: PropTypes.string,
			mid: PropTypes.string,
		} )
	),
	buttons: PropTypes.arrayOf( PropTypes.string ).isRequired,
};

Idea.defaultProps = {
	topics: [],
};
