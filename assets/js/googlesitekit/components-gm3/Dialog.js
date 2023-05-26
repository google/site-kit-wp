/**
 * Dialog component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

import { MdDialog } from '@material/web/dialog/dialog';
import { createComponent } from '@lit-labs/react';
import * as WordPressElement from '@wordpress/element';

const MdDialogComponent = createComponent( {
	tagName: 'md-dialog',
	elementClass: MdDialog,
	react: WordPressElement,
} );

export default function Dialog( { open, title, content, footer } ) {
	return (
		<MdDialogComponent open={ open || null }>
			<div slot="header">
				<h2 slot="headline">{ title }</h2>
			</div>
			{
				// This will go in the default content slot:
				content
			}
			<div slot="footer" style={ { display: 'contents' } }>
				{ footer }
			</div>
		</MdDialogComponent>
	);
}
