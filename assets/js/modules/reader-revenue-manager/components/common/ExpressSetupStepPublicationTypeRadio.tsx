/**
 * External dependencies
 */
import { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Radio } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import {
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import { PUBLICATION_TYPES } from '@/js/modules/reader-revenue-manager/datastore/constants';

interface ExpressSetupStepPublicationTypeRadioProps {
	name: string;
	onChange: ( value: string ) => void;
	value: string;
}

const ExpressSetupStepPublicationTypeRadio: FC<
	ExpressSetupStepPublicationTypeRadioProps
> = ( { name, onChange, value } ) => {
	const descriptionID = useInstanceId(
		ExpressSetupStepPublicationTypeRadio,
		name
	) as string;

	const forProfitID = useInstanceId(
		ExpressSetupStepPublicationTypeRadio,
		PUBLICATION_TYPES.FOR_PROFIT
	) as string;

	const nonProfitID = useInstanceId(
		ExpressSetupStepPublicationTypeRadio,
		PUBLICATION_TYPES.NON_PROFIT
	) as string;

	return (
		<fieldset
			aria-describedby={ descriptionID }
			className="googlesitekit-rrm-express-setup-fieldset"
		>
			<Typography
				as="legend"
				className="googlesitekit-rrm-express-setup-fieldset__legend"
				size={ SIZE_SMALL }
				type={ TYPE_TITLE }
			>
				{ __( 'Publication status', 'google-site-kit' ) }
			</Typography>
			<Typography
				as="div"
				className="googlesitekit-color--surfaces-on-background-variant"
				id={ descriptionID }
				size={ SIZE_SMALL }
				type={ TYPE_BODY }
			>
				{ __(
					"Reader Revenue Manager doesn't offer subscription or contribution features for non-profit publishers.",
					'google-site-kit'
				) }
			</Typography>
			<div className="googlesitekit-rrm-express-setup-fieldset__options">
				<Radio
					checked={ value === PUBLICATION_TYPES.FOR_PROFIT }
					id={ forProfitID }
					name={ name }
					onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
						onChange( event.target.value )
					}
					value={ PUBLICATION_TYPES.FOR_PROFIT }
				>
					{ __( 'For profit', 'google-site-kit' ) }
				</Radio>
				<Radio
					checked={ value === PUBLICATION_TYPES.NON_PROFIT }
					id={ nonProfitID }
					name={ name }
					onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
						onChange( event.target.value )
					}
					value={ PUBLICATION_TYPES.NON_PROFIT }
				>
					{ __( 'Non-profit', 'google-site-kit' ) }
				</Radio>
			</div>
		</fieldset>
	);
};

export default ExpressSetupStepPublicationTypeRadio;
