/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
// eslint-disable-next-line import/no-unresolved
import { useBlockProps } from '@wordpress-core/block-editor';
// import { useState, useEffect } from '@wordpress-core/element';

// import './editor.scss';

/**
 * Sign in with Google Block Edit component.
 *
 * @since n.e.x.t
 *
 * @return {Element} Element to render.
 */
export default function Edit() {
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>Sign in with Google block edit component.</div>
	);
}
