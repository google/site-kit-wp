/**
 * SurveyQuestionRating component.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SurveyHeader from './SurveyHeader';
import SurveyUnhappy from '../../../svg/survey-unhappy.svg';
import SurveyDissatisfied from '../../../svg/survey-dissatisfied.svg';
import SurveyNeutral from '../../../svg/survey-neutral.svg';
import SurveySatisfied from '../../../svg/survey-satisfied.svg';
import SurveyDelighted from '../../../svg/survey-delighted.svg';

const SurveyQuestionRating = ( { question, choices, answerQuestion, dismissSurvey } ) => {
	const getIcon = ( answerOrdinal ) => {
		switch ( answerOrdinal ) {
			case 1:
				return <SurveyUnhappy />;
			case 2:
				return <SurveyDissatisfied />;
			case 3:
				return <SurveyNeutral />;
			case 4:
				return <SurveySatisfied />;
			case 5:
				return <SurveyDelighted />;
		}
	};

	return (
		<SurveyHeader
			title={ __( 'Based on your experience so far, how satisfied are you with Site Kit?', 'google-site-kit' ) }
		/>
	);
};

SurveyQuestionRating.propTypes = {
	question: PropTypes.string.isRequired,
	choices: PropTypes.arrayOf(
		PropTypes.shape( {
			answer_ordinal: PropTypes.string,
			text: PropTypes.string,
		} ).isRequired
	),
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func,
};

SurveyQuestionRating.defaultProps = {
	dismissSurvey: () => {},
};

export default SurveyQuestionRating;
