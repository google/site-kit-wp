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
 * Internal dependencies
 */
import Button from '../../../../../components/Button';
import { Grid, Cell, Row } from '../../../../../material-components';
import {
	IDEA_HUB_BUTTON_CREATE,
	IDEA_HUB_BUTTON_PIN,
	IDEA_HUB_BUTTON_DELETE,
} from '../../../datastore/constants';
import DeleteIcon from '../../../../../../svg/idea-hub-delete.svg';
import CreateIcon from '../../../../../../svg/idea-hub-create.svg';
import PinIcon from '../../../../../../svg/idea-hub-pin.svg';

const Pagination = ( { setPage, totalOnPage, total, page, ideasPerPage, handlePrev, handleNext } ) => {
	return (
		<div className="googlesitekit-idea-hub__pagination">
			<span className="googlesitekit-idea-hub__pagination--legend">
				{ ( ( page - 1 ) * ideasPerPage ) + 1 } - { totalOnPage < ideasPerPage ? ideasPerPage * page : totalOnPage } of { total }
			</span>

			<div className="googlesitekit-idea-hub__pagination--buttons">
				<Button icon={ <Icon icon={ chevronLeft } /> } onClick={ handlePrev } disabled={ page === 1 } />
				<Button icon={ <Icon icon={ chevronRight } /> } onClick={ handleNext } disabled={ ( page * ideasPerPage ) > total } />
			</div>
		</div>
	);
};

Pagination.propTypes = {
	setPage: PropTypes.func.isRequired,
	totalOnPage: PropTypes.number.isRequired,
	total: PropTypes.number.isRequired,
	page: PropTypes.number.isRequired,
	ideasPerPage: PropTypes.number,
	handlePrev: PropTypes.func,
	handleNext: PropTypes.func,
};

Pagination.defaultProps = {
	ideasPerPage: 4,
	handlePrev: () => {},
	handleNext: () => {},
};

export default Pagination;

