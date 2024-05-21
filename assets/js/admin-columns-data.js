/**
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

// This file should not use any dependencies because it is used in the frontend.

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';

/**
 * Fetches the current post data for custom columns.
 *
 * @since n.e.x.t
 */
async function fetchColumnsData() {
	const columns = document.querySelectorAll( 'td.column-label' );
	const filteredColumns = {};

	for ( const column of columns ) {
		if ( ! filteredColumns[ column.getAttribute( 'data-colname' ) ] ) {
			filteredColumns[ column.getAttribute( 'data-colname' ) ] = column;
		}
	}

	for ( const column in filteredColumns ) {
		const columnName =
			filteredColumns[ column ].getAttribute( 'data-colname' );
		const postIDs = [];

		const posts = document.querySelectorAll(
			`[data-colname=${ columnName }] .googlesitekit-views-column`
		);

		for ( const post of posts ) {
			postIDs.push( post.getAttribute( 'data-id' ) );
		}

		const data = await API.get(
			'core',
			'admin',
			'columns-data',
			{
				data: {
					post_type: 'post',
					posts: postIDs,
				},
			},
			{ useCache: false }
		);

		if ( data ) {
			for ( const postID in data ) {
				const viewSpan = document.querySelector(
					`.googlesitekit-views-column[data-id="${ postID }"]`
				);
				if ( viewSpan ) {
					viewSpan.textContent = data[ postID ].views;
				}
			}
		}
	}
}

fetchColumnsData();
