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
// import { CircularProgress } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';

/**
 * WordPress dependencies
 */
// import { __ } from '@wordpress/i18n';
import {
	// useCallback, Fragment,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
// import Data from 'googlesitekit-data';
// import Button from '../../../../../components/Button';
// // import { Grid, Cell, Row } from '../../../../../material-components';
// import {
// 	MODULES_IDEA_HUB,
// 	IDEA_HUB_BUTTON_CREATE,
// 	IDEA_HUB_BUTTON_PIN,
// 	IDEA_HUB_BUTTON_UNPIN,
// 	IDEA_HUB_BUTTON_DELETE,
// 	IDEA_HUB_BUTTON_VIEW,
// 	IDEA_HUB_ACTIVITY_CREATING_DRAFT,
// 	IDEA_HUB_ACTIVITY_DRAFT_CREATED,
// 	IDEA_HUB_ACTIVITY_IS_PROCESSING,
// 	IDEA_HUB_GA_CATEGORY_WIDGET,
// } from '../../../datastore/constants';
import DeleteIcon from '../../../../../../svg/idea-hub-delete.svg';
import CreateIcon from '../../../../../../svg/idea-hub-create.svg';
import PinIcon from '../../../../../../svg/idea-hub-pin.svg';
// import UnpinIcon from '../../../../../../svg/idea-hub-unpin.svg';
// import { trackEvent } from '../../../../../util';

// const DRAFT_CREATED_TIMER = 2000;

// const { useDispatch, useSelect } = Data;

export default function Idea( { text, topics } ) {
	// const { postEditURL, name, text, topics, buttons } = props;

	// const {
	// 	createIdeaDraftPost,
	// 	saveIdea,
	// 	unsaveIdea,
	// 	dismissIdea,
	// 	setActivity,
	// 	removeActivity,
	// 	removeIdeaFromNewAndSavedIdeas,
	// } = useDispatch( MODULES_IDEA_HUB );

	// const activity = useSelect( ( select ) =>
	// 	select( MODULES_IDEA_HUB ).getActivity( name )
	// );

	// const handleDelete = useCallback( async () => {
	// 	setActivity( name, IDEA_HUB_ACTIVITY_IS_PROCESSING );
	// 	await dismissIdea( name );
	// 	removeActivity( name );

	// 	trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'dismiss_idea' );
	// }, [ name, dismissIdea, setActivity, removeActivity ] );

	// const handlePin = useCallback( async () => {
	// 	setActivity( name, IDEA_HUB_ACTIVITY_IS_PROCESSING );
	// 	await saveIdea( name );
	// 	removeActivity( name );

	// 	trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'save_idea' );
	// }, [ name, saveIdea, setActivity, removeActivity ] );

	// const handleUnpin = useCallback( async () => {
	// 	setActivity( name, IDEA_HUB_ACTIVITY_IS_PROCESSING );
	// 	await unsaveIdea( name );
	// 	removeActivity( name );

	// 	trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'unsave_idea' );
	// }, [ name, unsaveIdea, setActivity, removeActivity ] );

	// const handleCreate = useCallback( async () => {
	// 	setActivity( name, IDEA_HUB_ACTIVITY_CREATING_DRAFT );
	// 	await createIdeaDraftPost( { name, text, topics } );
	// 	setActivity( name, IDEA_HUB_ACTIVITY_DRAFT_CREATED );

	// 	trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'start_draft' );

	// 	setTimeout( () => {
	// 		removeActivity( name );
	// 		removeIdeaFromNewAndSavedIdeas( name );
	// 	}, DRAFT_CREATED_TIMER );
	// }, [
	// 	removeActivity,
	// 	removeIdeaFromNewAndSavedIdeas,
	// 	createIdeaDraftPost,
	// 	name,
	// 	text,
	// 	topics,
	// 	setActivity,
	// ] );

	// const handleView = useCallback( async () => {
	// 	await trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'view_draft' );
	// }, [] );

	const IdeaMenu = () => {
		const [ anchorEl, setAnchorEl ] = useState( null );

		const handleMenuClick = ( event ) => {
			setAnchorEl( event.currentTarget );
		};

		const handleMenuClose = () => {
			setAnchorEl( null );
		};

		return (
			<div>
				<IconButton
					aria-controls="simple-menu"
					aria-haspopup="true"
					onClick={ handleMenuClick }
				>
					<MoreVertIcon />
				</IconButton>
				<Menu
					id="simple-menu"
					anchorEl={ anchorEl }
					keepMounted
					open={ Boolean( anchorEl ) }
					onClose={ handleMenuClose }
				>
					<MenuItem onClick={ handleMenuClose }>
						<CreateIcon width="25" height="25" />
					</MenuItem>
					<MenuItem onClick={ handleMenuClose }>
						<PinIcon width="25" height="25" />
					</MenuItem>
					<MenuItem onClick={ handleMenuClose }>
						<DeleteIcon width="25" height="25" />
					</MenuItem>
				</Menu>
			</div>
		);
	};

	return (
		<div className="googlesitekit-idea-hub__idea--single">
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
				<IdeaMenu />
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
