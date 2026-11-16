/**
 * FeatureRelevancyFeedback component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import {
	VOTE_DIRECTION_DOWN,
	VoteDirection,
} from '@/js/components/feedback/constants';
import { FeedbackMenuOption } from '@/js/components/feedback/FeedbackMenu';
import ThumbsFeedback from '@/js/components/feedback/ThumbsFeedback';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_HUB_FEEDBACK_NAMESPACE,
	FEATURE_RELEVANCY_FEEDBACK_KEYS,
	FEATURE_RELEVANCY_REASONS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { getFeatureRelevancyFeedbackGroup } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

interface FeatureRelevancyFeedbackProps {
	slug: string;
}

const FeatureRelevancyFeedback: FC< FeatureRelevancyFeedbackProps > = ( {
	slug,
} ) => {
	const { sendFeedback } = useDispatch( CORE_USER );
	const { setFeatureRelevancyVote } = useDispatch( CORE_FEATURE_DISCOVERY );

	const [ voteDirection, setVoteDirection ] =
		useState< VoteDirection | null >( null );

	const relevancyVote = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).getFeatureRelevancyVote( slug ),
		[ slug ]
	);

	const feedbackOptions = useMemo< FeedbackMenuOption[] >(
		() => [
			{
				id: FEATURE_RELEVANCY_REASONS.NOT_RELEVANT,
				label: __(
					'It’s not relevant to my site goals',
					'google-site-kit'
				),
				value: FEATURE_RELEVANCY_REASONS.NOT_RELEVANT,
			},
			{
				id: FEATURE_RELEVANCY_REASONS.ALREADY_USING,
				label: __(
					'I’m already using another tool',
					'google-site-kit'
				),
				value: FEATURE_RELEVANCY_REASONS.ALREADY_USING,
			},
			{
				id: FEATURE_RELEVANCY_REASONS.TOO_COMPLICATED,
				label: __( 'Setup seems complex', 'google-site-kit' ),
				value: FEATURE_RELEVANCY_REASONS.TOO_COMPLICATED,
			},
			{
				id: FEATURE_RELEVANCY_REASONS.SOMETHING_ELSE,
				label: __( 'Something else', 'google-site-kit' ),
				value: FEATURE_RELEVANCY_REASONS.SOMETHING_ELSE,
			},
		],
		[]
	);

	const onSelectFeedback = useCallback(
		( value: string | undefined ) => {
			if ( value ) {
				sendFeedback( {
					namespace: FEATURE_HUB_FEEDBACK_NAMESPACE,
					group: getFeatureRelevancyFeedbackGroup( slug ),
					key: FEATURE_RELEVANCY_FEEDBACK_KEYS.VOTE_REASON,
					value,
				} );
			}
		},
		[ sendFeedback, slug ]
	);

	const onVote = useCallback(
		( direction: VoteDirection ) => {
			setFeatureRelevancyVote( slug, direction );
			setVoteDirection( direction );
		},
		[ setFeatureRelevancyVote, slug ]
	);

	return (
		<ThumbsFeedback
			ariaLabel={ __(
				'Is this service relevant to you?',
				'google-site-kit'
			) }
			feedbackNamespace={ FEATURE_HUB_FEEDBACK_NAMESPACE }
			feedbackGroup={ getFeatureRelevancyFeedbackGroup( slug ) }
			feedbackOptions={ {
				[ VOTE_DIRECTION_DOWN ]: feedbackOptions,
			} }
			onSelectFeedback={ onSelectFeedback }
			onVote={ onVote }
			popperPlacement="top-start"
			voteDirection={ voteDirection || relevancyVote }
		/>
	);
};

export default FeatureRelevancyFeedback;
