/**
 * SurveyHeader component.
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
import { Icon, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Logo from '@/svg/graphics/logo-g.svg';
import Typography from '@/js/components/Typography';

function SurveyHeader( { title, dismissSurvey } ) {
	return (
		<div className="googlesitekit-survey__header">
			<div className="googlesitekit-survey__header-logo">
				<Logo width={ 24 } height={ 24 } />
			</div>

			<div className="googlesitekit-survey__header-details">
				<Typography as="h3" type="headline" size="small">
					{ title }
				</Typography>

				<Button
					aria-label={ __( 'Dismiss', 'google-site-kit' ) }
					icon={ <Icon icon={ closeSmall } size={ 40 } /> }
					onClick={ dismissSurvey }
					className="googlesitekit-survey__header-close"
				/>
			</div>
		</div>
	);
}

SurveyHeader.propTypes = {
	title: PropTypes.string.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
};

export default SurveyHeader;
