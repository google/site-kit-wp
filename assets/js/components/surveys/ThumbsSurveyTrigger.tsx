/**
 * ThumbsSurveyTrigger component.
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
import { FC, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { Fragment, useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { useDispatch } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import Popper, {
	PopperPlacement,
} from '@/js/googlesitekit/components-gm2/Popper';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import CloseIcon from '@/svg/icons/close.svg';
import ThumbDownIcon from '@/svg/icons/thumb-down.svg';
import ThumbUpIcon from '@/svg/icons/thumb-up.svg';
import {
	VOTE_DIRECTION_DOWN,
	VOTE_DIRECTION_UP,
	VoteDirection,
} from './constants';
import FeedbackMenu, { FeedbackMenuOption } from './FeedbackMenu';

// Use a tighter gap for bottom-placed poppers. Top placement keeps the default (9px).
const BOTTOM_POPPER_OFFSET = 4;

interface ThumbsSurveyTriggerProps {
	voteID: string;
	onVote?: ( direction: VoteDirection ) => void;
	ariaLabel?: string;
	popperPlacement?: PopperPlacement;
	voteDirection?: VoteDirection | null;
	feedbackOptions?: Partial< Record< VoteDirection, FeedbackMenuOption[] > >;
	onSelectFeedback?: ( value: string | undefined ) => void;
}

/**
 * Renders thumbs-up and thumbs-down buttons that send a survey vote
 * and show a thank-you popper after the user votes.
 *
 * @since 1.182.0
 *
 * @param props                  Component props.
 * @param props.voteID           Identifier used to build the survey trigger string.
 * @param props.onVote           Optional callback run after the user votes.
 * @param props.ariaLabel        Accessible label for the button group.
 * @param props.popperPlacement  Popper position, defaults to `top-end`.
 * @param props.voteDirection    Controlled vote; null selects neither thumb. Omit to manage selection internally.
 * @param props.feedbackOptions  Feedback options for each vote direction.
 * @param props.onSelectFeedback Callback run when feedback is selected.
 * @return React element.
 */
const ThumbsSurveyTrigger: FC< ThumbsSurveyTriggerProps > = ( {
	voteID,
	onVote,
	ariaLabel,
	popperPlacement = 'top-end',
	voteDirection,
	feedbackOptions,
	onSelectFeedback,
} ) => {
	const { triggerSurvey } = useDispatch( CORE_USER );

	const [ feedbackDirection, setFeedbackDirection ] =
		useState< VoteDirection | null >( null );

	const [ internalDirection, setInternalDirection ] =
		useState< VoteDirection | null >( null );

	const selectedDirection =
		voteDirection === undefined ? internalDirection : voteDirection;

	// eslint-disable-next-line sitekit/acronym-case
	const [ anchorElement, setAnchorElement ] = useState< HTMLElement | null >(
		null
	);
	const [ voteCount, setVoteCount ] = useState( 0 );

	const wrapperRef = useRef< HTMLDivElement >( null );
	const sourceRef = useRef< HTMLButtonElement | null >( null );

	const menuID = useInstanceId(
		ThumbsSurveyTrigger,
		'thumbs-feedback-menu'
	) as string;

	const isFeedbackMenuOpen = feedbackDirection !== null;

	const selectedFeedbackOptions = feedbackDirection
		? feedbackOptions?.[ feedbackDirection ]
		: undefined;

	const closeFeedbackMenu = useCallback( () => {
		setFeedbackDirection( null );
	}, [] );

	const selectFeedback = useCallback(
		( value: string | undefined ) => {
			closeFeedbackMenu();

			setAnchorElement( wrapperRef.current );
			setVoteCount( ( count ) => count + 1 );

			onSelectFeedback?.( value );
		},
		[ closeFeedbackMenu, onSelectFeedback ]
	);

	function handleVote( direction: VoteDirection ) {
		return ( event: MouseEvent< HTMLButtonElement > ) => {
			triggerSurvey( `vote:${ voteID }:${ direction }` );

			if ( voteDirection === undefined ) {
				setInternalDirection( direction );
			}

			const hasFeedbackOptions =
				!! feedbackOptions?.[ direction ]?.length;

			sourceRef.current = event.currentTarget;

			setAnchorElement( hasFeedbackOptions ? null : wrapperRef.current );
			setFeedbackDirection( hasFeedbackOptions ? direction : null );
			setVoteCount( ( count ) => count + 1 );

			onVote?.( direction );
		};
	}

	function handleClose() {
		setAnchorElement( null );
	}

	const isUpvote = selectedDirection === VOTE_DIRECTION_UP;
	const isDownvote = selectedDirection === VOTE_DIRECTION_DOWN;

	const hasUpvoteFeedbackOptions = !! feedbackOptions?.up?.length;
	const hasDownvoteFeedbackOptions = !! feedbackOptions?.down?.length;

	const isUpvoteFeedbackMenuOpen =
		hasUpvoteFeedbackOptions && feedbackDirection === VOTE_DIRECTION_UP;

	const isDownvoteFeedbackMenuOpen =
		hasDownvoteFeedbackOptions && feedbackDirection === VOTE_DIRECTION_DOWN;

	const popperOffset = popperPlacement.startsWith( 'bottom' )
		? BOTTOM_POPPER_OFFSET
		: undefined;

	return (
		<Fragment>
			<div
				className={ classnames( 'googlesitekit-thumbs-survey-trigger', {
					'mdc-menu-surface--anchor': !! feedbackOptions,
					'googlesitekit-thumbs-survey-trigger--voted':
						selectedDirection !== null,
				} ) }
				role="group"
				aria-label={
					ariaLabel ??
					__( 'Is this section helpful?', 'google-site-kit' )
				}
				ref={ wrapperRef }
			>
				<Button
					// @ts-expect-error - The `Button` component is not typed yet.
					icon={ <ThumbUpIcon width={ 20 } height={ 20 } /> }
					aria-label={ __(
						'Yes, this was helpful',
						'google-site-kit'
					) }
					aria-controls={
						hasUpvoteFeedbackOptions ? menuID : undefined
					}
					aria-expanded={ isUpvoteFeedbackMenuOpen }
					aria-haspopup={
						hasUpvoteFeedbackOptions ? 'menu' : undefined
					}
					aria-pressed={ isUpvote }
					className={ classnames(
						'googlesitekit-thumbs-survey-trigger__button',
						'googlesitekit-thumbs-survey-trigger__button--up'
					) }
					onClick={ handleVote( VOTE_DIRECTION_UP ) }
					tertiary
					hideTooltipTitle
				/>
				<Button
					// @ts-expect-error - The `Button` component is not typed yet.
					icon={ <ThumbDownIcon width={ 20 } height={ 20 } /> }
					aria-label={ __(
						'No, this was not helpful',
						'google-site-kit'
					) }
					aria-controls={
						hasDownvoteFeedbackOptions ? menuID : undefined
					}
					aria-expanded={ isDownvoteFeedbackMenuOpen }
					aria-haspopup={
						hasDownvoteFeedbackOptions ? 'menu' : undefined
					}
					aria-pressed={ isDownvote }
					className={ classnames(
						'googlesitekit-thumbs-survey-trigger__button',
						'googlesitekit-thumbs-survey-trigger__button--down'
					) }
					onClick={ handleVote( VOTE_DIRECTION_DOWN ) }
					tertiary
					hideTooltipTitle
				/>
				{ !! selectedFeedbackOptions?.length && (
					<FeedbackMenu
						id={ menuID }
						isOpen={ isFeedbackMenuOpen }
						onClose={ closeFeedbackMenu }
						onSelect={ selectFeedback }
						placement="top-start"
						options={ selectedFeedbackOptions }
						sourceRef={ sourceRef }
						wrapperRef={ wrapperRef }
					/>
				) }
			</div>
			<Popper
				anchorElement={ anchorElement }
				onClose={ handleClose }
				placement={ popperPlacement }
				resetKey={ voteCount }
				offset={ popperOffset }
				className="googlesitekit-thumbs-survey-trigger__popper"
			>
				<Typography
					type="body"
					size="small"
					role="status"
					className="googlesitekit-thumbs-survey-trigger__popper-text"
				>
					{ __( 'Thanks for the feedback!', 'google-site-kit' ) }
				</Typography>
				<Button
					// @ts-expect-error - The `Button` component is not typed yet.
					icon={ <CloseIcon width={ 11 } height={ 11 } /> }
					aria-label={ __(
						'Close feedback message',
						'google-site-kit'
					) }
					className="googlesitekit-thumbs-survey-trigger__popper-close"
					onClick={ handleClose }
					hideTooltipTitle
				/>
			</Popper>
		</Fragment>
	);
};

export default ThumbsSurveyTrigger;
