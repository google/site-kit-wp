import Data from 'googlesitekit-data';
const { createRegistrySelector } = Data;
import invariant from 'invariant';

export const actions = {
	*submitChanges( slug ) {
		if ( slug === undefined || slug === '' ) {
			return { error: `missing slug to call submitChanges() action.` };
		}
		const registry = yield Data.commonActions.getRegistry();
		if ( !! registry.dispatch( `modules/${ slug }` ) && !! registry.dispatch( `modules/${ slug }` ).submitChanges ) {
			return registry.dispatch( `modules/${ slug }` ).submitChanges();
		}
		return { error: `'modules/${ slug }' does not have a submitChanges() action.` };
	},
};

export const selectors = {
	isDoingSubmitChanges: createRegistrySelector( ( select ) => ( state, slug ) => {
		invariant( slug, 'slug is required.' );
		return !! select( `modules/${ slug }` ) && !! select( `modules/${ slug }` ).isDoingSubmitChanges && select( `modules/${ slug }` ).isDoingSubmitChanges();
	} ),
	canSubmitChanges: createRegistrySelector( ( select ) => ( state, slug ) => {
		invariant( slug, 'slug is required.' );
		return !! select( `modules/${ slug }` ) && !! select( `modules/${ slug }` ).canSubmitChanges && select( `modules/${ slug }` ).canSubmitChanges();
	} ),

};

export default {
	actions,
	selectors,
};
