const post_url = "https://noterook.net/book/{0}/?post={1}";
const book_url = "https://noterook.net/book/{0}/";
const inbox_url = "https://noterook.net/inbox/";

const notifs = {};

const event_handlers = {
	"nr:new_addition": handleNewAddition,
	"nr:new_post": handleNewPost,
	"nr:new_staple": handleNewStaple,
	"nr:post_stapled": handlePostStapled,
	"nr:post_stickered": handlePostStickered,
	"nr:followed": handleFollowed,
	"nr:new_ask": handleAsk
};

let enabled_users = [];

const avatars = {};

const formatString = (template, ...args) => {
	return template.replace(/{([0-9]+)}/g, function (match, index) {
		return typeof args[index] === "undefined" ? match : args[index];
	});
};

function getPlainText(html) {
	let span = document.getElementById("rooster-plain-text") || document.createElement("span");
	span.setAttribute("id", "rooster-plain-text");
	span.innerHTML = html;
	return span.innerText;
}

function getAvatarOrFallback(username, fallback, canonical) {
	if (avatars[username]) {
		return avatars[username];
	}
	if (canonical) {
		avatars[username] = fallback;
	}
	return fallback;
}

function createNotif(icon, title, body, action, timestamp) {
	return {
		icon: icon,
		title: title,
		body: body,
		action: action,
		timestamp: timestamp
	};
}

function handlePostStickered(data) {
	if (!checkUserNotificationsEnabled(data.sticker_by, data.recipient)) {
		return;
	}
	return createNotif(
		getAvatarOrFallback(data.sticker_by, data.sticker_by_avatar, true),
		(data.sticker_by_name || data.sticker_by) + " reacted " + data.emoji,
		"",
		formatString(post_url, data.recipient, data.post_id)
	);
}

function handleNewPost(data) {
	if (!checkUserNotificationsEnabled(data.author)) {
		return;
	}
	return createNotif(
		getAvatarOrFallback(data.author, data.author_avatar, true),
		(data.author_name || data.author) + " posted",
		getPlainText(data.body),
		formatString(post_url, data.author, data.post_id),
		Date.parse(data.created_at)
	);
}

function handleNewAddition(data) {
	let target_addition = data.post_id;
	for (const addition of data.additions) {
		if (addition.post_id === target_addition) {
			if (!checkUserNotificationsEnabled(addition.author, data.author)) {
				return;
			}
			return createNotif(
				getAvatarOrFallback(addition.author, data.author_avatar, false),
				(addition.author_name || addition.author) + " added",
				getPlainText(addition.body),
				formatString(post_url, addition.author, addition.post_id)
			);
		}
	}
}

function handlePostStapled(data) {
	if (!checkUserNotificationsEnabled(data.stapler)) {
		return;
	}
	return createNotif(
		getAvatarOrFallback(data.stapler, data.stapler_avatar, true),
		data.stapler + " stapled " + data.recipient + "'s post",
		"",
		formatString(post_url, data.stapler, data.post_id)
	);
}

function handleNewStaple(data) {
	if (!checkUserNotificationsEnabled(data.author)) {
		return;
	}
	return createNotif(
		getAvatarOrFallback(data.author, data.author_avatar, true),
		data.author + " stapled " + data.author_name + "'s post",
		"",
		formatString(post_url, data.author, data.post_id)
	);
}

function handleFollowed(data) {
	return createNotif(
		getAvatarOrFallback(data.username, data.avatar_url, true),
		(data.display_name || data.username) + " followed you",
		"",
		formatString(book_url, data.username)
	);
}

function handleAsk(data) {
	return createNotif(
		getAvatarOrFallback(data.sender, data.sender_avatar, true),
		(data.sender_name || data.sender) + " asked you",
		"",
		inbox_url
	);
}

function handleMessage(message) {
	let data = message.data;
	let handler = event_handlers[message.event];
	if (handler) {
		let notif = handler(data);
		console.log("Handing " + message.event);
		if (notif) {
			notify(notif);
		}
		return;
	}
	console.log("No handler for event: " + message.event);
	console.log(message.data);
}

function notify(notif) {
	let id = "";
	if (notif.action) {
		console.log(notif.action);
		id = notifs.length + "";
		notifs[id] = notif.action;
	}
	browser.notifications.create(
		id,
		{
			type: "basic",
			iconUrl: notif.icon,
			title: notif.title,
			message: notif.body
		}
	);
}

function handleAction(id) {
	if (notifs[id]) {
		browser.tabs.create(
			{
				url: notifs[id]
			}
		);
		notifs[id] = undefined;
	}
}

function checkUserNotificationsEnabled(...users) {
	if (enabled_users) {
		for (const user of users) {
			if (enabled_users.includes(user.toLowerCase())) {
				return true;
			}
		}
	}
	return false;
}

function loadSelectedUsers() {
	browser.storage.local.get("rooster_notified_users")
		   .then(
			   function (item) {
				   enabled_users = item.rooster_notified_users ?? [];
			   }, function (error) {
				   console.log(error);
			   }
		   );
}


browser.runtime.onMessage.addListener(handleMessage);
browser.notifications.onClicked.addListener(handleAction);
browser.storage.local.onChanged.addListener(loadSelectedUsers);
loadSelectedUsers();