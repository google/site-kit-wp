/**
 * Footer component
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
import { Grid, Cell, Row } from '../../../../../material-components';
import Pagination from './Pagination';

const Footer = ( { page, totalIdeas, handlePrev, handleNext } ) => {
	return (
		<Grid className="googlesitekit-idea-hub__footer">
			<Row>
				<Cell smSize={ 4 } mdSize={ 4 } lgSize={ 6 } className="googlesitekit-idea-hub__footer--updated">
					{ __( 'Updated every 2-3 days', 'google-site-kit' ) }
				</Cell>

				<Cell smSize={ 4 } mdSize={ 4 } lgSize={ 6 }>
					<Pagination
						total={ totalIdeas }
						page={ page }
						handlePrev={ handlePrev }
						handleNext={ handleNext }
					/>
				</Cell>
			</Row>
		</Grid>
	);
};

Footer.propTypes = {
	page: PropTypes.number.isRequired,
	totalIdeas: PropTypes.number.isRequired,
	handlePrev: PropTypes.func,
	handleNext: PropTypes.func,
};

export default Footer;
