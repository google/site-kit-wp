/**
 * WhatsNewEmptyState component.
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
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import whatsNewEmptyURL from '@/svg/graphics/whats-new-empty.svg?path';

interface WhatsNewEmptyStateProps {
	onClickEmpty: () => void;
}

const WhatsNewEmptyState = forwardRef<
	HTMLDivElement,
	WhatsNewEmptyStateProps
>( ( { onClickEmpty }, ref ) => (
	<div className="googlesitekit-whats-new__empty-state" ref={ ref }>
		<img src={ whatsNewEmptyURL } alt="" width={ 189 } height={ 193 } />

		<Typography
			as="h2"
			className="googlesitekit-whats-new__empty-state-heading"
			size={ SIZE_SMALL }
			type={ TYPE_HEADLINE }
		>
			{ __( 'You’re up to date!', 'google-site-kit' ) }
		</Typography>

		<P
			className="googlesitekit-whats-new__empty-state-description"
			size={ SIZE_MEDIUM }
		>
			{ __(
				'There are no new feature announcements right now, but you can explore other features that will help you grow your site',
				'google-site-kit'
			) }
		</P>

		{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
		<Button
			className="googlesitekit-whats-new__empty-state-button"
			onClick={ onClickEmpty }
		>
			{ __( 'Explore features', 'google-site-kit' ) }
		</Button>
	</div>
) );

WhatsNewEmptyState.displayName = 'WhatsNewEmptyState';

export default WhatsNewEmptyState;
