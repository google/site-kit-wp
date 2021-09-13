<?php

class NewIdeasCest {

	public function _before( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->loginAsAdmin();
		$I->enableIdeaHubMocks();
		$I->connectSiteKit();
		$I->setupIdeaHub();
	}

	public function checkNewIdeas( Idea_HubTester $I ) {
		$I->amOnDashboardPage();

		$ideas = include __DIR__ . '/../../plugins/idea-hub/new-ideas.php';
		foreach ( $ideas as $idea ) {
			$id = sprintf( '.googlesitekit-idea-hub__idea--single[data-id="%s"]', $idea['name'] );

			$I->see( $idea['text'], $id );
			$I->see( $idea['topics'][0]['displayName'], $id );
		}
	}

}
