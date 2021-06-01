/**
 * SurveyCompletion component.
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
 * Internal dependencies
 */
import Button from '../Button';
import SurveyHeader from './SurveyHeader';

const SurveyCompletion = ( { title, children, ctaText, ctaURL, ctaOnClick, dismissSurvey } ) => (
	<div className="googlesitekit-survey__completion">
		<SurveyHeader
			title={ title }
			dismissSurvey={ dismissSurvey }
		/>

		<div className="googlesitekit-survey__body">
			{ children }
		</div>

		{ ctaURL && ctaText && (
			<div className="googlesitekit-survey__footer">
				<Button
					href={ ctaURL }
					onClick={ ctaOnClick }
				>
					{ ctaText }
				</Button>
			</div>
		) }
	</div>
);

SurveyCompletion.propTypes = {
	title: PropTypes.string.isRequired,
	children: PropTypes.node,
	ctaText: PropTypes.string,
	ctaURL: PropTypes.string,
	ctaOnClick: PropTypes.func,
	dismissSurvey: PropTypes.func.isRequired,
};

SurveyCompletion.defaultProps = {
	title: '',
	children: null,
	ctaText: '',
	ctaURL: '',
	ctaOnClick: null,
};

export default SurveyCompletion;
