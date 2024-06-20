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

use Google\Service\SubscribewithGoogle\ListPublicationsResponse;

/**
 * The "publications" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google\Service\SubscribewithGoogle(...);
 *   $publications = $subscribewithgoogleService->publications;
 *  </code>
 */
class Publications extends \Google\Service\Resource
{
  /**
   * List all publications based on the filter, only the publications owned by the
   * current user will be returned (publications.listPublications)
   *
   * @param array $optParams Optional parameters.
   *
   * @opt_param string filter Filters the publications list. e.g.
   * verified_domains: "xyz.com" Grammar defined as https://google.aip.dev/160.
   * @opt_param int pageSize LINT.IfChange The maximum number of publications to
   * return, the service may return fewer than this value. if unspecified, at most
   * 100 publications will be returned. The maximum value is 1000; values above
   * 1000 will be coerced to 1000. LINT.ThenChange(//depot/google3/java/com/google
   * /subscribewithgoogle/client/opservice/ListPublicationsPromiseGraph.java)
   * @opt_param string pageToken A token identifying a page of results the server
   * should return.
   * @return ListPublicationsResponse
   * @throws \Google\Service\Exception
   */
  public function listPublications($optParams = [])
  {
    $params = [];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListPublicationsResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Publications::class, 'Google_Service_SubscribewithGoogle_Resource_Publications');
