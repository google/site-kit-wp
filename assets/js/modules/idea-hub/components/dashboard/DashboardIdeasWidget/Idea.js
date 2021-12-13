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
import { __ } from '@wordpress/i18n';
import { useCallback, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../../../components/Button';
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
	IDEA_HUB_ACTIVITY_IS_DELETING,
	IDEA_HUB_ACTIVITY_DELETED,
	IDEA_HUB_ACTIVITY_IS_PINNING,
	IDEA_HUB_ACTIVITY_PINNED,
	IDEA_HUB_ACTIVITY_IS_UNPINNING,
	IDEA_HUB_ACTIVITY_UNPINNED,
	IDEA_HUB_GA_CATEGORY_WIDGET,
} from '../../../datastore/constants';
import { trackEvent } from '../../../../../util';

const { useDispatch, useSelect } = Data;

const ACTIVITY_TIMER = 2000;
const notices = {
	IDEA_HUB_ACTIVITY_DRAFT_CREATED: __( 'Draft created', 'google-site-kit' ),
	IDEA_HUB_ACTIVITY_PINNED: __( 'Idea saved', 'google-site-kit' ),
	IDEA_HUB_ACTIVITY_UNPINNED: __(
		'Idea removed from saved',
		'google-site-kit'
	),
	IDEA_HUB_ACTIVITY_DELETED: __( 'Idea dismissed', 'google-site-kit' ),
};
const waitForActivity = () =>
	new Promise( ( resolve ) => {
		setTimeout( () => {
			resolve();
		}, ACTIVITY_TIMER );
	} );
export default function Idea( props ) {
	const { postEditURL, name, text, topics, buttons } = props;
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
		setActivity( name, IDEA_HUB_ACTIVITY_IS_DELETING );
		await dismissIdea( name );
		setActivity( name, IDEA_HUB_ACTIVITY_DELETED );

		trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'dismiss_idea' );

		await waitForActivity();
		removeActivity( name );
		removeIdeaFromNewIdeas( name );
	}, [
		name,
		dismissIdea,
		setActivity,
		removeActivity,
		removeIdeaFromNewIdeas,
	] );

	const handlePin = useCallback( async () => {
		setActivity( name, IDEA_HUB_ACTIVITY_IS_PINNING );
		await saveIdea( name );
		setActivity( name, IDEA_HUB_ACTIVITY_PINNED );

		trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'save_idea' );

		await waitForActivity();
		removeActivity( name );
		moveIdeaFromNewIdeasToSavedIdeas( name );
	}, [
		name,
		saveIdea,
		setActivity,
		moveIdeaFromNewIdeasToSavedIdeas,
		removeActivity,
	] );

	const handleUnpin = useCallback( async () => {
		setActivity( name, IDEA_HUB_ACTIVITY_IS_UNPINNING );
		await unsaveIdea( name );
		setActivity( name, IDEA_HUB_ACTIVITY_UNPINNED );

		trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'unsave_idea' );

		await waitForActivity();
		removeActivity( name );
		moveIdeaFromSavedIdeasToNewIdeas( name );
	}, [
		name,
		unsaveIdea,
		setActivity,
		moveIdeaFromSavedIdeasToNewIdeas,
		removeActivity,
	] );

	const handleCreate = useCallback( async () => {
		setActivity( name, IDEA_HUB_ACTIVITY_CREATING_DRAFT );
		await createIdeaDraftPost( { name, text, topics } );
		setActivity( name, IDEA_HUB_ACTIVITY_DRAFT_CREATED );

		trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'start_draft' );

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
	] );

	const showNotice =
		( activity === IDEA_HUB_ACTIVITY_DRAFT_CREATED && ! isDraft ) ||
		activity === IDEA_HUB_ACTIVITY_UNPINNED ||
		activity === IDEA_HUB_ACTIVITY_PINNED ||
		activity === IDEA_HUB_ACTIVITY_DELETED;

	const handleView = useCallback( async () => {
		await trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'view_draft' );
	}, [] );

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
						<p>{ notices[ activity ] }</p>
					</div>
				) }

				{ ! showNotice && (
					<Fragment>
						{ buttons.includes( IDEA_HUB_BUTTON_DELETE ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_DELETE }
								className="googlesitekit-idea-hub__actions--delete"
								inProgress={
									activity === IDEA_HUB_ACTIVITY_IS_DELETING
								}
								onClick={ handleDelete }
								title={ __( 'Dismiss', 'google-site-kit' ) }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_PIN ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_PIN }
								className="googlesitekit-idea-hub__actions--pin"
								inProgress={
									activity === IDEA_HUB_ACTIVITY_IS_PINNING
								}
								onClick={ handlePin }
								title={ __(
									'Save for later',
									'google-site-kit'
								) }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_UNPIN ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_UNPIN }
								className="googlesitekit-idea-hub__actions--unpin"
								inProgress={
									activity === IDEA_HUB_ACTIVITY_IS_UNPINNING
								}
								onClick={ handleUnpin }
								title={ __(
									'Remove from saved',
									'google-site-kit'
								) }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_CREATE ) && (
							<IdeaActivityButton
								activity={ IDEA_HUB_BUTTON_CREATE }
								className="googlesitekit-idea-hub__actions--create"
								inProgress={
									activity ===
									IDEA_HUB_ACTIVITY_CREATING_DRAFT
								}
								onClick={ handleCreate }
								title={ __(
									'Start a draft post',
									'google-site-kit'
								) }
							/>
						) }

						{ buttons.includes( IDEA_HUB_BUTTON_VIEW ) &&
							postEditURL && (
								<Button
									className="googlesitekit-idea-hub__actions--view"
									href={ postEditURL }
									onClick={ handleView }
									disabled={ !! activity }
								>
									{ __( 'View draft', 'google-site-kit' ) }
								</Button>
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
