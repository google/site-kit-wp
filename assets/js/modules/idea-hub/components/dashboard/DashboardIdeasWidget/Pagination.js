/**
 * Pagination component
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
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../../../../components/Button';
import { IDEA_HUB_IDEAS_PER_PAGE } from '../../../datastore/constants';

const Pagination = ( { total, page, ideasPerPage, handlePrev, handleNext } ) => {
	return (
		<div className="googlesitekit-idea-hub__pagination">
			<span className="googlesitekit-idea-hub__pagination--legend">
				{ sprintf(
					/* translators: 1: from, 2: to, 3: total items */
					_x( '%1$s - %2$s of %3$s', '{from} - {to} of {total}', 'google-site-kit' ),
					page === 1 ? page : ( ( ( page - 1 ) * ideasPerPage ) + 1 ),
					total < ( page * ideasPerPage ) ? total : ( page * ideasPerPage ),
					total,
				) }
			</span>

			<div className="googlesitekit-idea-hub__pagination--buttons">
				<Button icon={ <Icon icon={ chevronLeft } /> } onClick={ handlePrev } disabled={ page === 1 } />
				<Button icon={ <Icon icon={ chevronRight } /> } onClick={ handleNext } disabled={ ( page * ideasPerPage ) > total } />
			</div>
		</div>
	);
};

Pagination.propTypes = {
	total: PropTypes.number.isRequired,
	page: PropTypes.number.isRequired,
	ideasPerPage: PropTypes.number,
	handlePrev: PropTypes.func,
	handleNext: PropTypes.func,
};

Pagination.defaultProps = {
	ideasPerPage: IDEA_HUB_IDEAS_PER_PAGE,
	handlePrev: () => {},
	handleNext: () => {},
};

export default Pagination;
