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
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import PreviewBlock from '../PreviewBlock';

export default function MetricTileTable( props ) {
	const {
		Widget,
		loading,
		title,
		rows = [],
		columns = [],
		limit,
		zeroState: ZeroState,
	} = props;

	let tbody = null;

	if ( rows?.length > 0 ) {
		tbody = rows
			.slice( 0, limit || rows.length )
			.map( ( row, rowIndex ) => (
				<tr key={ rowIndex }>
					{ columns.map(
						( { Component, field, className }, colIndex ) => {
							const fieldValue =
								field !== undefined
									? get( row, field )
									: undefined;

							return (
								<td key={ colIndex } className={ className }>
									{ Component && (
										<Component
											row={ row }
											fieldValue={ fieldValue }
										/>
									) }
									{ ! Component && fieldValue }
								</td>
							);
						}
					) }
				</tr>
			) );
	} else if ( !! ZeroState ) {
		tbody = (
			<tr className="googlesitekit-table__body-row googlesitekit-table__body-row--no-data">
				<td className="googlesitekit-table__body-item">
					<ZeroState />
				</td>
			</tr>
		);
	}

	return (
		<Widget noPadding>
			<div className="googlesitekit-km-widget-tile googlesitekit-km-widget-table">
				<h3 className="googlesitekit-km-widget-tile__title">
					{ title }
				</h3>
				<div className="googlesitekit-km-widget-tile__body">
					{ loading && (
						<PreviewBlock
							className="googlesitekit-km-widget-tile__table"
							width="100%"
							height="65px"
						/>
					) }
					{ ! loading && (
						<table className="googlesitekit-km-widget-tile__table">
							<tbody>{ tbody }</tbody>
						</table>
					) }
				</div>
			</div>
		</Widget>
	);
}

MetricTileTable.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	loading: PropTypes.bool,
	title: PropTypes.string,
	rows: PropTypes.array,
	columns: PropTypes.array,
	limit: PropTypes.number,
	zeroState: PropTypes.func,
};
