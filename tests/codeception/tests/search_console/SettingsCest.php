<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->login( 'admin', 'password' );
		$I->activate_plugins(
			'google-site-kit-test-plugins/google-services-mock.php'
		);
	}

	public function _after( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->deactivate_plugins(
			'google-site-kit-test-plugins/google-services-mock.php'
		);
	}

	public function tryToTest( Search_ConsoleTester $I ) {
	}

}
