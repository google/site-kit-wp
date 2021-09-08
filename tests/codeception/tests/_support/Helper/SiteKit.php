<?php

namespace Helper;

// here you can define custom actions
// all public methods declared in helper class will be available in $I

class SiteKit extends \Codeception\Module {

	public function connectSiteKit() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->activatePlugins(
			'codeception-plugins/setup-bypass.php',
			'google-site-kit-test-plugins/oauth-callback.php'
		);

		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-splash' );
		$I->click( '.googlesitekit-start-setup' );
	}

	public function disconnectSiteKit() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->deactivatePlugins(
			'codeception-plugins/setup-bypass.php',
			'google-site-kit-test-plugins/proxy-auth.php',
			'google-site-kit-test-plugins/site-verification.php',
			'google-site-kit-test-plugins/oauth-callback.php'
		);
	}

	public function amOnDashboardPage() {
		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-dashboard' );
		$I->see( 'Site Overview', '.googlesitekit-dashboard__heading' );
	}

	public function amOnSettingsPage( $tab = '' ) {
		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-settings' );
		$I->see( 'Settings', '.googlesitekit-page-header' );

		if ( ! empty( $tab ) ) {
			$I->click( $tab );
		}
	}

	public function activateModule( $module ) {
		$I = $this;
		$I->amOnSettingsPage( 'Connect More Services' );
		$I->click( "Set up {$module}" );
	}

}
