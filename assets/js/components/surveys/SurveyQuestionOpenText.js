import React from 'react';
import PropTypes from 'prop-types';

import SurveyHeader from './SurveyHeader';

const SurveyQuestionOpenText = ( { question, answerQuestion, dismissSurvey } ) => {
	return (
		<div className="googlesitekit-survey__open-text">
			<SurveyHeader
				title={ question }
				dismissSurvey={ dismissSurvey }
			/>

			<div className="googlesitekit-survey__body">
				SurveyQuestionOpenText
			</div>
		</div>
	);
};

SurveyQuestionOpenText.propTypes = {
	question: PropTypes.string.isRequired,
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
};

export default SurveyQuestionOpenText;
