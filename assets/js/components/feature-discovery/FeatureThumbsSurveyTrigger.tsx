/**
 * FeatureThumbsSurveyTrigger component.
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
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { FeedbackMenuOption } from '@/js/components/surveys/FeedbackMenu';
import ThumbsSurveyTrigger, {
	VOTE_DIRECTION_DOWN,
	VoteDirection,
} from '@/js/components/surveys/ThumbsSurveyTrigger';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_RELEVANCY_REASONS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { getFeatureRelevancyTriggerID } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

interface FeatureThumbsSurveyTriggerProps {
	slug: string;
}

const FeatureThumbsSurveyTrigger: FC< FeatureThumbsSurveyTriggerProps > = ( {
	slug,
} ) => {
	const { triggerSurvey } = useDispatch( CORE_USER );
	const { setFeatureRelevancyVote } = useDispatch( CORE_FEATURE_DISCOVERY );

	const voteDirection = useSelect(
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
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.NOT_RELEVANT
				),
			},
			{
				id: FEATURE_RELEVANCY_REASONS.ALREADY_USING,
				label: __(
					'I’m already using another tool',
					'google-site-kit'
				),
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.ALREADY_USING
				),
			},
			{
				id: FEATURE_RELEVANCY_REASONS.TOO_COMPLICATED,
				label: __( 'Setup seems complex', 'google-site-kit' ),
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.TOO_COMPLICATED
				),
			},
			{
				id: FEATURE_RELEVANCY_REASONS.SOMETHING_ELSE,
				label: __( 'Something else', 'google-site-kit' ),
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.SOMETHING_ELSE
				),
			},
		],
		[ slug ]
	);

	const onSelectFeedback = useCallback(
		( value: string | undefined ) => {
			if ( value ) {
				triggerSurvey( value );
			}
		},
		[ triggerSurvey ]
	);

	const onVote = useCallback(
		( direction: VoteDirection ) =>
			setFeatureRelevancyVote( slug, direction ),
		[ setFeatureRelevancyVote, slug ]
	);

	return (
		<ThumbsSurveyTrigger
			ariaLabel={ __(
				'Is this service relevant to you?',
				'google-site-kit'
			) }
			feedbackOptions={ {
				[ VOTE_DIRECTION_DOWN ]: feedbackOptions,
			} }
			key={ slug }
			onSelectFeedback={ onSelectFeedback }
			onVote={ onVote }
			popperPlacement="top-start"
			voteDirection={ voteDirection ?? null }
			voteID={ `feature_relevancy_${ slug }` }
		/>
	);
};

export default FeatureThumbsSurveyTrigger;
