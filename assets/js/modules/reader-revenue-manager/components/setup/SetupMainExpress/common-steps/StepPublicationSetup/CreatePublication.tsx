/**
 * Reader Revenue Manager create publication component.
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
import { ChangeEvent, FC, useEffect } from 'react';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox, SpinnerButton, TextField } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import DocumentationLink from '@/js/components/DocumentationLink';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	ExpressSetupStepDetails,
	ExpressSetupStepHeadline,
} from '@/js/modules/reader-revenue-manager/components/common';
import PublicationSetupLanguageSelect from '@/js/modules/reader-revenue-manager/components/common/ExpressSetupLanguageSelect';
import PublicationSetupRegionSelect from '@/js/modules/reader-revenue-manager/components/common/ExpressSetupRegionSelect';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	CREATE_PUBLICATION_FORM,
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

interface CreatePublicationProps {
	description?: string;
	onComplete: ( hasAcceptedTerms: boolean ) => void;
}

const CreatePublication: FC< CreatePublicationProps > = ( {
	description,
	onComplete,
} ) => {
	const [ isBusy, setIsBusy ] = useState( false );

	const defaultDescription = __(
		'To use Reader Revenue Manager, you will need to create a publication.',
		'google-site-kit'
	);

	const descriptionWithLink = createInterpolateElement(
		sprintf(
			/* translators: %s: Connect publication setup step description. */
			__( '%s <a>Learn more</a>', 'google-site-kit' ),
			description || defaultDescription
		),
		{
			a: <DocumentationLink slug="rrm-publication" external />,
		}
	);

	const locale: string | undefined = useSelect(
		( select: Select ) => select( CORE_SITE ).getSiteLocale(),
		[]
	);

	const [ defaultLanguageCode, defaultRegionCode ] =
		locale?.split( '-' ) || [];

	const {
		createPublication,
		resetPublications,
		selectPublication,
		submitChanges,
	} = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const [ languageCode = defaultLanguageCode, setLanguageCode ] =
		useFormValue< string >(
			READER_REVENUE_MANAGER_SETUP_FORM,
			CREATE_PUBLICATION_FORM.LANGUAGE_CODE
		);

	const [ displayName, setDisplayName ] = useFormValue< string >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		CREATE_PUBLICATION_FORM.DISPLAY_NAME
	);

	const [ regionCode = defaultRegionCode, setRegionCode ] =
		useFormValue< string >(
			READER_REVENUE_MANAGER_SETUP_FORM,
			CREATE_PUBLICATION_FORM.REGION_CODE
		);

	const [ certifyRegion, setCertifyRegion ] = useFormValue< boolean >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		CREATE_PUBLICATION_FORM.CERTIFY_REGION
	);

	const [ , setShowPublicationCreate ] = useFormValue< boolean >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		SHOW_PUBLICATION_CREATE
	);

	const isDoingSubmitChanges: boolean | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges(),
		[]
	);

	const isFetchingCreatePublication: boolean | undefined = useSelect(
		( select: Select ) =>
			select(
				MODULES_READER_REVENUE_MANAGER
			).isFetchingCreatePublication( {
				displayName,
				languageCode,
				regionCode,
			} ),
		[ displayName, languageCode, regionCode ]
	);

	const siteName: string | undefined = useSelect(
		( select: Select ) => select( CORE_SITE ).getSiteName(),
		[]
	);

	const siteURL: string | undefined = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const onSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();

			setIsBusy( true );

			const { response, error } = await createPublication( {
				displayName,
				languageCode,
				regionCode,
			} );

			if ( error ) {
				setIsBusy( false );
				return;
			}

			selectPublication( response );

			const { error: submitChangesError } = await submitChanges();

			if ( submitChangesError ) {
				resetPublications();
				setShowPublicationCreate( false );
				setIsBusy( false );
				return;
			}

			onComplete( false );
		},
		[
			createPublication,
			displayName,
			languageCode,
			onComplete,
			regionCode,
			resetPublications,
			selectPublication,
			setShowPublicationCreate,
			submitChanges,
		]
	);

	const isValid = certifyRegion && displayName && languageCode && regionCode;

	const isSaving =
		isDoingSubmitChanges || isFetchingCreatePublication || isBusy;

	const isDisabled = isSaving || ! isValid;

	useEffect( () => {
		if ( siteName && displayName === undefined ) {
			setDisplayName( siteName );
		}
	}, [ displayName, setDisplayName, siteName ] );

	return (
		<form
			className="googlesitekit-rrm-express-setup-step__form"
			onSubmit={ onSubmit }
		>
			<div className="googlesitekit-rrm-express-setup-step__form-content">
				<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
					{ __( "Let's get started!", 'google-site-kit' ) }
				</ExpressSetupStepHeadline>

				<StoreErrorNotices
					moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
					storeName={ MODULES_READER_REVENUE_MANAGER }
				/>

				<P
					className="googlesitekit-rrm-express-setup-step__description"
					size={ SIZE_MEDIUM }
				>
					{ descriptionWithLink }
				</P>

				<div className="googlesitekit-rrm-express-setup-step__form-controls googlesitekit-rrm-express-setup-step__form-controls--create">
					<ExpressSetupStepDetails>
						{ ( Item ) => (
							<Item
								description={ siteURL }
								term={ __( 'URL', 'google-site-kit' ) }
							/>
						) }
					</ExpressSetupStepDetails>
					<TextField
						className="googlesitekit-rrm-express-setup-step__field googlesitekit-rrm-express-setup-step__field--full-width"
						id={ CREATE_PUBLICATION_FORM.DISPLAY_NAME }
						label={ __( 'Name', 'google-site-kit' ) }
						onChange={ ( event ) =>
							setDisplayName( event.target.value )
						}
						value={ displayName || '' }
						outlined
					/>
					<PublicationSetupLanguageSelect
						className="googlesitekit-rrm-express-setup-step__field"
						id={ CREATE_PUBLICATION_FORM.LANGUAGE_CODE }
						onChange={ setLanguageCode }
						value={ languageCode }
					/>
					<PublicationSetupRegionSelect
						className="googlesitekit-rrm-express-setup-step__field"
						id={ CREATE_PUBLICATION_FORM.REGION_CODE }
						onChange={ setRegionCode }
						value={ regionCode }
					/>
				</div>
				<Checkbox
					checked={ certifyRegion }
					id={ CREATE_PUBLICATION_FORM.CERTIFY_REGION }
					name={ CREATE_PUBLICATION_FORM.CERTIFY_REGION }
					onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
						setCertifyRegion( event.target.checked )
					}
					value="1"
				>
					{ __(
						'By checking this box, you certify that your publication is principally and permanently located in the country you selected',
						'google-site-kit'
					) }
				</Checkbox>
			</div>
			{ /* @ts-expect-error - The `SpinnerButton` component is not typed yet. */ }
			<SpinnerButton
				disabled={ isDisabled }
				isSaving={ isSaving }
				type="submit"
			>
				{ __( 'Create publication', 'google-site-kit' ) }
			</SpinnerButton>
		</form>
	);
};

export default CreatePublication;
