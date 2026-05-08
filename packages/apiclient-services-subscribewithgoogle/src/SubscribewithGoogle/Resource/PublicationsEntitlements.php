<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle\Resource;

use Google\Service\SubscribewithGoogle\ListEntitlementsResponse;

/**
 * The "entitlements" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google\Service\SubscribewithGoogle(...);
 *   $entitlements = $subscribewithgoogleService->publications_entitlements;
 *  </code>
 */
class PublicationsEntitlements extends \Google\Service\Resource
{
  /**
   * Gets a set of entitlements for the user for this publication. The publication
   * can fetch entitlements on behalf of a user authenticated via OAuth2.
   * (entitlements.listPublicationsEntitlements)
   *
   * @param string $publicationId Mapped to the URL.
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Requested page size. If unspecified, server will pick
   * an appropriate default.
   * @opt_param string pageToken A token identifying a page of results the server
   * should return. Typically, this is the value of
   * ListEntitlementsResponse.next_page_token returned from the previous call to
   * `ListEntitlements` method.
   * @return ListEntitlementsResponse
   * @throws \Google\Service\Exception
   */
  public function listPublicationsEntitlements($publicationId, $optParams = [])
  {
    $params = ['publicationId' => $publicationId];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListEntitlementsResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PublicationsEntitlements::class, 'Google_Service_SubscribewithGoogle_Resource_PublicationsEntitlements');
