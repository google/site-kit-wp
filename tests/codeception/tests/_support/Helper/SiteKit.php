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

	public function activateModule( $module, array $settings ) {
		$I = $this->getModule( 'REST' );

		$I->sendPost(
			'core/modules/data/activation',
			array(
				'data' => array(
					'slug'   => $module,
					'active' => true,
				),
			)
		);

		$I->sendPost(
			"modules/{$module}/data/settings",
			array(
				'data' => $settings,
			)
		);
	}

}
