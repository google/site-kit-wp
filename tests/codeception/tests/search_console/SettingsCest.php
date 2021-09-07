<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->login( 'admin', 'password' );
		$I->activatePlugins(
			'codeception-plugins/setup-bypass.php',
			'google-site-kit-test-plugins/oauth-callback.php'
		);
	}

	public function _after( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->deactivatePlugins(
			'codeception-plugins/setup-bypass.php',
			'google-site-kit-test-plugins/proxy-auth.php',
			'google-site-kit-test-plugins/site-verification.php',
			'google-site-kit-test-plugins/oauth-callback.php'
		);
	}

	public function tryToTestSettings( Search_ConsoleTester $I ) {
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-splash' );
		$I->click( '.googlesitekit-start-setup' );
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-settings' );
		$I->makeScreenshot();
	}

}
