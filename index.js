
const ipc = require('electron')
	.ipcRenderer;
const slackAPI = require('./slackAPI');

let nodeRequirePath = ipc.sendSync('getRequirePath') + 'node_modules/';
window.$ = window.jQuery = require(nodeRequirePath + 'jquery');

const keytar = require(nodeRequirePath + 'keytar');
const _ = require(nodeRequirePath + 'lodash')
// const ioHook = require(nodeRequirePath + 'iohook');

const {
	ipcRenderer,
	remote
} = require('electron')
const {
	globalShortcut,
	BrowserWindow
} = remote
let access_token;
globalShortcut.unregisterAll();


function saveShortcuts() {
	var keyInfo = []
	var rows = $('table.functionKeysShort tr:not(:first-child)');
	var rowInfo = {};
	console.log(rows.length);
	_.each(rows, function(_row) {
		rowInfo = {};
		rowInfo.keystroke = $(_row)
			.find('td:nth-child(1)')
			.html();
		rowInfo.emoticon = $(_row)
			.find('td:nth-child(2)')
			.html();
		rowInfo.statusText = $(_row)
			.find('td:nth-child(3)')
			.html();
		rowInfo.notes = $(_row)
			.find('td:nth-child(4)')
			.html();
		rowInfo.setAway = $(_row)
			.find('td:nth-child(5) input[type="checkbox"]')
			.is(":checked");
		rowInfo.setActive = $(_row)
			.find('td:nth-child(6) input[type="checkbox"]')
			.is(":checked");
		keyInfo.push(rowInfo);
	})
	localStorage.setItem('slack-status--shortcuts', JSON.stringify(keyInfo))
	alert('Shortcuts saved');
}


function loadShortcuts() {
	var rowInfo = {};
	var _keyInfo = localStorage.getItem('slack-status--shortcuts');
	var keyInfo = JSON.parse(_keyInfo);
	console.log(keyInfo);
	_.each(keyInfo, function(_row, _index) {
		console.log(_index);
		_row = $('table.functionKeysShort tr:nth-child(' + parseInt(_index + 2) + ')');

		$(_row)
			.find('td:nth-child(1)')
			.html(keyInfo[_index].keystroke);
		$(_row)
			.find('td:nth-child(2)')
			.html(keyInfo[_index].emoticon);
		$(_row)
			.find('td:nth-child(3)')
			.html(keyInfo[_index].statusText);
		$(_row)
			.find('td:nth-child(4)')
			.html(keyInfo[_index].notes);
		$(_row)
			.find('td:nth-child(5) input[type="checkbox"]')
			.prop('checked', keyInfo[_index].setAway);
		$(_row)
			.find('td:nth-child(6) input[type="checkbox"]')
			.prop('checked', keyInfo[_index].setActive);
		keyInfo.push(rowInfo);
	})
}

function setupShortcuts() {
	slackAPI.setUserToken(access_token)

	var ret = globalShortcut.register('F15', () => {
		return slackAPI.setPresence('away')
			.catch((error) => {
				console.log('error');
				console.log(error);
			})
	})

	var ret = globalShortcut.register('F16', () => {
		return slackAPI.setPresence('auto')
			.then((response) => {
				slackAPI.setUserStatus(':calendar:', '30 minute meeting')
			})
			.catch((error) => {
				console.log(error);
				console.log('error');
			})
	})

	var ret = globalShortcut.register('F17', () => {
		return slackAPI.setPresence('auto')
			.then((response) => {
				slackAPI.setUserStatus(':calendar:', '60 minute meeting')
			})
			.catch((error) => {
				console.log('error');
			})
	})
	var ret = globalShortcut.register('F18', () => {
		return slackAPI.setUserStatus(':hamburger:', 'Lunch')
			.then((response) => {
				slackAPI.setPresence('away')
			})
			.catch((error) => {
				console.log('error');
			})
	})
	var ret = globalShortcut.register('F19', () => {
		return slackAPI.setUserStatus('', '')
			.then((response) => {
				slackAPI.setPresence('auto')
			})
			.catch((error) => {
				console.log('error');
			})
	})
    loadShortcuts();
}

function openSignInWindow() {

	var authWindow = new BrowserWindow({
		width: 800,
		height: 600,
		show: false,
		'node-integration': true,
		'web-security': true
	});

	var authUrl = 'https://slack.com/oauth/v2/authorize?user_scope=users:write,users.profile:read,users.profile:write,search:read,team:read&client_id=1180902083079.1201832709284&redirect_uri=https://www.wrist-view.net/handle_slack_redirect.php'

	authWindow.loadURL(authUrl);
	authWindow.show();
	authWindow.webContents.on('will-navigate', function(event, newUrl) {
		console.log('here in will-navigate')
		console.log(newUrl);
		// More complex code to handle tokens goes here
	});

	authWindow.webContents.on('did-redirect-navigation', function(event, newUrl) {
		if (newUrl.indexOf('https://www.wrist-view.net/handle_slack_redirect.php') > -1) {
			authWindow.webContents.executeJavaScript('document.title')
				.then((result) => {
					var code = result;
					$.ajax({
						url: "https://slack.com/api/oauth.v2.access?client_id=1180902083079.1201832709284&client_secret=d7c62c0e1fb2679825ef5f3f61ac5f34&code=" + code,
						success: function(result) {
							var slackUserInfo = {
								authed_user: result.authed_user,
								team_id: result.team.id
							}
							keytar.setPassword('slack-status', 'userInfo', JSON.stringify(slackUserInfo))
							authWindow.close();
						}
					});
				})
		}

	});

	authWindow.on('closed', function() {
		authWindow = null;
	});
}

function startUp() {
    console.log('here in startUp');
    keytar.getPassword('slack-status', 'userInfo')
        .then((_userInfo) => {
            if (_userInfo) {
                let userInfo = JSON.parse(_userInfo);
                if (userInfo.authed_user.access_token) {
                    console.log('we got it!!!');
                    $('#signInWithSlack')
                        .remove();
                    access_token = userInfo.authed_user.access_token;
                    console.log(access_token);
                    setupShortcuts();
                }
            }
        })
}
startUp();
