/**
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

import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import './editor.scss';
import { useEffect } from 'react';

/**
 * Memorable Quotes Block Edit component.
 *
 * @since n.e.x.t
 *
 * @return {Element} Element to render.
 */
export default function Edit() {
	const blockProps = useBlockProps();
	const [ quotes, setQuotes ] = useState( undefined );

	useEffect( () => {
		wp.apiFetch( {
			path: '/google-site-kit/v1/core/site/data/memorable-quotes',
		} ).then( ( data ) => {
			setQuotes(
				data?.memorableQuotes?.filter(
					( { published } ) => published
				) || []
			);
		} );
	}, [] );

	return (
		<div { ...blockProps }>
			{ ! quotes && 'Loading...' }
			{ quotes && quotes.length === 0 && 'No Posts' }
			{ quotes &&
				quotes.length > 0 &&
				quotes.map( ( { id, quote, author } ) => (
					<div key={ id }>
						{ /* Link should not be clickable within the editor. */ }
						{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
						<a href="#">&quot;{ quote }&quot;</a>
						{ author && ` - ${ author }` }
					</div>
				) ) }
		</div>
	);
}
