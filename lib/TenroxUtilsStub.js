/**
 * Copyright (c) 2016,
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

"use strict"

var method = TenroxUtils.prototype;



/*
 * Class variables
 */


/**
 * Tenrox Utils
 *
 * @classdesc Interface with Tenrox API.
 * @namespace tenroxUtils
 * @version  v1
 * @variation v1
 * @this TenroxUtils
 * @param {object=} params - Options for Tenrox
 * @param {string} params.org - The name of your company as registered with Tenrox.
 * @param {string} params.user - Your username on the Tenrox system.
 * @param {string} params.password - Your password on the Tenrox system.
 */

function TenroxUtils(params) {
  // Stubbed
}



/**
 * tenroxUtils.getTimesheetEntries
 *
 * @desc Gets all timesheet entries between two specified dates.
 *
 *
 * @alias tenroxUtils.getTimesheetEntries
 * @memberOf! tenroxUtils(v1)
 *
 * @param {object=} params - Parameters for request (currently there are none)
 * @param {callback} callback - The callback that handles the response. It provides an array with a set of timesheet entries that matched the criteria.
 *
 */
method.getTimesheetEntries = function (params,callback) {

  callback(null,[]);
      
}




// export the class
module.exports = TenroxUtils;
