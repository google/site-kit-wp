/**
 * SurveyQuestionRating Component Stories.
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
 * Internal dependencies
 */
import SurveyCompletion from './SurveyCompletion';

export const SurveyCompletionStory = () => (
	<div className="googlesitekit-survey">
		<SurveyCompletion
			title="Thanks for sharing your thoughts!"
			ctaText="Let’s go"
			ctaURL="https://sitekit.withgoogle.com/"
			ctaOnClick={ () => {
				global.console.log( 'Clicked' );
			} }
			dismissSurvey={ () => {
				global.console.log( 'Dismissed Completed Survey' );
			} }
		>
			We’re glad Site Kit is helpful for you! To help others discover it too, take a moment to share your opinion as a review.
		</SurveyCompletion>
	</div>
);
SurveyCompletionStory.storyName = 'SurveyCompletion';

export default {
	title: 'Components/Surveys',
};
