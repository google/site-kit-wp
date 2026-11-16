/**
 * Reader Revenue Manager Survey CTA preview pane.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';

interface PreviewProps {
	publicationName?: string;
	question: string;
	questionAnswers: string[];
	questionCount: number;
	surveyText?: string;
}

const Preview: FC< PreviewProps > = ( {
	publicationName,
	question,
	questionAnswers,
	questionCount,
	surveyText,
} ) => {
	const instanceID = useInstanceId(
		Preview,
		'googlesitekit-rrm-cta-preview-pane'
	);

	return (
		<div className="googlesitekit-rrm-cta-preview-pane googlesitekit-rrm-cta-preview-pane--survey">
			<div className="googlesitekit-rrm-cta-preview-pane__header">
				<P
					className="googlesitekit-rrm-cta-preview-pane__publication"
					size={ SIZE_SMALL }
				>
					{ publicationName ||
						__( 'Publication name', 'google-site-kit' ) }
				</P>
				{ surveyText && (
					<P size={ SIZE_SMALL } type={ TYPE_LABEL }>
						{ surveyText }
					</P>
				) }
			</div>
			{ question && (
				<div className="googlesitekit-rrm-cta-preview-pane__survey">
					<div className="googlesitekit-rrm-cta-preview-pane__survey-question">
						<div className="googlesitekit-rrm-cta-preview-pane__survey-legend">
							{ questionCount > 1 && (
								<div className="googlesitekit-rrm-cta-preview-pane__survey-count">
									{ sprintf(
										/* translators: %d: Total number of survey questions. */
										__(
											'question 1 of %d',
											'google-site-kit'
										),
										questionCount
									) }
								</div>
							) }
							<P size={ SIZE_SMALL } type={ TYPE_LABEL }>
								{ question }
							</P>
						</div>
						<div className="googlesitekit-rrm-cta-preview-pane__survey-answers">
							{ questionAnswers.map( ( answer, index ) => (
								<Typography
									as="label"
									className="googlesitekit-rrm-cta-preview-pane__survey-answer"
									htmlFor={ `${ instanceID }-${ index }` }
									key={ index }
									size={ SIZE_SMALL }
									type={ TYPE_BODY }
								>
									<input
										className="googlesitekit-rrm-cta-preview-pane__radio"
										id={ `${ instanceID }-${ index }` }
										name={ `${ instanceID }` }
										type="radio"
										disabled
										readOnly
									/>
									{ answer }
								</Typography>
							) ) }
						</div>
					</div>
					<button
						className="googlesitekit-rrm-cta-preview-pane__button"
						type="button"
						disabled
					>
						{ __( 'Next', 'google-site-kit' ) }
					</button>
				</div>
			) }
			<div className="googlesitekit-rrm-cta-preview-pane__legal">
				{ createInterpolateElement(
					sprintf(
						/* translators: %1$s is the publication name. */
						__(
							'Your responses to this survey are anonymous. Please see the %1$s’s <a>Privacy Policy</a> to learn more about how they use this information. Google collects aggregated anonymous data for performance measurement purposes.',
							'google-site-kit'
						),
						publicationName ||
							__( 'Publication name', 'google-site-kit' )
					),
					{
						a: (
							<span className="googlesitekit-rrm-cta-preview-pane__link" />
						),
					}
				) }
			</div>
		</div>
	);
};

export default Preview;
