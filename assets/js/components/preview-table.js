/**
 * PreviewTable component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PreviewBlock from './preview-block';

class PreviewTable extends Component {
	render() {
		const {
			rows,
			rowHeight,
			padding,
		} = this.props;
		const rowData = [];
		for ( let x = 0; rows > x; x++ ) {
			rowData.push(
				<div className="googlesitekit-preview-table__row" key={ 'table-row-' + x }>
					<PreviewBlock
						width="100%"
						height={ rowHeight + 'px' }
					/>
				</div>
			);
		}

		return (
			<div className={ classnames(
				'googlesitekit-preview-table',
				{ 'googlesitekit-preview-table--padding': padding }
			) }>
				{ rowData }
			</div>
		);
	}
}

PreviewTable.propTypes = {
	rows: PropTypes.number,
	rowHeight: PropTypes.number,
	padding: PropTypes.bool,
};

PreviewTable.defaultProps = {
	rows: 11,
	rowHeight: 35,
	padding: false,
};

export default PreviewTable;
