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
import { Icon, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Grid, Row, Cell } from '../../material-components';
import Button from '../../components/Button';
import Logo from '../../../svg/logo-g.svg';

const SurveyHeader = ( { title, dismissSurvey } ) => (
	<Grid className="googlesitekit-survey__header">
		<Row>
			<Cell className="googlesitekit-survey__header--logo">
				<Logo />
			</Cell>
			<Cell>{ title }</Cell>
			<Cell>
				<Button
					icon={ <Icon icon={ closeSmall } /> }
					onClick={ dismissSurvey }
				/>
			</Cell>
		</Row>
	</Grid>
);

SurveyHeader.propTypes = {
	title: PropTypes.string.isRequired,
	dismissSurvey: PropTypes.func,
};

SurveyHeader.defaultProps = {
	dismissSurvey: () => {},
};

export default SurveyHeader;
