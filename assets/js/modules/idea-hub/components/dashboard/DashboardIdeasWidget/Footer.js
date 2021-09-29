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
 * Internal dependencies
 */
import { Grid, Cell, Row } from '../../../../../material-components';
import { IDEA_HUB_TAB_NAMES_NEW } from '../../../datastore/constants';
import Pagination from './Pagination';

export default function Footer( { tab, footerText } ) {
	return (
		<Grid className="googlesitekit-idea-hub__footer">
			<Row>
				<Cell
					smSize={ 4 }
					mdSize={ 4 }
					lgSize={ 6 }
					className="googlesitekit-idea-hub__footer--updated"
				>
					{ footerText }
				</Cell>

				<Cell smSize={ 4 } mdSize={ 4 } lgSize={ 6 }>
					<Pagination tab={ tab } />
				</Cell>
			</Row>
		</Grid>
	);
}

Footer.propTypes = {
	tab: PropTypes.string,
	footerText: PropTypes.string,
};

Footer.defaultProps = {
	tab: IDEA_HUB_TAB_NAMES_NEW,
};
