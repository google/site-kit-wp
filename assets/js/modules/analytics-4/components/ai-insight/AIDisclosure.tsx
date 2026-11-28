/**
 * AIDisclosure component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DocumentationLink from '@/js/components/DocumentationLink';
import { SIZE_SMALL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import AIIcon from './AIIcon';

interface AIDisclosureProps {
	/**
	 * The disclosure. Without it, the component shows the disclosure for one
	 * section, with a link to the AI insights support page.
	 */
	children?: ReactNode;
}

const AIDisclosure: FC< AIDisclosureProps > = ( { children } ) => (
	<div className="googlesitekit-ai-disclosure">
		<AIIcon />
		<P className="googlesitekit-ai-disclosure__text" size={ SIZE_SMALL }>
			{ children ??
				createInterpolateElement(
					__(
						'This section contains data created using AI and may contain mistakes. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: <DocumentationLink slug="ai-insights" />,
					}
				) }
		</P>
	</div>
);

export default AIDisclosure;
