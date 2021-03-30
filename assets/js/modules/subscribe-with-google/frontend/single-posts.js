import { handleSubscribeClicks, handleContributeClicks } from './buttons';
import { handlePaymentResponse } from './payments';
import { unlockPageMaybe } from './unlock';

// Wait for SwG API to become available.
( self.SWG = self.SWG || [] ).push( async ( swg ) => {
	// Handle payment response.
	handlePaymentResponse( swg );

	// Handle button clicks.
	handleSubscribeClicks( swg );
	handleContributeClicks( swg );

	// Unlock page if possible.
	return unlockPageMaybe( swg );
} );
