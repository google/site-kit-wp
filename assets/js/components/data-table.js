/**
 * DataTable component.
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
import SourceLink from 'GoogleComponents/source-link';
import Link from 'GoogleComponents/link';
import {
	each,
	debounce,
	trim,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';

// Construct a table component from a data object.
export const getDataTableFromData = ( data, headers, options ) => {
	const headerRows = [];
	const dataRows = [];

	each( headers, ( header, i ) => {
		headerRows.push(
			<th key={ 'gksc_data_row_header-' + i } className="googlesitekit-table__head-item" data-tooltip={ header.tooltip }>
				{ header.title }
			</th>
		);
	} );

	const headerRow = (
		<tr
			key={ 'gksc_data_row_header-wrap' }
			style={ ( options && options.hideHeader ) ? { display: 'none' } : {} }
			className="googlesitekit-table__head-row">
			{ headerRows }
		</tr>
	);

	const { links, source, showURLs } = options;

	if ( options.cap ) {
		data = data.slice( 0, options.cap );
	}

	each( data, ( row, j ) => {
		const cells = [];
		const link = links && links[ j ];

		each( row, ( cell, i ) => {
			// Replace (none) by direct.
			if ( 'string' === typeof cell ) {
				cell = cell.replace( /\(none\)/gi, 'direct' );
			}

			cells.push(
				<td key={ 'cell-' + i } className="googlesitekit-table__body-item">
					{ row[ 0 ] === cell && link ?
						<div className="googlesitekit-table__body-item-content">
							<Link
								className="googlesitekit-table__body-item-link"
								href={ link }
								external
								inherit
							>
								{ cell }
							</Link>
							<br />
							{ showURLs && '' !== trim( link, '/' ) &&
								<Link
									className="googlesitekit-table__body-item-url"
									href={ link }
									inherit
									external
								>
									{ trim( link, '/' ) }
								</Link>
							}
						</div> :
						<div className="googlesitekit-table__body-item-content">{ cell }</div>
					}
				</td>
			);
		} );

		dataRows.push(
			<tr key={ 'tr-' + j } className="googlesitekit-table__body-row">
				{ cells }
			</tr>
		);
	} );

	return (
		<div className={ `googlesitekit-table${ ( options && options.disableListMode ? '' : ' googlesitekit-table--with-list' ) }` }>
			<table key={ 'gksc_data_table' } className="googlesitekit-table__wrapper">
				<thead className="googlesitekit-table__head">
					{ headerRow }
				</thead>
				<tbody className="googlesitekit-table__body">
					{ dataRows }
				</tbody>
			</table>
			{ source && (
				<SourceLink
					className="googlesitekit-table__source"
					name={ source.name }
					href={ source.link }
				/>
			) }
		</div>
	);
};

export class TableOverflowContainer extends Component {
	constructor() {
		super();

		this.state = {
			isScrolling: false,
		};

		this.scrollRef = createRef();

		this.updateFadeOnScroll = this.updateFadeOnScroll.bind( this );
	}

	componentDidMount() {
		const self = this;

		// Check for scrolling on load and resize.
		self.updateFadeOnScroll();

		this.resize = debounce( function() {
			self.updateFadeOnScroll();
		}, 100 );

		window.addEventListener( 'resize', this.resize );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.resize );
	}

	updateFadeOnScroll() {
		const { scrollLeft, scrollWidth, offsetWidth } = this.scrollRef.current;
		const maxScroll = scrollWidth - offsetWidth;
		const scrolling = scrollLeft < ( maxScroll - 16 ) && 0 < ( maxScroll - 16 ); // 16 = $grid-gap-phone

		this.setState( {
			isScrolling: scrolling,
		} );
	}

	render() {
		const { children } = this.props;
		const { isScrolling } = this.state;

		return (
			<div
				onScroll={ debounce( this.updateFadeOnScroll, 100 ) }
				className={ `
					googlesitekit-table-overflow
					${ isScrolling ? 'googlesitekit-table-overflow--gradient' : '' }
				` }>
				<div ref={ this.scrollRef } className="googlesitekit-table-overflow__container">
					{ children }
				</div>
			</div>
		);
	}
}

TableOverflowContainer.propTypes = {
	children: PropTypes.element,
};
