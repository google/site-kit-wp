/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { map } from 'lodash';

/*
 * Internal dependencies
 */
import { Grid, Cell, Row } from '../../../material-components';
import DataBlock from '../../DataBlock';

export default function BannerBlockMarkup( props ) {
	const { blockData, inlineLayout } = props;

	if ( ! blockData ) {
		return null;
	}

	return (
		<Grid>
			<Row>
				{ map( blockData, ( block, i ) => (
					<Cell key={ i } lgSize={ inlineLayout ? 5 : 4 }>
						<div className="googlesitekit-publisher-win__stats">
							<DataBlock { ...block } />
						</div>
					</Cell>
				) ) }
			</Row>
		</Grid>
	);
}

BannerBlockMarkup.propTypes = {
	inlineLayout: PropTypes.bool,
	blockData: PropTypes.array,
};
