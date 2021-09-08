<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->login( 'admin', 'password' );
		$I->signIn();
	}

	public function _after( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->signOut();
	}

	public function tryToTestSettings( Search_ConsoleTester $I ) {
		$I->amOnPage( '/wp-admin/admin.php?page=googlesitekit-settings' );
		$I->see( 'Settings', '.googlesitekit-page-header' );
	}

}
