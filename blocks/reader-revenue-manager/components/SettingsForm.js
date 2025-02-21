// modules/reader-revenue-manager/components/SettingsForm.js
import { __, sprintf } from '@wordpress/i18n';
// eslint-disable-next-line import/no-unresolved
import { SelectControl } from '@wordpress-core/components';
// eslint-disable-next-line import/no-unresolved
import { Fragment, useState } from '@wordpress-core/element';
import Data from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '../../../assets/js/modules/reader-revenue-manager/datastore/constants';

const { select, dispatch } = Data;

const CORE_EDITOR = 'core/editor';

export default function SettingsForm() {
	const productIDs =
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs() || [];
	const publicationID = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublicationID();
	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;
	const metaValue =
		select( CORE_EDITOR ).getEditedPostAttribute( 'meta' )?.[ metaKey ] ||
		'';
	const [ selectedValue, setSelectedValue ] = useState( metaValue );

	const help =
		selectedValue === ''
			? null
			: __(
					'This will override any other settings you might have applied in Site Kit.',
					'google-site-kit'
			  );

	function onChange( value ) {
		setSelectedValue( value );
		dispatch( CORE_EDITOR ).editPost( {
			meta: {
				[ metaKey ]: value,
			},
		} );
	}

	return (
		<Fragment>
			<SelectControl
				className="googlesitekit-rrm-panel__select-control"
				label={ __(
					'Decide how site visitors should access this post (if they will see CTAs by Reader Revenue Manager, which you activated via Site Kit):',
					'google-site-kit'
				) }
				onChange={ onChange }
				value={ selectedValue }
				options={ [
					{
						label: __(
							'Keep the default selection',
							'google-site-kit'
						),
						value: '',
					},
					{
						label: __(
							'Exclude from Reader Revenue Manager',
							'google-site-kit'
						),
						value: 'none',
					},
					{
						label: __( 'Use "open access"', 'google-site-kit' ),
						value: 'openaccess',
					},
					...productIDs.map( ( productID ) => {
						const productIDParts = productID.split( ':' );
						const label =
							productIDParts.length > 1
								? productIDParts[ 1 ]
								: productID;
						return {
							label: sprintf(
								/* translators: %s: Product ID */
								__( 'Use "%s"', 'google-site-kit' ),
								label
							),
							value: productID,
						};
					} ),
				] }
				help={ help }
			/>
		</Fragment>
	);
}
