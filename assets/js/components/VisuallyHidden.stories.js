/**
 * VisuallyHidden stories.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisuallyHidden from './VisuallyHidden';

function Template() {
	return (
		<div>
			<div>
				<span style={ { marginRight: '20px' } }>VisuallyHidden:</span>
				<div
					style={ {
						padding: '10px',
						background: '#e3e3e3',
						display: 'inline-block',
						verticalAlign: 'text-bottom',
					} }
				>
					<VisuallyHidden style={ { background: '#fff' } }>
						{ __( 'Child Content1', 'google-site-kit' ) }
					</VisuallyHidden>
				</div>
			</div>

			<div style={ { marginTop: '20px' } }>
				<span style={ { marginRight: '20px' } }>Span:</span>
				<div
					style={ {
						padding: '10px',
						background: '#e3e3e3',
						display: 'inline-block',
					} }
				>
					<span style={ { background: '#fff' } }>
						{ __( 'Child Content', 'google-site-kit' ) }
					</span>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );

export default {
	title: 'Components/VisuallyHidden',
};
