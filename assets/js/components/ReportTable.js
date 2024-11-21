/**
 * Report Table component.
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
import classnames from 'classnames';
import invariant from 'invariant';
import PropTypes from 'prop-types';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Tab, TabBar } from 'googlesitekit-components';
import GatheringDataNotice from './GatheringDataNotice';

export default function ReportTable( props ) {
	const {
		rows,
		columns,
		className,
		limit,
		zeroState: ZeroState,
		gatheringData = false,
		tabbedLayout = false,
	} = props;

	invariant( Array.isArray( rows ), 'rows must be an array.' );
	invariant( Array.isArray( columns ), 'columns must be an array.' );
	columns.forEach( ( { Component, field = null } ) => {
		invariant(
			Component || field !== null,
			'each column must define a Component and/or a field.'
		);
	} );
	invariant(
		Number.isInteger( limit ) || limit === undefined,
		'limit must be an integer, if provided.'
	);

	const mobileColumns = columns.filter( ( col ) => ! col.hideOnMobile );
	const hasBadges = columns.some( ( { badge } ) => !! badge );

	const [ activeColumnIndex, setActiveColumnIndex ] = useState( 0 );

	return (
		<Fragment>
			{ tabbedLayout && (
				<TabBar
					activeIndex={ activeColumnIndex }
					handleActiveIndexUpdate={ setActiveColumnIndex }
				>
					{ columns.map( ( { title, badge } ) => (
						<Tab key={ title } aria-label={ title }>
							{ title }
							{ badge }
						</Tab>
					) ) }
				</TabBar>
			) }
			<div
				className={ classnames(
					'googlesitekit-table',
					'googlesitekit-table--with-list',
					{ 'googlesitekit-table--gathering-data': gatheringData },
					className
				) }
			>
				<table
					className={ classnames(
						'googlesitekit-table__wrapper',
						`googlesitekit-table__wrapper--${ columns.length }-col`,
						`googlesitekit-table__wrapper--mobile-${ mobileColumns.length }-col`
					) }
				>
					{ ! tabbedLayout && (
						<thead className="googlesitekit-table__head">
							{ hasBadges && (
								<tr
									className={ classnames(
										'googlesitekit-table__head-badges',
										{
											'hidden-on-mobile': ! columns.some(
												( { badge, hideOnMobile } ) =>
													!! badge && ! hideOnMobile
											),
										}
									) }
								>
									{ columns.map(
										(
											{
												badge,
												primary,
												hideOnMobile,
												className: columnClassName,
											},
											colIndex
										) => (
											<th
												className={ classnames(
													'googlesitekit-table__head-item',
													'googlesitekit-table__head-item--badge',
													{
														'googlesitekit-table__head-item--primary':
															primary,
														'hidden-on-mobile':
															hideOnMobile,
													},
													columnClassName
												) }
												key={ `googlesitekit-table__head-row-badge-${ colIndex }` }
											>
												{ badge }
											</th>
										)
									) }
								</tr>
							) }
							<tr className="googlesitekit-table__head-row">
								{ columns.map(
									(
										{
											title,
											description,
											primary,
											hideOnMobile,
											className: columnClassName,
										},
										colIndex
									) => (
										<th
											className={ classnames(
												'googlesitekit-table__head-item',
												{
													'googlesitekit-table__head-item--primary':
														primary,
													'hidden-on-mobile':
														hideOnMobile,
												},
												columnClassName
											) }
											data-tooltip={ description }
											key={ `googlesitekit-table__head-row-${ colIndex }` }
										>
											{ title }
										</th>
									)
								) }
							</tr>
						</thead>
					) }

					<tbody className="googlesitekit-table__body">
						{ gatheringData && (
							<tr className="googlesitekit-table__body-row googlesitekit-table__body-row--no-data">
								<td
									className="googlesitekit-table__body-item"
									colSpan={ columns.length }
								>
									<GatheringDataNotice />
								</td>
							</tr>
						) }
						{ ! gatheringData && ! rows?.length && ZeroState && (
							<tr className="googlesitekit-table__body-row googlesitekit-table__body-row--no-data">
								<td
									className="googlesitekit-table__body-item"
									colSpan={ columns.length }
								>
									<ZeroState />
								</td>
							</tr>
						) }

						{ ! gatheringData &&
							rows.slice( 0, limit ).map( ( row, rowIndex ) => (
								<tr
									className="googlesitekit-table__body-row"
									key={ `googlesitekit-table__body-row-${ rowIndex }` }
								>
									{ columns.map(
										(
											{
												Component,
												field,
												hideOnMobile,
												className: columnClassName,
											},
											colIndex
										) => {
											const fieldValue =
												field !== undefined
													? get( row, field )
													: undefined;
											return (
												<td
													key={ `googlesitekit-table__body-item-${ colIndex }` }
													className={ classnames(
														'googlesitekit-table__body-item',
														{
															'hidden-on-mobile':
																hideOnMobile,
														},
														columnClassName
													) }
												>
													<div className="googlesitekit-table__body-item-content">
														{ Component && (
															<Component
																row={ row }
																fieldValue={
																	fieldValue
																}
															/>
														) }
														{ ! Component &&
															fieldValue }
													</div>
												</td>
											);
										}
									) }
								</tr>
							) ) }
					</tbody>
				</table>
			</div>
		</Fragment>
	);
}

ReportTable.propTypes = {
	rows: PropTypes.arrayOf(
		PropTypes.oneOfType( [ PropTypes.array, PropTypes.object ] )
	).isRequired,
	columns: PropTypes.arrayOf(
		PropTypes.shape( {
			title: PropTypes.string,
			description: PropTypes.string,
			primary: PropTypes.bool,
			className: PropTypes.string,
			field: PropTypes.string,
			hideOnMobile: PropTypes.bool,
			Component: PropTypes.componentType,
			badge: PropTypes.node,
		} )
	).isRequired,
	className: PropTypes.string,
	limit: PropTypes.number,
	zeroState: PropTypes.func,
	gatheringData: PropTypes.bool,
	tabbedLayout: PropTypes.bool,
};
