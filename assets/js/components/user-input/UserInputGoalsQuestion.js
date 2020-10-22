/**
 * User Input Goals Question.
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

export default function UserInputGoalsQuestion( props ) {
	const maxAnswers = 2;

	return (
		<UserInputQuestionWrapper slug="goals" max={ maxAnswers } { ...props }>
			<UserInputQuestionInfo
				title={ __( 'What are the goals of this site?', 'google-site-kit' ) }
				questionNumber={ 3 }
			/>

			<UserInputSelectOptions
				slug="goals"
				max={ maxAnswers }
				options={ {
					sell_products_or_service: __( 'Sell products or services', 'google-site-kit' ),
					monetize_content: __( 'Monetize content (with ads or affiliate links)', 'google-site-kit' ),
					publish_blog: __( 'Publish a blog', 'google-site-kit' ),
					publish_news: __( 'Publish news content', 'google-site-kit' ),
					share_portfolio: __( 'Share a business card or portfolio to represent me or my company online', 'google-site-kit' ),
				} }
			/>
		</UserInputQuestionWrapper>
	);
}

UserInputGoalsQuestion.propTypes = {
	isActive: PropTypes.bool,
	next: PropTypes.func,
	back: PropTypes.func,
};
