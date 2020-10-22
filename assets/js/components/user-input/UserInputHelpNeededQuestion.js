/**
 * User Input Help Needed Question.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UserInputQuestionWrapper from './UserInputQuestionWrapper';
import UserInputQuestionInfo from './UserInputQuestionInfo';
import UserInputSelectOptions from './UserInputSelectOptions';

export default function UserInputHelpNeededQuestion( props ) {
	const maxAnswers = 3;

	return (
		<UserInputQuestionWrapper slug="helpNeeded" max={ maxAnswers } { ...props }>
			<UserInputQuestionInfo
				title={ __( 'What do you need help most with for this site?', 'google-site-kit' ) }
				questionNumber={ 4 }
			/>

			<UserInputSelectOptions
				slug="helpNeeded"
				max={ maxAnswers }
				options={ {
					retaining_visitors: __( 'Retaining visitors, turning them into loyal readers or customers', 'google-site-kit' ),
					improving_performance: __( 'Improving speed and performance', 'google-site-kit' ),
					finding_new_topics: __( 'Finding new topics to write about that connect with my audience', 'google-site-kit' ),
					growing_audience: __( 'Growing my audience', 'google-site-kit' ),
					expanding_business: __( 'Expanding my business into new cities, states or markets', 'google-site-kit' ),
					generating_revenue: __( 'Generating more revenue', 'google-site-kit' ),
					help_better_rank: __( 'Help my content rank in a better position in Google search results', 'google-site-kit' ),
					understanding_content_performance: __( 'Understanding which content is performing best', 'google-site-kit' ),
					encourage_to_post: __( 'Encouragement to post more frequently', 'google-site-kit' ),
				} }
			/>
		</UserInputQuestionWrapper>
	);
}

UserInputHelpNeededQuestion.propTypes = {
	isActive: PropTypes.bool,
	next: PropTypes.func,
	back: PropTypes.func,
};
