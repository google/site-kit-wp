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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import MetricTileError from './MetricTileError';
import MetricTileLoader from './MetricTileLoader';
import MetricTileHeader from './MetricTileHeader';

export default function MetricTileTable( props ) {
	const {
		Widget,
		loading,
		title,
		rows = [],
		columns = [],
		limit,
		infoTooltip,
		ZeroState,
		error,
		moduleSlug,
	} = props;

	if ( error ) {
		return (
			<MetricTileError
				moduleSlug={ moduleSlug }
				error={ error }
				headerText={ title }
			/>
		);
	}

	let tileBody = null;

	if ( rows?.length > 0 ) {
		tileBody = rows
			.slice( 0, limit || rows.length )
			.map( ( row, rowIndex ) => (
				<div key={ rowIndex } className="googlesitekit-table__body-row">
					{ columns.map(
						( { Component, field, className }, colIndex ) => {
							const fieldValue =
								field !== undefined
									? get( row, field )
									: undefined;

							return (
								<div
									key={ colIndex }
									className={ classnames(
										'googlesitekit-table__body-item',
										className
									) }
								>
									{ Component && (
										<Component
											row={ row }
											fieldValue={ fieldValue }
										/>
									) }
									{ ! Component && fieldValue }
								</div>
							);
						}
					) }
				</div>
			) );
	} else if ( !! ZeroState ) {
		tileBody = (
			<div className="googlesitekit-table__body-row googlesitekit-table__body-row--no-data">
				<div className="googlesitekit-table__body-zero-data">
					<ZeroState />
				</div>
			</div>
		);
	}

	return (
		<Widget noPadding>
			<div className="googlesitekit-km-widget-tile googlesitekit-km-widget-tile--table">
				<MetricTileHeader title={ title } infoTooltip={ infoTooltip } />
				<div className="googlesitekit-km-widget-tile__body">
					{ loading && <MetricTileLoader /> }
					{ ! loading && (
						<div className="googlesitekit-km-widget-tile__table">
							{ tileBody }
						</div>
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
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	ZeroState: PropTypes.elementType,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ),
	moduleSlug: PropTypes.string.isRequired,
};
