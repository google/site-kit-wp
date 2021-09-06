<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->login( 'admin', 'password' );
		$I->activatePlugins(
			'google-site-kit-test-plugins/oauth-callback.php'
		);
	}

	public function _after( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->deactivatePlugins(
			'google-site-kit-test-plugins/oauth-callback.php'
		);
	}

	public function tryToTestSettings( Search_ConsoleTester $I ) {
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-splash' );
		$I->click( '.googlesitekit-start-setup' );
		$I->amOnPage( '/wp-admin/index.php?oauth2callback=1&code=valid-test-code&e2e-site-verification=1' );
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-settings' );
	}

}
