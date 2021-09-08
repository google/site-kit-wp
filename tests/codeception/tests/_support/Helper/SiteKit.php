<?php

namespace Helper;

// here you can define custom actions
// all public methods declared in helper class will be available in $I

class SiteKit extends \Codeception\Module {

	public function signIn() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->activatePlugins(
			'codeception-plugins/setup-bypass.php',
			'google-site-kit-test-plugins/oauth-callback.php'
		);

		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-splash' );
		$I->click( '.googlesitekit-start-setup' );
	}

	public function signOut() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->deactivatePlugins(
			'codeception-plugins/setup-bypass.php',
			'google-site-kit-test-plugins/proxy-auth.php',
			'google-site-kit-test-plugins/site-verification.php',
			'google-site-kit-test-plugins/oauth-callback.php'
		);
	}

}
