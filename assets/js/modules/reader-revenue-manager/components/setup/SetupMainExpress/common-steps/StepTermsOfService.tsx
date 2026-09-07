/**
 * Reader Revenue Manager express setup terms of service step.
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
import { ChangeEvent, FC, FormEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox, SpinnerButton } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import DocumentationLink from '@/js/components/DocumentationLink';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import ProgressBar from '@/js/googlesitekit/components-gm2/ProgressBar';
import useFormValue from '@/js/hooks/useFormValue';
import {
	ExpressSetupStepHeadline,
	ExpressSetupStepPublicationTypeRadio,
} from '@/js/modules/reader-revenue-manager/components/common';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_TYPES,
	READER_REVENUE_MANAGER_SETUP_FORM,
	TERMS_OF_SERVICE_FORM,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { sanitizeHTML } from '@/js/util';

interface StepTermsOfServiceProps {
	description?: string;
	onComplete: () => void;
}

const StepTermsOfService: FC< StepTermsOfServiceProps > = ( {
	description,
	onComplete,
} ) => {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );

	const defaultDescription = __(
		'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
		'google-site-kit'
	);

	const descriptionWithLink = createInterpolateElement(
		sprintf(
			/* translators: %s: Terms of Service setup step description. */
			__( '%s <a>Learn more</a>', 'google-site-kit' ),
			description || defaultDescription
		),
		{
			a: <DocumentationLink slug="rrm-publication-tos" external />,
		}
	);

	const [
		publicationType = PUBLICATION_TYPES.FOR_PROFIT,
		setPublicationType,
	] = useFormValue< string >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		TERMS_OF_SERVICE_FORM.PUBLICATION_TYPE
	);

	const [ emailOptIn = false, setEmailOptIn ] = useFormValue< boolean >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		TERMS_OF_SERVICE_FORM.EMAIL_OPT_IN
	);

	const { updatePublication } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const publication: Publication | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublication(),
		[]
	);

	// eslint-disable-next-line sitekit/acronym-case
	const tosURL = publication?.rrmProduct?.productTosUrl;

	const termsOfService: string | undefined = useSelect(
		( select: Select ) =>
			tosURL
				? select( MODULES_READER_REVENUE_MANAGER ).getTermsOfService( {
						tosURL,
				  } )
				: undefined,
		[ tosURL ]
	);

	const hasResolvedPublication: boolean = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getPublication',
				[]
			),
		[]
	);

	const hasResolvedTermsOfService: boolean = useSelect(
		( select: Select ) =>
			! tosURL ||
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getTermsOfService',
				[ { tosURL } ]
			),
		[ tosURL ]
	);

	const onSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();

			if ( ! publication || ! termsOfService ) {
				return;
			}

			setIsSaving( true );

			const { error } = await updatePublication( {
				data: {
					publicationType,
					rrmProduct: {
						tosAcceptance: {
							emailOptIn,
							userAccepted: true,
						},
					},
				},
			} );

			if ( error ) {
				setIsSaving( false );
				return;
			}

			onComplete();
		},
		[
			emailOptIn,
			onComplete,
			publication,
			publicationType,
			termsOfService,
			updatePublication,
		]
	);

	useEffect( () => {
		if ( hasResolvedPublication && hasResolvedTermsOfService ) {
			setIsLoading( false );
		}
	}, [ hasResolvedPublication, hasResolvedTermsOfService ] );

	if ( isLoading ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-rrm-express-setup-step">
			<form
				className="googlesitekit-rrm-express-setup-step__form"
				onSubmit={ onSubmit }
			>
				<div className="googlesitekit-rrm-express-setup-step__form-content">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ __( 'Terms of service', 'google-site-kit' ) }
					</ExpressSetupStepHeadline>

					<StoreErrorNotices
						moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
						storeName={ MODULES_READER_REVENUE_MANAGER }
						hasButton
					/>

					<P
						className="googlesitekit-rrm-express-setup-step__description"
						size={ SIZE_MEDIUM }
					>
						{ descriptionWithLink }
					</P>

					<div className="googlesitekit-rrm-express-setup-step__form-controls googlesitekit-rrm-express-setup-step__form-controls--terms-of-service">
						{ termsOfService ? (
							<Typography
								as="div"
								className="googlesitekit-rrm-express-setup-terms-of-service"
								dangerouslySetInnerHTML={ sanitizeHTML(
									termsOfService
								) }
								size={ SIZE_MEDIUM }
								type={ TYPE_BODY }
							>
								{ null }
							</Typography>
						) : null }

						<ExpressSetupStepPublicationTypeRadio
							name={ TERMS_OF_SERVICE_FORM.PUBLICATION_TYPE }
							onChange={ setPublicationType }
							value={ publicationType }
						/>

						<Checkbox
							checked={ emailOptIn }
							id={ TERMS_OF_SERVICE_FORM.EMAIL_OPT_IN }
							name={ TERMS_OF_SERVICE_FORM.EMAIL_OPT_IN }
							onChange={ (
								event: ChangeEvent< HTMLInputElement >
							) => setEmailOptIn( event.target.checked ) }
							value="1"
						>
							<Typography
								as="span"
								className=""
								size={ SIZE_SMALL }
								type={ TYPE_BODY }
							>
								{ __(
									'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
									'google-site-kit'
								) }
							</Typography>
						</Checkbox>
					</div>
				</div>

				{ /* @ts-expect-error `SpinnerButton` component is not yet typed. */ }
				<SpinnerButton
					disabled={ ! termsOfService || isSaving }
					isSaving={ isSaving }
					type="submit"
				>
					{ __( 'I agree', 'google-site-kit' ) }
				</SpinnerButton>
			</form>
		</div>
	);
};

export default StepTermsOfService;
