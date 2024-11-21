/**
 * TableOverflowContainer stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import TableOverflowContainer from './/TableOverflowContainer';

function Template() {
	const columns = [];
	const rows = [];

	for ( let i = 0; i < 15; i++ ) {
		columns.push(
			<td
				key={ i }
				style={ {
					padding: '20px',
					border: '1px solid #000',
					whiteSpace: 'nowrap',
				} }
			>
				long content goes here.
			</td>
		);
	}

	for ( let i = 0; i < 30; i++ ) {
		rows.push( <tr key={ i }>{ columns }</tr> );
	}

	return (
		<TableOverflowContainer>
			<table className="googlesitekit-table__wrapper googlesitekit-table__wrapper--3-col">
				<tbody>{ rows }</tbody>
			</table>
		</TableOverflowContainer>
	);
}

export const Default = Template.bind( {} );

export default {
	title: 'Components/TableOverflowContainer',
	component: TableOverflowContainer,
};
