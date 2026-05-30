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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';
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

export const VOTE_DIRECTION_UP = 'up';
export const VOTE_DIRECTION_DOWN = 'down';

export type VoteDirection =
	| typeof VOTE_DIRECTION_UP
	| typeof VOTE_DIRECTION_DOWN;

// Use a tighter gap for bottom-placed poppers. Top placement keeps the default (9px).
const BOTTOM_POPPER_OFFSET = 4;

interface ThumbsSurveyTriggerProps {
	voteID: string;
	onVote?: ( direction: VoteDirection ) => void;
	downvoteFormURL?: string;
	ariaLabel?: string;
	popperPlacement?: PopperPlacement;
}

/**
 * Renders thumbs-up and thumbs-down buttons that send a survey vote
 * and show a thank-you popper after the user votes.
 *
 * @since n.e.x.t
 *
 * @param props                   Component props.
 * @param props.voteID            Identifier used to build the survey trigger string.
 * @param [props.onVote]          Optional callback run after the user votes.
 * @param [props.downvoteFormURL] Optional URL for the "Tell us more" link.
 * @param [props.ariaLabel]       Accessible label for the button group.
 * @param [props.popperPlacement] Popper position, defaults to `top-end`.
 * @return React element.
 */
const ThumbsSurveyTrigger: FC< ThumbsSurveyTriggerProps > = ( {
	voteID,
	onVote,
	downvoteFormURL,
	ariaLabel,
	popperPlacement = 'top-end',
} ) => {
	const { triggerSurvey } = useDispatch( CORE_USER );
	const [ selectedDirection, setSelectedDirection ] =
		useState< VoteDirection | null >( null );
	// eslint-disable-next-line sitekit/acronym-case
	const [ anchorElement, setAnchorElement ] = useState< HTMLElement | null >(
		null
	);
	const [ voteCount, setVoteCount ] = useState( 0 );

	function handleVote( direction: VoteDirection ) {
		// eslint-disable-next-line sitekit/acronym-case
		return ( event: React.MouseEvent< HTMLButtonElement > ) => {
			triggerSurvey( `vote:${ voteID }:${ direction }` );

			setSelectedDirection( direction );
			setAnchorElement(
				// eslint-disable-next-line sitekit/acronym-case
				event.currentTarget.parentElement as HTMLElement
			);
			setVoteCount( ( count ) => count + 1 );

			onVote?.( direction );
		};
	}

	function handleClose() {
		setAnchorElement( null );
	}

	const isUpvote = selectedDirection === VOTE_DIRECTION_UP;
	const isDownvote = selectedDirection === VOTE_DIRECTION_DOWN;
	const popperOffset = popperPlacement.startsWith( 'bottom' )
		? BOTTOM_POPPER_OFFSET
		: undefined;

	return (
		<Fragment>
			<div
				className={ classnames( 'googlesitekit-thumbs-survey-trigger', {
					'googlesitekit-thumbs-survey-trigger--voted':
						selectedDirection !== null,
				} ) }
				role="group"
				aria-label={
					ariaLabel ??
					__( 'Is this section helpful?', 'google-site-kit' )
				}
			>
				<Button
					// @ts-expect-error - The `Button` component is not typed yet.
					icon={ <ThumbUpIcon width={ 20 } height={ 20 } /> }
					aria-label={ __(
						'Yes, this was helpful',
						'google-site-kit'
					) }
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
					aria-pressed={ isDownvote }
					className={ classnames(
						'googlesitekit-thumbs-survey-trigger__button',
						'googlesitekit-thumbs-survey-trigger__button--down'
					) }
					onClick={ handleVote( VOTE_DIRECTION_DOWN ) }
					tertiary
					hideTooltipTitle
				/>
			</div>
			<Popper
				anchorEl={ anchorElement }
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
					{ isDownvote && !! downvoteFormURL && (
						<a
							href={ downvoteFormURL }
							target="_blank"
							rel="noreferrer noopener"
						>
							{ __( 'Tell us more', 'google-site-kit' ) }
						</a>
					) }
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
