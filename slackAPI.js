var token = '';
var presence;

var defaultParams = {
	type: 'POST',
	data: {},
	url: '',
	success: function(result) {}
}


var slackAPI = (function() {

	function makeHttpCall(params) {

		return new Promise((resolve, reject) => {
			$.ajax(params)
				.done(function(results) {
					resolve(results)
				})
				.fail(function(error) {
					reject(error)
				})
		})

	}


	function setUserToken(_token) {
		token = _token;
	}

	function setPresence(_presence) {
		if (presence != _presence) {
			presence = _presence;
			var params = defaultParams;
			params.url = 'https://slack.com/api/users.setPresence'
			params.data = {
				token: access_token,
				presence: _presence
			}
			return makeHttpCall(params)
		} else {
			return Promise.resolve();
		}
	}

	function setUserStatus(emoticon, statusText) {
		var params = defaultParams;
		params.url = 'https://slack.com/api/users.profile.set?token' + access_token;
		params.url += '&profile={"status_emoji":"' + emoticon + '","status_text":"' + statusText + '"}'
		console.log('right before make http call...user status')
		return makeHttpCall(params)
	}


	return {
		setUserToken: setUserToken,
		setPresence: setPresence,
		setUserStatus: setUserStatus
	};
})();

module.exports = slackAPI;
