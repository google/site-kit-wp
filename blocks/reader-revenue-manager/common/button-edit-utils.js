export function getNoticeAndDisabled( {
	paymentOption,
	requiredPaymentOption,
	hasModuleAccess,
	postProductID,
	snippetMode,
	postTypes,
	postType,
	invalidPaymentOptionWithModuleAccessNotice,
	invalidPaymentOptionWithoutModuleAccessNotice,
	noSnippetWithModuleAccessNotice,
	noSnippetWithoutModuleAccessNotice,
} ) {
	if ( paymentOption !== requiredPaymentOption ) {
		return {
			disabled: true,
			notice: hasModuleAccess
				? invalidPaymentOptionWithModuleAccessNotice
				: invalidPaymentOptionWithoutModuleAccessNotice,
		};
	}

	if (
		postProductID === 'none' ||
		( ! postProductID && snippetMode === 'per_post' ) ||
		( ! postProductID &&
			snippetMode === 'post_types' &&
			! postTypes.includes( postType ) )
	) {
		return {
			disabled: true,
			notice: hasModuleAccess
				? noSnippetWithModuleAccessNotice
				: noSnippetWithoutModuleAccessNotice,
		};
	}

	return {
		disabled: false,
		notice: null,
	};
}
