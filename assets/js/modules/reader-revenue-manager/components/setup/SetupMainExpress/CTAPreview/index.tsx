/**
 * Reader Revenue Manager CTAPreview component.
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
import classnames from 'classnames';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import InlineBackgroundSVG from '@/svg/graphics/inline-background.svg';
import PopupBackgroundSVG from '@/svg/graphics/popup-background.svg';

interface Props {
	title?: string;
	description?: string;
	footer?: string;
	popupContent?: ReactNode;
	inlineContent?: ReactNode;
}

const CTA_PREVIEW_TAB_POPUP = 0;
const CTA_PREVIEW_TAB_INLINE = 1;
const POPUP_TAB_ID = 'googlesitekit-rrm-cta-preview-tab-popup';
const INLINE_TAB_ID = 'googlesitekit-rrm-cta-preview-tab-inline';

export default function CTAPreview( {
	title = __( 'See how it looks', 'google-site-kit' ),
	description = __(
		'The CTA will be implemented automatically as a pop-up. To display it inline, you will need to add a code snippet to the relevant page.',
		'google-site-kit'
	),
	footer = __(
		'Preview intended for visualization purpose only. Verify final appearance on your website.',
		'google-site-kit'
	),
	popupContent,
	inlineContent,
}: Props ) {
	const [ activeTab, setActiveTab ] = useState( CTA_PREVIEW_TAB_POPUP );

	return (
		<div className="googlesitekit-rrm-cta-preview">
			<div className="googlesitekit-rrm-cta-preview__header">
				<Typography
					as="h3"
					type="title"
					size="small"
					className="googlesitekit-rrm-cta-preview__title"
				>
					{ title }
				</Typography>
				<Typography
					as="p"
					type="body"
					size="small"
					className="googlesitekit-rrm-cta-preview__description"
				>
					{ description }
				</Typography>
			</div>
			<div className="googlesitekit-rrm-cta-preview__tabs">
				<TabBar
					activeIndex={ activeTab }
					handleActiveIndexUpdate={ setActiveTab }
				>
					<Tab id={ POPUP_TAB_ID } focusOnActivate={ false }>
						<span className="mdc-tab__text-label">
							{ __( 'Pop-up', 'google-site-kit' ) }
						</span>
					</Tab>
					<Tab id={ INLINE_TAB_ID } focusOnActivate={ false }>
						<span className="mdc-tab__text-label">
							{ __( 'Inline', 'google-site-kit' ) }
						</span>
					</Tab>
				</TabBar>
			</div>
			<div className="googlesitekit-rrm-cta-preview__stage">
				{ activeTab === CTA_PREVIEW_TAB_POPUP && (
					<div
						className={ classnames(
							'googlesitekit-rrm-cta-preview__panel',
							'googlesitekit-rrm-cta-preview__panel--popup'
						) }
						role="tabpanel"
						aria-labelledby={ POPUP_TAB_ID }
					>
						<PopupBackgroundSVG
							width="288"
							height="350"
							className="googlesitekit-rrm-cta-preview__background-image"
							aria-hidden="true"
						/>
						<div className="googlesitekit-rrm-cta-preview__panel-content">
							{ popupContent }
						</div>
					</div>
				) }
				{ activeTab === CTA_PREVIEW_TAB_INLINE && (
					<div
						className={ classnames(
							'googlesitekit-rrm-cta-preview__panel',
							'googlesitekit-rrm-cta-preview__panel--inline'
						) }
						role="tabpanel"
						aria-labelledby={ INLINE_TAB_ID }
					>
						<InlineBackgroundSVG
							width="288"
							height="350"
							className="googlesitekit-rrm-cta-preview__background-image"
							aria-hidden="true"
						/>
						<div className="googlesitekit-rrm-cta-preview__panel-content">
							{ inlineContent }
						</div>
					</div>
				) }
			</div>
			{ footer && (
				<Typography
					as="p"
					type="body"
					size="small"
					className="googlesitekit-rrm-cta-preview__footer"
				>
					{ footer }
				</Typography>
			) }
		</div>
	);
}
